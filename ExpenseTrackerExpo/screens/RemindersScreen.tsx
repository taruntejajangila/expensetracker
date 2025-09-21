import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  RefreshControl,
  Modal,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import new components and types
import { Reminder } from '../types/PaymentTypes';
import TransactionAnalysisService from '../services/TransactionAnalysisService';
import ReminderService from '../services/ReminderService';
import { calculateDaysUntilDue, getUrgencyColor, formatDate } from '../utils/PaymentUtils';

// Configure notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});


const RemindersScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { user } = useAuth();
  
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{
    reminder: any;
    daysUntilDue: number;
    type: 'loan' | 'smart' | 'custom';
  } | null>(null);
  
  // New state for reminders
  const [autoReminders, setAutoReminders] = useState<Reminder[]>([]);
  const [smartReminders, setSmartReminders] = useState<Reminder[]>([]);
  const [manualReminders, setManualReminders] = useState<Reminder[]>([]);
  
  // State for paid items
  const [paidItems, setPaidItems] = useState<{ [key: string]: { type: 'loan' | 'smart' | 'custom', reminder: any, paidAt: Date } }>({});
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'general' as Reminder['type'],
    date: new Date(),
    time: '09:00',
    isEnabled: true,
    repeat: 'none' as Reminder['repeat'],
    category: '',
    amount: '',
  });

  // Sample reminder types with icons and colors
  const reminderTypes = [
    { key: 'expense', label: 'Expense Reminder', icon: 'receipt-outline', color: '#FF3B30' },
    { key: 'income', label: 'Income Reminder', icon: 'arrow-down-outline', color: '#34C759' },
    { key: 'budget', label: 'Budget Check', icon: 'pie-chart-outline', color: '#2196F3' },
    { key: 'goal', label: 'Goal Check', icon: 'flag-outline', color: '#FF9500' },
    { key: 'payment', label: 'Payment Due', icon: 'card-outline', color: '#AF52DE' },
    { key: 'general', label: 'General', icon: 'alarm-outline', color: '#8E8E93' },
  ];

  const repeatOptions = [
    { key: 'none', label: 'No Repeat' },
    { key: 'daily', label: 'Daily' },
    { key: 'weekly', label: 'Weekly' },
    { key: 'monthly', label: 'Monthly' },
  ];

  useEffect(() => {
    loadReminders();
    requestNotificationPermissions();
    
    // Clean up expired paid items on component load
    cleanupExpiredPaidItems();
    
    // Set up periodic cleanup every 30 minutes
    const cleanupInterval = setInterval(() => {
      cleanupExpiredPaidItems();
    }, 30 * 60 * 1000); // 30 minutes
    
    // Set up notification listeners
    const notificationListener = Notifications.addNotificationReceivedListener(notification => {
      // Handle notification received
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      // Handle notification tap - could navigate to specific reminder
    });

    return () => {
      // Clear the cleanup interval
      clearInterval(cleanupInterval);
      
      // Note: removeNotificationSubscription is deprecated in newer versions
      // The subscription objects will be automatically cleaned up when component unmounts
      if (notificationListener && typeof notificationListener.remove === 'function') {
        notificationListener.remove();
      }
      if (responseListener && typeof responseListener.remove === 'function') {
        responseListener.remove();
      }
    };
  }, []);

  const requestNotificationPermissions = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please enable notifications to receive reminder alerts.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      // Handle notification permission error silently
    }
  };

  const loadManualReminders = async () => {
    try {
      const userId = (user as any)?.email || (user as any)?.uid || 'default';
      const key = `manual_reminders_${userId}`;
      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const reminders = JSON.parse(stored).map((r: any) => ({
          ...r,
          date: new Date(r.date),
          dueDate: new Date(r.dueDate),
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt),
        }));
        return reminders;
      }
      return [];
    } catch (error) {
      return [];
    }
  };

  const saveManualReminders = async (reminders: Reminder[]) => {
    try {
      const userId = (user as any)?.email || (user as any)?.uid || 'default';
      const key = `manual_reminders_${userId}`;
      await AsyncStorage.setItem(key, JSON.stringify(reminders));
    } catch (error) {
      // Handle save error silently
    }
  };

  const loadReminders = async () => {
    try {
      setLoading(true);
      
      // Clear all existing data to prevent duplicates
      const userId = (user as any)?.email || (user as any)?.uid || undefined;
      await TransactionAnalysisService.clearUserData(userId);
      
      // Generate loan EMI reminders
      const loanEMIReminders = await TransactionAnalysisService.generateLoanEMIReminders(userId);
      // Deduplicate loan EMI reminders by ID
      const uniqueLoanReminders = loanEMIReminders.filter((reminder, index, self) => 
        index === self.findIndex(r => r.id === reminder.id)
      );
      setAutoReminders(uniqueLoanReminders);
      
      // Generate smart reminders from transaction analysis
      const smartRemindersData = await TransactionAnalysisService.generateSmartReminders(userId);
      // Deduplicate smart reminders by ID
      const uniqueSmartReminders = smartRemindersData.filter((reminder, index, self) => 
        index === self.findIndex(r => r.id === reminder.id)
      );
      setSmartReminders(uniqueSmartReminders);
      
      // Load reminders from backend API with local fallback (hybrid service)
      // Note: ReminderService.getReminders() already includes both API and local reminders
      const allManualReminders = await ReminderService.getReminders();
      
      // Deduplicate reminders by ID to prevent React key conflicts
      const uniqueManualReminders = allManualReminders.filter((reminder, index, self) => 
        index === self.findIndex(r => r.id === reminder.id)
      );
      
      setManualReminders(uniqueManualReminders);
      
      // Combine all reminders for backward compatibility
      const allReminders = [...uniqueLoanReminders, ...uniqueSmartReminders, ...uniqueManualReminders];
      setReminders(allReminders);
      
    } catch (error) {
      Alert.alert('Error', 'Failed to load reminders');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = (reminder: any, type: 'loan' | 'smart' | 'custom') => {
    const daysUntilDue = calculateDaysUntilDue(reminder.dueDate);
    
    // Always show confirmation modal
    setConfirmModalData({ reminder, daysUntilDue, type });
    setShowConfirmModal(true);
  };

  const confirmMarkAsPaid = (reminder: any, type: 'loan' | 'smart' | 'custom') => {
    // Mark item as paid
    setPaidItems(prev => ({
      ...prev,
      [reminder.id]: {
        type,
        reminder,
        paidAt: new Date()
      }
    }));
    
    const successMessage = type === 'loan' ? 'Loan EMI' : type === 'smart' ? 'Payment' : 'Custom reminder';
    Alert.alert('Success', `${successMessage} marked as paid successfully.`);
    
    // Close confirmation modal
    setShowConfirmModal(false);
    setConfirmModalData(null);
  };

  const revertPayment = (reminderId: string) => {
    setPaidItems(prev => {
      const newPaidItems = { ...prev };
      delete newPaidItems[reminderId];
      return newPaidItems;
    });
    
    Alert.alert('Success', 'Payment reverted successfully.');
  };

  const cleanupExpiredPaidItems = () => {
    const now = new Date();
    const twoDaysInMs = 2 * 24 * 60 * 60 * 1000; // 2 days in milliseconds
    
    setPaidItems(prev => {
      const updatedPaidItems = { ...prev };
      let removedCount = 0;
      
      Object.keys(updatedPaidItems).forEach(reminderId => {
        const paidItem = updatedPaidItems[reminderId];
        const timeSincePaid = now.getTime() - paidItem.paidAt.getTime();
        
        if (timeSincePaid > twoDaysInMs) {
          delete updatedPaidItems[reminderId];
          removedCount++;
        }
      });
      
      // Cleaned up expired paid reminders
      
      return updatedPaidItems;
    });
  };

  const getTimeRemainingUntilRemoval = (paidAt: Date) => {
    const now = new Date();
    const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
    const timeSincePaid = now.getTime() - paidAt.getTime();
    const timeRemaining = twoDaysInMs - timeSincePaid;
    
    if (timeRemaining <= 0) return null;
    
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
    const daysRemaining = Math.floor(hoursRemaining / 24);
    
    if (daysRemaining > 0) {
      return `${daysRemaining} day${daysRemaining > 1 ? 's' : ''} left`;
    } else {
      return `${hoursRemaining} hour${hoursRemaining > 1 ? 's' : ''} left`;
    }
  };

  const closeConfirmModal = () => {
    setShowConfirmModal(false);
    setConfirmModalData(null);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // Sync with backend first
      await ReminderService.syncReminders();
      // Clean up expired paid items on refresh
      cleanupExpiredPaidItems();
      // Then reload all reminders
      await loadReminders();
    } catch (error) {
      // Still try to load reminders even if sync fails
      await loadReminders();
    }
    setRefreshing(false);
  };



  const scheduleNotification = async (reminder: Reminder) => {
    try {
      // Create the notification date
      const [hours, minutes] = reminder.time.split(':').map(Number);
      const notificationDate = new Date(reminder.date);
      notificationDate.setHours(hours, minutes, 0, 0);
      
      // If the date is in the past, schedule for tomorrow
      if (notificationDate < new Date()) {
        notificationDate.setDate(notificationDate.getDate() + 1);
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminder.description,
          data: { 
            reminderId: reminder.id,
            type: reminder.type,
            category: reminder.category || 'General'
          },
          sound: 'default',
        },
        trigger: notificationDate as any,
      });
      
      return notificationId;
    } catch (error) {
      return null;
    }
  };

  const cancelNotification = async (reminderId: string) => {
    try {
      // Get all scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      // Find and cancel notifications for this reminder
      for (const notification of scheduledNotifications) {
        if (notification.content.data?.reminderId === reminderId) {
          await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        }
      }
    } catch (error) {
      // Handle notification cancellation error silently
    }
  };

  const handleSaveReminder = async () => {
    if (!formData.title.trim()) {
      Alert.alert('Error', 'Please enter a reminder title');
      return;
    }

    try {
      const newReminder: Reminder = {
        id: editingReminder?.id || Date.now().toString(),
        title: formData.title.trim(),
        description: formData.description.trim(),
        type: formData.type,
        date: formData.date,
        time: formData.time,
        isEnabled: formData.isEnabled,
        repeat: formData.repeat,
        category: formData.category.trim() || undefined,
        amount: formData.amount ? parseFloat(formData.amount) : undefined,
        // Required fields from PaymentTypes.ts
        isAutoGenerated: false,
        dueDate: formData.date,
        reminderType: 'upcoming',
        originalAmount: formData.amount ? parseFloat(formData.amount) : 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (editingReminder) {
        // Update existing reminder via API
        const result = await ReminderService.updateReminder(editingReminder.id, newReminder);
        if (result.success) {
          // Update local state
          setReminders(prev => prev.map(r => r.id === editingReminder.id ? newReminder : r));
          const updatedManualReminders = manualReminders.map(r => r.id === editingReminder.id ? newReminder : r);
          setManualReminders(updatedManualReminders);
          
          // Also save to local storage for backward compatibility
          await saveManualReminders(updatedManualReminders);
        } else {
          throw new Error('Failed to update reminder');
        }
      } else {
        // Create new reminder via API
        const result = await ReminderService.createReminder(newReminder);
        if (result.success && result.id) {
          // Update the reminder with the API-generated ID
          const reminderWithId = { ...newReminder, id: result.id };
          
          // Update local state
          setReminders(prev => [...prev, reminderWithId]);
          const updatedManualReminders = [...manualReminders, reminderWithId];
          setManualReminders(updatedManualReminders);
          
          // Also save to local storage for backward compatibility
          await saveManualReminders(updatedManualReminders);
        } else {
          throw new Error('Failed to create reminder');
        }
      }

      // Schedule notification if enabled
      if (newReminder.isEnabled) {
        await scheduleNotification(newReminder);
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        type: 'general',
        date: new Date(),
        time: '09:00',
        isEnabled: true,
        repeat: 'none',
        category: '',
        amount: '',
      });
      setShowAddModal(false);
      setEditingReminder(null);
    } catch (error) {
      Alert.alert('Error', `Failed to save reminder: ${error.message}`);
    }
  };

  const handleEditReminder = (reminder: Reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description,
      type: reminder.type,
      date: reminder.date,
      time: reminder.time,
      isEnabled: reminder.isEnabled,
      repeat: reminder.repeat,
      category: reminder.category || '',
      amount: reminder.amount?.toString() || '',
    });
    setShowAddModal(true);
  };

  const handleDeleteReminder = (reminderId: string) => {
    Alert.alert(
      'Delete Reminder',
      'Are you sure you want to delete this reminder?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await cancelNotification(reminderId);
            setReminders(prev => prev.filter(r => r.id !== reminderId));
            const updatedManualReminders = manualReminders.filter(r => r.id !== reminderId);
            setManualReminders(updatedManualReminders);
            await saveManualReminders(updatedManualReminders);
          },
        },
      ]
    );
  };


  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeInfo = (type: Reminder['type']) => {
    return reminderTypes.find(t => t.key === type) || reminderTypes[reminderTypes.length - 1];
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    // Header Styles - Matching AccountsScreen
    headerContainer: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      minWidth: 60,
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerRight: {
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 60,
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: 12,
      fontWeight: '400',
      textAlign: 'center',
      opacity: 0.8,
      marginTop: 2,
    },
    addButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    content: {
      flex: 1,
      paddingHorizontal: theme.spacing.md,
    },
  reminderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: theme.spacing.sm,
    paddingLeft: theme.spacing.md,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
    reminderTypeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    reminderTypeIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
    },
    reminderTypeText: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      flex: 1,
    },
    reminderToggle: {
      marginLeft: 8,
    },
  reminderTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 3,
  },
  reminderDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 6,
  },
  reminderDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
    reminderDateTime: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    reminderDate: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginRight: 8,
    },
    reminderTime: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    reminderCategory: {
      fontSize: 12,
      color: '#007AFF',
      fontWeight: '500',
    },
    reminderAmount: {
      fontSize: 14,
      fontWeight: 'bold',
      color: '#34C759',
    },
  reminderActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  compactPayButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  compactPayButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  // Paid reminder card styles
  paidReminderCard: {
    opacity: 0.8,
    backgroundColor: '#F8F9FA',
    borderColor: '#34C759',
    borderWidth: 1,
  },
  // Confirmation Modal Styles
  confirmModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: 20,
    maxWidth: 400,
    alignSelf: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  confirmModalHeader: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  confirmModalIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF950015',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  confirmModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1C1C1E',
  },
  confirmModalBody: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  confirmModalMessage: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: '#3A3A3C',
    marginBottom: 20,
    lineHeight: 22,
  },
  confirmModalDetails: {
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  confirmModalDetailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  confirmModalDetailAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 8,
  },
  confirmModalDetailDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3A3A3C',
    marginBottom: 4,
  },
  confirmModalDetailTime: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FF9500',
  },
  confirmModalNote: {
    fontSize: 14,
    fontWeight: '400',
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 20,
  },
  confirmModalActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  confirmModalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmModalCancelButton: {
    backgroundColor: '#F2F2F7',
  },
  confirmModalConfirmButton: {
    backgroundColor: '#007AFF',
  },
  confirmModalCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3A3A3C',
  },
  confirmModalConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
    actionButton: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      marginLeft: 8,
    },
    editButton: {
      backgroundColor: '#007AFF15',
    },
    deleteButton: {
      backgroundColor: '#FF3B3015',
    },
    actionButtonText: {
      fontSize: 12,
      fontWeight: '600',
    },
    editButtonText: {
      color: '#007AFF',
    },
    deleteButtonText: {
      color: '#FF3B30',
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
    },
    // Main Empty State Styles
    mainEmptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.xl,
      paddingVertical: theme.spacing.xl,
      minHeight: 400,
    },
    mainEmptyContent: {
      alignItems: 'center',
      maxWidth: 300,
    },
    mainEmptyTitle: {
      fontSize: 24,
      fontWeight: '700',
      color: theme.colors.text,
      textAlign: 'center',
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
    },
    mainEmptySubtitle: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: theme.spacing.xl,
    },
    emptyActionButtons: {
      width: '100%',
      gap: theme.spacing.md,
    },
    emptyActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.lg,
      borderRadius: 12,
      gap: theme.spacing.sm,
    },
    primaryActionButton: {
      backgroundColor: '#007AFF',
      shadowColor: '#007AFF',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    secondaryActionButton: {
      backgroundColor: 'transparent',
      borderWidth: 2,
      borderColor: '#007AFF',
    },
    primaryActionButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    secondaryActionButtonText: {
      color: '#007AFF',
      fontSize: 16,
      fontWeight: '600',
    },
    emptyIcon: {
      marginBottom: 16,
    },
    emptyTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 24,
    },
    createButton: {
      backgroundColor: '#007AFF',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 25,
    },
    createButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContent: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: theme.spacing.lg,
      width: '90%',
      maxHeight: '80%',
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 20,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    closeButton: {
      padding: 4,
    },
    formGroup: {
      marginBottom: 16,
    },
    formLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 8,
    },
    textInput: {
      borderWidth: 1,
      borderColor: '#E0E0E0',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 16,
      color: theme.colors.text,
    },
    textArea: {
      height: 80,
      textAlignVertical: 'top',
    },
    typeSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
    },
    typeOption: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
      marginBottom: 8,
      borderWidth: 1,
      borderColor: '#E0E0E0',
    },
    typeOptionSelected: {
      backgroundColor: '#007AFF15',
      borderColor: '#007AFF',
    },
    typeOptionIcon: {
      marginRight: 6,
    },
    typeOptionText: {
      fontSize: 12,
      fontWeight: '500',
      color: theme.colors.text,
    },
    dateTimeRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    dateTimeInput: {
      flex: 1,
      marginRight: 8,
    },
    timeInput: {
      flex: 0.4,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    saveButton: {
      backgroundColor: '#007AFF',
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 16,
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '600',
    },

  // New styles for recurring payments
  section: {
    marginBottom: theme.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  addSectionButton: {
    padding: 4,
  },
  emptySection: {
    alignItems: 'center',
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  emptySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  emptySectionSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  autoReminderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: theme.spacing.sm,
    paddingLeft: theme.spacing.md,
    marginVertical: 4,
    marginHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  payNowButton: {
    backgroundColor: '#34C759',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
  },
  smartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF950015',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  smartBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF9500',
    marginLeft: 4,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  smartReminderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: theme.spacing.sm,
    paddingLeft: theme.spacing.md,
    marginVertical: 4,
    marginHorizontal: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  createTemplateButton: {
    backgroundColor: '#007AFF15',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
  },
  
});

  // Header Component - Matching AccountsScreen
  const ScreenHeader: React.FC<{ theme: any; insets: any }> = ({ theme, insets }) => {
    const headerPaddingTop = Platform.OS === 'android' ? insets.top + 5 : insets.top + 10;
    
    return (
      <View style={[styles.headerContainer, { paddingTop: headerPaddingTop, backgroundColor: theme.colors.background }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                navigation.goBack();
              }}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]} allowFontScaling={false}>
              Reminders
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              Manage your reminders
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader theme={theme} insets={insets} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyTitle}>Loading reminders...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header with Safe Area - Matching AccountsScreen */}
      <ScreenHeader theme={theme} insets={insets} />


      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Main Empty State - Show when all sections are empty */}
        {autoReminders.length === 0 && smartReminders.length === 0 && manualReminders.length === 0 && !loading && (
          <View style={styles.mainEmptyContainer}>
            <View style={styles.mainEmptyContent}>
              <Ionicons name="alarm-outline" size={80} color="#CCCCCC" />
              <Text style={styles.mainEmptyTitle} allowFontScaling={false}>No Reminders Yet</Text>
              <Text style={styles.mainEmptySubtitle} allowFontScaling={false}>
                Add loans to see EMI reminders, or create custom reminders to stay on top of your finances
              </Text>
              
              <View style={styles.emptyActionButtons}>
                <TouchableOpacity
                  style={[styles.emptyActionButton, styles.primaryActionButton]}
                  onPress={() => {
                    // Navigate to Loans screen
                    (navigation as any).navigate('MainApp', { screen: 'Loans' });
                  }}
                >
                  <Ionicons name="document-text-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.primaryActionButtonText} allowFontScaling={false}>Add Loan</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.emptyActionButton, styles.secondaryActionButton]}
                  onPress={() => setShowAddModal(true)}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#007AFF" />
                  <Text style={styles.secondaryActionButtonText} allowFontScaling={false}>Add Custom Reminder</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Regular Content - Show when there are reminders */}
        {!(autoReminders.length === 0 && smartReminders.length === 0 && manualReminders.length === 0) && (
          <>

        {/* Upcoming Payments Section - Loan EMIs and other recurring payments */}
        {autoReminders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle} allowFontScaling={false}>Upcoming Payments</Text>
            </View>
            <Text style={styles.sectionSubtitle} allowFontScaling={false}>
              Loan EMIs and other recurring payments due soon
            </Text>
            {/* Unpaid items */}
            {autoReminders
              .filter(reminder => !paidItems[reminder.id])
              .map((reminder) => {
                const daysUntilDue = calculateDaysUntilDue(reminder.dueDate);
                const urgencyColor = getUrgencyColor(daysUntilDue);
                
                return (
                  <View key={reminder.id} style={styles.autoReminderCard}>
                    <View style={styles.reminderHeader}>
                      <View style={styles.reminderTypeContainer}>
                        <View style={[styles.reminderTypeIcon, { backgroundColor: urgencyColor + '15' }]}>
                          <Ionicons name="alarm" size={18} color={urgencyColor} />
                        </View>
                        <Text style={styles.reminderTypeText}>Loan EMI</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.compactPayButton, { backgroundColor: urgencyColor }]}
                        onPress={() => handleMarkAsPaid(reminder, 'loan')}
                      >
                        <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                        <Text style={styles.compactPayButtonText}>Mark as Paid</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.reminderTitle}>{reminder.title}</Text>
                    <Text style={styles.reminderDescription}>{reminder.description}</Text>

                    <View style={styles.reminderDetails}>
                      <View style={styles.reminderDateTime}>
                        <Text style={styles.reminderDate}>{formatDate(reminder.dueDate)}</Text>
                        <Text style={styles.reminderTime}>{reminder.time}</Text>
                      </View>
                      <Text style={[styles.reminderAmount, { color: urgencyColor }]}>
                        ₹{reminder.amount?.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            
            {/* Paid items */}
            {autoReminders
              .filter(reminder => paidItems[reminder.id] && paidItems[reminder.id].type === 'loan')
              .map((reminder) => {
                const paidInfo = paidItems[reminder.id];
                
                return (
                  <View key={`paid-${reminder.id}`} style={[styles.autoReminderCard, styles.paidReminderCard]}>
                    <View style={styles.reminderHeader}>
                      <View style={styles.reminderTypeContainer}>
                        <View style={[styles.reminderTypeIcon, { backgroundColor: '#34C75915' }]}>
                          <Ionicons name="checkmark-circle" size={18} color="#34C759" />
                        </View>
                        <Text style={styles.reminderTypeText}>Paid</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.compactPayButton, { backgroundColor: '#34C759' }]}
                        onPress={() => revertPayment(reminder.id)}
                      >
                        <Ionicons name="arrow-undo" size={14} color="#FFFFFF" />
                        <Text style={styles.compactPayButtonText}>Revert</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.reminderTitle}>{reminder.title}</Text>
                    <Text style={styles.reminderDescription}>{reminder.description}</Text>

                    <View style={styles.reminderDetails}>
                      <View style={styles.reminderDateTime}>
                        <Text style={styles.reminderDate}>Paid: {formatDate(paidInfo.paidAt)}</Text>
                        <Text style={[styles.reminderTime, { color: '#FF9500', fontSize: 12 }]}>
                          {getTimeRemainingUntilRemoval(paidInfo.paidAt) || 'Will be removed soon'}
                        </Text>
                      </View>
                      <Text style={[styles.reminderAmount, { color: '#34C759' }]}>
                        ₹{reminder.amount?.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                );
              })}
          </View>
        )}

        {/* Smart Reminders Section - Generated from Transaction Analysis */}
        {smartReminders.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle} allowFontScaling={false}>Smart Reminders</Text>
              <View style={styles.smartBadge}>
                <Ionicons name="bulb" size={16} color="#FF9500" />
                <Text style={styles.smartBadgeText} allowFontScaling={false}>AI Generated</Text>
              </View>
            </View>
            <Text style={styles.sectionSubtitle} allowFontScaling={false}>
              Based on your transaction history patterns
            </Text>
            {/* Unpaid items */}
            {smartReminders
              .filter(reminder => !paidItems[reminder.id])
              .map((reminder) => {
                const daysUntilDue = calculateDaysUntilDue(reminder.dueDate);
                const urgencyColor = getUrgencyColor(daysUntilDue);
                
                return (
                  <View key={reminder.id} style={styles.smartReminderCard}>
                    <View style={styles.reminderHeader}>
                      <View style={styles.reminderTypeContainer}>
                        <View style={[styles.reminderTypeIcon, { backgroundColor: '#FF950015' }]}>
                          <Ionicons name="bulb" size={18} color="#FF9500" />
                        </View>
                        <Text style={styles.reminderTypeText}>AI Detected</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.compactPayButton, { backgroundColor: urgencyColor }]}
                        onPress={() => handleMarkAsPaid(reminder, 'smart')}
                      >
                        <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                        <Text style={styles.compactPayButtonText}>Mark as Paid</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.reminderTitle}>{reminder.title}</Text>
                    <Text style={styles.reminderDescription}>{reminder.description}</Text>

                    <View style={styles.reminderDetails}>
                      <View style={styles.reminderDateTime}>
                        <Text style={styles.reminderDate}>{formatDate(reminder.dueDate)}</Text>
                        <Text style={styles.reminderTime}>{reminder.time}</Text>
                      </View>
                      <Text style={[styles.reminderAmount, { color: urgencyColor }]}>
                        ₹{reminder.amount?.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                );
              })}
            
            {/* Paid items */}
            {smartReminders
              .filter(reminder => paidItems[reminder.id] && paidItems[reminder.id].type === 'smart')
              .map((reminder) => {
                const paidInfo = paidItems[reminder.id];
                
                return (
                  <View key={`paid-${reminder.id}`} style={[styles.smartReminderCard, styles.paidReminderCard]}>
                    <View style={styles.reminderHeader}>
                      <View style={styles.reminderTypeContainer}>
                        <View style={[styles.reminderTypeIcon, { backgroundColor: '#34C75915' }]}>
                          <Ionicons name="checkmark-circle" size={18} color="#34C759" />
                        </View>
                        <Text style={styles.reminderTypeText}>Paid</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.compactPayButton, { backgroundColor: '#34C759' }]}
                        onPress={() => revertPayment(reminder.id)}
                      >
                        <Ionicons name="arrow-undo" size={14} color="#FFFFFF" />
                        <Text style={styles.compactPayButtonText}>Revert</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.reminderTitle}>{reminder.title}</Text>
                    <Text style={styles.reminderDescription}>{reminder.description}</Text>

                    <View style={styles.reminderDetails}>
                      <View style={styles.reminderDateTime}>
                        <Text style={styles.reminderDate}>Paid: {formatDate(paidInfo.paidAt)}</Text>
                        <Text style={[styles.reminderTime, { color: '#FF9500', fontSize: 12 }]}>
                          {getTimeRemainingUntilRemoval(paidInfo.paidAt) || 'Will be removed soon'}
                        </Text>
                      </View>
                      <Text style={[styles.reminderAmount, { color: '#34C759' }]}>
                        ₹{reminder.amount?.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                );
              })}
          </View>
        )}

        {/* Manual Reminders Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle} allowFontScaling={false}>Custom Reminders</Text>
            <TouchableOpacity
              style={styles.addSectionButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add-circle" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle} allowFontScaling={false}>
            Personal reminders and custom tasks you create
          </Text>
          
          {manualReminders.length === 0 ? (
            <View style={styles.emptySection}>
              <Ionicons name="alarm-outline" size={48} color="#CCCCCC" />
              <Text style={styles.emptySectionTitle} allowFontScaling={false}>No Custom Reminders</Text>
              <Text style={styles.emptySectionSubtitle} allowFontScaling={false}>
                Create custom reminders for personal tasks and goals
              </Text>
            </View>
          ) : (
            manualReminders.map((reminder) => {
              const typeInfo = getTypeInfo(reminder.type);
              const paidInfo = paidItems[reminder.id];
              const daysUntilDue = calculateDaysUntilDue(reminder.dueDate);
              const urgencyColor = getUrgencyColor(daysUntilDue);

              if (paidInfo) {
                // Show paid state
                return (
                  <View key={reminder.id} style={[styles.autoReminderCard, styles.paidReminderCard]}>
                    <View style={styles.reminderHeader}>
                      <View style={styles.reminderTypeContainer}>
                        <View style={[styles.reminderTypeIcon, { backgroundColor: '#34C759' + '15' }]}>
                          <Ionicons name="checkmark-circle" size={18} color="#34C759" />
                        </View>
                        <Text style={styles.reminderTypeText}>Paid</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.compactPayButton, { backgroundColor: '#34C759' }]}
                        onPress={() => revertPayment(reminder.id)}
                      >
                        <Ionicons name="arrow-undo" size={14} color="#FFFFFF" />
                        <Text style={styles.compactPayButtonText}>Revert</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.reminderTitle}>{reminder.title}</Text>
                    <Text style={styles.reminderDescription}>{reminder.description}</Text>

                    <View style={styles.reminderDetails}>
                      <View style={styles.reminderDateTime}>
                        <Text style={styles.reminderDate}>Paid: {formatDate(paidInfo.paidAt)}</Text>
                        <Text style={[styles.reminderTime, { color: '#FF9500', fontSize: 12 }]}>
                          {getTimeRemainingUntilRemoval(paidInfo.paidAt) || 'Will be removed soon'}
                        </Text>
                      </View>
                      {reminder.category && (
                        <Text style={styles.reminderCategory}>{reminder.category}</Text>
                      )}
                      {reminder.amount && (
                        <Text style={[styles.reminderAmount, { color: '#34C759' }]}>₹{reminder.amount.toLocaleString()}</Text>
                      )}
                    </View>

                    <View style={styles.reminderActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => handleEditReminder(reminder)}
                      >
                        <Text style={[styles.actionButtonText, styles.editButtonText]}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDeleteReminder(reminder.id)}
                      >
                        <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              } else {
                // Show unpaid state
                return (
                  <View key={reminder.id} style={styles.autoReminderCard}>
                    <View style={styles.reminderHeader}>
                      <View style={styles.reminderTypeContainer}>
                        <View style={[styles.reminderTypeIcon, { backgroundColor: typeInfo.color + '15' }]}>
                          <Ionicons name={typeInfo.icon as any} size={18} color={typeInfo.color} />
                        </View>
                        <Text style={styles.reminderTypeText}>{typeInfo.label}</Text>
                      </View>
                      <TouchableOpacity
                        style={[styles.compactPayButton, { backgroundColor: urgencyColor }]}
                        onPress={() => handleMarkAsPaid(reminder, 'custom')}
                      >
                        <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
                        <Text style={styles.compactPayButtonText}>Mark as Paid</Text>
                      </TouchableOpacity>
                    </View>

                    <Text style={styles.reminderTitle}>{reminder.title}</Text>
                    {reminder.description && (
                      <Text style={styles.reminderDescription}>{reminder.description}</Text>
                    )}

                    <View style={styles.reminderDetails}>
                      <View style={styles.reminderDateTime}>
                        <Text style={styles.reminderDate}>{formatDate(reminder.date)}</Text>
                        <Text style={styles.reminderTime}>{reminder.time}</Text>
                      </View>
                      {reminder.category && (
                        <Text style={styles.reminderCategory}>{reminder.category}</Text>
                      )}
                      {reminder.amount && (
                        <Text style={styles.reminderAmount}>₹{reminder.amount.toLocaleString()}</Text>
                      )}
                    </View>

                    <View style={styles.reminderActions}>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => handleEditReminder(reminder)}
                      >
                        <Text style={[styles.actionButtonText, styles.editButtonText]}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, styles.deleteButton]}
                        onPress={() => handleDeleteReminder(reminder.id)}
                      >
                        <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }
            })
          )}
        </View>
          </>
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingReminder ? 'Edit Reminder' : 'Add New Reminder'}
              </Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setShowAddModal(false);
                  setEditingReminder(null);
                  setFormData({
                    title: '',
                    description: '',
                    type: 'general',
                    date: new Date(),
                    time: '09:00',
                    isEnabled: true,
                    repeat: 'none',
                    category: '',
                    amount: '',
                  });
                }}
              >
                <Ionicons name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Title */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Title *</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.title}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
                  placeholder="Enter reminder title"
                  placeholderTextColor="#999999"
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Description</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                  placeholder="Enter reminder description"
                  placeholderTextColor="#999999"
                  multiline
                />
              </View>

              {/* Type */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Type</Text>
                <View style={styles.typeSelector}>
                  {reminderTypes.map((type) => (
                    <TouchableOpacity
                      key={type.key}
                      style={[
                        styles.typeOption,
                        formData.type === type.key && styles.typeOptionSelected,
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, type: type.key as Reminder['type'] }))}
                    >
                      <Ionicons
                        name={type.icon as any}
                        size={16}
                        color={formData.type === type.key ? '#007AFF' : '#666666'}
                        style={styles.typeOptionIcon}
                      />
                      <Text
                        style={[
                          styles.typeOptionText,
                          { color: formData.type === type.key ? '#007AFF' : '#666666' },
                        ]}
                      >
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Date and Time */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Date & Time</Text>
                <View style={styles.dateTimeRow}>
                  <View style={styles.dateTimeInput}>
                    <TextInput
                      style={styles.textInput}
                      value={formData.date.toLocaleDateString()}
                      placeholder="Select date"
                      placeholderTextColor="#999999"
                      editable={false}
                    />
                  </View>
                  <View style={styles.timeInput}>
                    <TextInput
                      style={styles.textInput}
                      value={formData.time}
                      onChangeText={(text) => setFormData(prev => ({ ...prev, time: text }))}
                      placeholder="09:00"
                      placeholderTextColor="#999999"
                    />
                  </View>
                </View>
              </View>

              {/* Category */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.category}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, category: text }))}
                  placeholder="e.g., Credit Card, Budget"
                  placeholderTextColor="#999999"
                />
              </View>

              {/* Amount */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Amount (Optional)</Text>
                <TextInput
                  style={styles.textInput}
                  value={formData.amount}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, amount: text }))}
                  placeholder="0"
                  placeholderTextColor="#999999"
                  keyboardType="numeric"
                />
              </View>

              {/* Repeat */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Repeat</Text>
                <View style={styles.typeSelector}>
                  {repeatOptions.map((option) => (
                    <TouchableOpacity
                      key={option.key}
                      style={[
                        styles.typeOption,
                        formData.repeat === option.key && styles.typeOptionSelected,
                      ]}
                      onPress={() => setFormData(prev => ({ ...prev, repeat: option.key as Reminder['repeat'] }))}
                    >
                      <Text
                        style={[
                          styles.typeOptionText,
                          { color: formData.repeat === option.key ? '#007AFF' : '#666666' },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Enabled */}
              <View style={styles.formGroup}>
                <View style={styles.switchRow}>
                  <Text style={styles.formLabel}>Enable Reminder</Text>
                  <Switch
                    value={formData.isEnabled}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, isEnabled: value }))}
                    trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveReminder}>
              <Text style={styles.saveButtonText}>
                {editingReminder ? 'Update Reminder' : 'Create Reminder'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={closeConfirmModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmModalContent}>
            <View style={styles.confirmModalHeader}>
              <View style={styles.confirmModalIcon}>
                <Ionicons name="warning" size={32} color="#FF9500" />
              </View>
              <Text style={styles.confirmModalTitle}>
                {confirmModalData?.type === 'custom' ? 'Mark as Completed' : 'Early Payment Confirmation'}
              </Text>
            </View>
            
            <View style={styles.confirmModalBody}>
              <Text style={styles.confirmModalMessage}>
                {confirmModalData?.type === 'custom' 
                  ? 'Are you sure you want to mark this reminder as completed?'
                  : 'Are you sure you want to mark this payment as paid?'
                }
              </Text>
              
              {confirmModalData && (
                <View style={styles.confirmModalDetails}>
                  <Text style={styles.confirmModalDetailTitle}>{confirmModalData.reminder.title}</Text>
                  <Text style={styles.confirmModalDetailAmount}>
                    ₹{confirmModalData.reminder.amount?.toLocaleString()}
                  </Text>
                  <Text style={styles.confirmModalDetailDate}>
                    Due: {formatDate(confirmModalData.reminder.dueDate)}
                  </Text>
                  <Text style={styles.confirmModalDetailTime}>
                    {confirmModalData.daysUntilDue} days remaining
                  </Text>
                </View>
              )}
              
              <Text style={styles.confirmModalNote}>
                {confirmModalData?.type === 'custom' 
                  ? 'Marking this reminder as completed will show it as paid.'
                  : 'This payment is not due yet. Marking it as paid will generate a new reminder for next month.'
                }
              </Text>
            </View>
            
            <View style={styles.confirmModalActions}>
              <TouchableOpacity
                style={[styles.confirmModalButton, styles.confirmModalCancelButton]}
                onPress={closeConfirmModal}
              >
                <Text style={styles.confirmModalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.confirmModalButton, styles.confirmModalConfirmButton]}
                onPress={() => {
                  if (confirmModalData) {
                    confirmMarkAsPaid(confirmModalData.reminder, confirmModalData.type);
                  }
                }}
              >
                <Text style={styles.confirmModalConfirmButtonText}>Mark as Paid</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

export default RemindersScreen;
