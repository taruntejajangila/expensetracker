import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Alert,
  Animated,
  Image,
  Linking,
  Modal,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useTicketContext } from '../contexts/SimpleTicketContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import ApiClient from '../utils/ApiClient';
import { API_BASE_URL } from '../config/api.config';

interface MessageAttachment {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
}

interface Message {
  id: string;
  message: string;
  is_admin_reply: boolean;
  user_name: string;
  created_at: string;
  attachments?: MessageAttachment[];
}

interface Attachment {
  id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  created_at: string;
}

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  user_name: string;
  created_at: string;
  messages: Message[];
  attachments?: Attachment[];
}

const TicketDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { ticketId, refresh } = route.params as { ticketId: string; refresh?: number };
  const { activeTickets, refreshTicket, subscribeToTicket, unsubscribeFromTicket, isPolling } = useTicketContext();
  
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [replyAttachments, setReplyAttachments] = useState<any[]>([]);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const spinValue = useRef(new Animated.Value(0)).current;
  
  // Get ticket from context or use local state
  const ticket = activeTickets.get(ticketId);

  // Subscribe to real-time updates when screen focuses
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 TicketDetailScreen: Screen focused, forcing ticket refresh');
      subscribeToTicket(ticketId);
      // Force immediate refresh when screen is focused (e.g., from notification tap)
      refreshTicket(ticketId, true);
      
      return () => {
        unsubscribeFromTicket(ticketId);
      };
    }, [ticketId]) // Remove function dependencies to prevent infinite loop
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (ticket && ticket.messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [ticket?.messages?.length]);

  // Set loading to false once we have ticket data
  useEffect(() => {
    if (ticket) {
      setLoading(false);
    }
  }, [ticket]);

  // Listen for navigation params changes (e.g., from notification tap while already on screen)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      console.log('🔔 Screen focused - checking for updates');
      // Force refresh when screen gains focus (handles notification tap)
      refreshTicket(ticketId, true);
    });

    return unsubscribe;
  }, [navigation, ticketId]);

  // Watch for refresh param changes (from notification navigation)
  useEffect(() => {
    if (refresh) {
      console.log('🔔 Refresh param detected from notification - force refreshing ticket');
      refreshTicket(ticketId, true);
    }
  }, [refresh]);

  // Manual refresh handler
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    console.log('🔄 Manual refresh triggered by user');
    
    // Start spin animation
    spinValue.setValue(0);
    Animated.timing(spinValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
    
    await refreshTicket(ticketId, true);
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const pickImageForReply = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets) {
        const newAttachments = result.assets.map(asset => ({
          uri: asset.uri,
          type: 'image',
          name: asset.uri.split('/').pop() || 'image.jpg',
          base64: asset.base64,
        }));
        setReplyAttachments([...replyAttachments, ...newAttachments].slice(0, 3)); // Max 3 per reply
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const removeReplyAttachment = (index: number) => {
    const newAttachments = [...replyAttachments];
    newAttachments.splice(index, 1);
    setReplyAttachments(newAttachments);
  };

  const viewImage = (imageUrl: string) => {
    setSelectedImage(imageUrl);
    setShowImageModal(true);
  };

  const sendReply = async () => {
    if (!newMessage.trim()) return;

    try {
      setSendingMessage(true);

      if (replyAttachments.length > 0) {
        // Use FormData for replies with attachments
        const messageData = new FormData() as any;
        messageData.append('message', newMessage);

        // Add attachments
        replyAttachments.forEach((attachment, index) => {
          messageData.append('attachments', {
            uri: attachment.uri,
            type: 'image/jpeg',
            name: attachment.name || `reply_${index}.jpg`,
          });
        });

        // Use fetch directly for FormData
        const token = await ApiClient.getInstance().getToken();
        const response = await fetch(`${API_BASE_URL}/support-tickets/${ticketId}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: messageData,
        });

        const data = await response.json();
        
        if (data.success) {
          setNewMessage('');
          setReplyAttachments([]);
          await refreshTicket(ticketId, true);
        } else {
          Alert.alert('Error', data.message || 'Failed to send message');
        }
      } else {
        // No attachments - use regular API
        const apiClient = ApiClient.getInstance();
        const response = await apiClient.post(
          `${API_BASE_URL}/support-tickets/${ticketId}/messages`,
          { message: newMessage }
        );

        if (response.success) {
          setNewMessage('');
          await refreshTicket(ticketId, true);
        } else {
          Alert.alert('Error', 'Failed to send message');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message');
    } finally {
      setSendingMessage(false);
    }
  };

  const closeTicket = async () => {
    Alert.alert(
      'Close Ticket',
      'Are you sure you want to close this ticket? You can still view it later.',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Close Ticket',
          style: 'destructive',
          onPress: async () => {
            try {
              const apiClient = ApiClient.getInstance();
              const response = await apiClient.patch(
                `${API_BASE_URL}/support-tickets/${ticketId}/close`,
                {}
              );

              if (response.success) {
                // Force immediate refresh to show closed status
                await refreshTicket(ticketId, true);
                Alert.alert('Success', 'Ticket closed successfully', [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack()
                  }
                ]);
              } else {
                Alert.alert('Error', 'Failed to close ticket');
              }
            } catch (error) {
              console.error('Error closing ticket:', error);
              Alert.alert('Error', 'Failed to close ticket');
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#FF9500';
      case 'in_progress':
        return '#007AFF';
      case 'resolved':
        return '#34C759';
      case 'closed':
        return '#8E8E93';
      default:
        return '#8E8E93';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return '#34C759';
      case 'medium':
        return '#FF9500';
      case 'high':
        return '#FF3B30';
      case 'urgent':
        return '#AF52DE';
      default:
        return '#8E8E93';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    headerContainer: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backButton: {
      padding: 4,
    },
    headerInfo: {
      flex: 1,
      marginLeft: theme.spacing.sm,
    },
    ticketNumber: {
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.primary,
    },
    ticketSubject: {
      fontSize: 14,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 2,
    },
    closeButton: {
      padding: 4,
    },
    refreshButton: {
      padding: 4,
      borderRadius: 20,
      backgroundColor: '#007AFF15',
    },
    refreshButtonContainer: {
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
    },
    floatingRefreshButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#FFFFFF',
      paddingVertical: 8,
      paddingHorizontal: 16,
      borderRadius: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      gap: 6,
    },
    refreshButtonText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#007AFF',
    },
    attachmentsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    attachmentThumb: {
      width: 80,
      height: 80,
      borderRadius: theme.borderRadius.md,
      overflow: 'hidden',
      position: 'relative',
      backgroundColor: theme.colors.surface,
    },
    attachmentImage: {
      width: '100%',
      height: '100%',
    },
    attachmentOverlay: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      paddingVertical: 4,
      alignItems: 'center',
      justifyContent: 'center',
    },
    ticketInfoCard: {
      backgroundColor: theme.colors.surface,
      margin: theme.spacing.md,
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    infoLabel: {
      fontSize: 12,
      color: theme.colors.textSecondary,
    },
    statusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.sm,
    },
    statusText: {
      fontSize: 11,
      fontWeight: '600',
      color: '#FFFFFF',
      marginLeft: 4,
      textTransform: 'capitalize',
    },
    priorityBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 4,
      borderRadius: theme.borderRadius.sm,
    },
    descriptionText: {
      fontSize: 13,
      color: theme.colors.text,
      lineHeight: 18,
      marginTop: theme.spacing.xs,
    },
    messagesContainer: {
      flex: 1,
      padding: theme.spacing.md,
    },
    messageWrapper: {
      marginBottom: theme.spacing.md,
    },
    messageBubble: {
      maxWidth: '80%',
      padding: theme.spacing.md,
      borderRadius: theme.borderRadius.lg,
    },
    userMessage: {
      alignSelf: 'flex-end',
      backgroundColor: theme.colors.primary,
    },
    adminMessage: {
      alignSelf: 'flex-start',
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    messageSender: {
      fontSize: 11,
      fontWeight: '600',
      marginBottom: 4,
    },
    userMessageSender: {
      color: '#FFFFFF',
      opacity: 0.8,
    },
    adminMessageSender: {
      color: theme.colors.primary,
    },
    messageText: {
      fontSize: 14,
      lineHeight: 18,
    },
    userMessageText: {
      color: '#FFFFFF',
    },
    adminMessageText: {
      color: theme.colors.text,
    },
    messageTime: {
      fontSize: 10,
      marginTop: 4,
    },
    userMessageTime: {
      color: '#FFFFFF',
      opacity: 0.7,
    },
    adminMessageTime: {
      color: theme.colors.textSecondary,
    },
    messageAttachments: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 4,
      marginTop: 8,
      marginBottom: 4,
    },
    messageAttachmentImage: {
      width: 120,
      height: 120,
      borderRadius: 8,
      backgroundColor: theme.colors.surface,
    },
    inputSection: {
      backgroundColor: theme.colors.surface,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
    },
    attachButton: {
      marginRight: theme.spacing.sm,
      position: 'relative',
    },
    attachmentBadge: {
      position: 'absolute',
      top: -4,
      right: -4,
      backgroundColor: theme.colors.primary,
      borderRadius: 10,
      width: 18,
      height: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    attachmentBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '600',
    },
    replyAttachmentsPreview: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.xs,
    },
    replyAttachmentItem: {
      width: 60,
      height: 60,
      borderRadius: theme.borderRadius.sm,
      overflow: 'hidden',
      marginRight: theme.spacing.xs,
      position: 'relative',
    },
    replyAttachmentImage: {
      width: '100%',
      height: '100%',
    },
    removeReplyAttachmentButton: {
      position: 'absolute',
      top: 2,
      right: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderRadius: 10,
    },
    input: {
      flex: 1,
      backgroundColor: theme.colors.background,
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
      fontSize: 14,
      color: theme.colors.text,
      maxHeight: 100,
    },
    sendButton: {
      marginLeft: theme.spacing.sm,
      backgroundColor: theme.colors.primary,
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    imageModalContainer: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.95)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    imageModalClose: {
      position: 'absolute',
      top: 50,
      right: 20,
      zIndex: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      borderRadius: 20,
      padding: 8,
    },
    fullImage: {
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height * 0.8,
    },
    imageModalActions: {
      position: 'absolute',
      bottom: 40,
      flexDirection: 'row',
      gap: 16,
    },
    imageActionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 25,
      gap: 8,
    },
    imageActionText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    loadingContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    liveIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      marginLeft: theme.spacing.sm,
      backgroundColor: '#34C75920',
      paddingHorizontal: theme.spacing.xs,
      paddingVertical: 2,
      borderRadius: theme.borderRadius.sm,
    },
    liveDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: '#34C759',
      marginRight: 4,
    },
    liveText: {
      fontSize: 10,
      fontWeight: '600',
      color: '#34C759',
    },
    closedNotice: {
      backgroundColor: '#8E8E9320',
      padding: theme.spacing.md,
      margin: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      flexDirection: 'row',
      alignItems: 'center',
    },
    closedNoticeText: {
      flex: 1,
      fontSize: 13,
      color: theme.colors.textSecondary,
      marginLeft: theme.spacing.sm,
    },
  });

  const headerPaddingTop = Platform.OS === 'android' ? insets.top + 5 : insets.top + 10;

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={{ color: theme.colors.text }} allowFontScaling={false}>Ticket not found</Text>
        </View>
      </View>
    );
  }

  const canReply = ticket.status !== 'closed';

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: headerPaddingTop }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.ticketNumber} allowFontScaling={false}>
                {ticket.ticket_number}
              </Text>
              {isPolling && (
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveText} allowFontScaling={false}>Live</Text>
                </View>
              )}
            </View>
            <Text style={styles.ticketSubject} numberOfLines={1} allowFontScaling={false}>
              {ticket.subject}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity 
              style={styles.refreshButton}
              onPress={handleManualRefresh}
              disabled={isRefreshing}
              activeOpacity={0.7}
            >
              <Animated.View style={{ transform: [{ rotate: spin }] }}>
                <Ionicons 
                  name="reload" 
                  size={22} 
                  color={isRefreshing ? theme.colors.textSecondary : theme.colors.primary}
                />
              </Animated.View>
            </TouchableOpacity>
            {canReply && (
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={closeTicket}
              >
                <Ionicons name="close-circle-outline" size={24} color="#FF3B30" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      {/* Ticket Info */}
      <ScrollView 
        ref={scrollViewRef}
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.ticketInfoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel} allowFontScaling={false}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(ticket.status) }]}>
              <Text style={styles.statusText} allowFontScaling={false}>
                {ticket.status.replace('_', ' ')}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel} allowFontScaling={false}>Priority</Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(ticket.priority) }]}>
              <Text style={[styles.statusText, { marginLeft: 0 }]} allowFontScaling={false}>
                {ticket.priority}
              </Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel} allowFontScaling={false}>Category</Text>
            <Text style={[styles.infoLabel, { fontWeight: '600', color: theme.colors.text, textTransform: 'capitalize' }]} allowFontScaling={false}>
              {ticket.category}
            </Text>
          </View>
          <View style={{ marginTop: theme.spacing.sm }}>
            <Text style={styles.infoLabel} allowFontScaling={false}>Description</Text>
            <Text style={styles.descriptionText} allowFontScaling={false}>
              {ticket.description}
            </Text>
          </View>

          {/* Attachments */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <View style={{ marginTop: theme.spacing.md }}>
              <Text style={styles.infoLabel} allowFontScaling={false}>
                Attachments ({ticket.attachments.length})
              </Text>
              <View style={styles.attachmentsGrid}>
                {ticket.attachments.map((attachment) => (
                  <TouchableOpacity
                    key={attachment.id}
                    style={styles.attachmentThumb}
                    onPress={() => viewImage(`${API_BASE_URL.replace('/api', '')}${attachment.file_path}`)}
                    activeOpacity={0.7}
                  >
                    <Image 
                      source={{ uri: `${API_BASE_URL.replace('/api', '')}${attachment.file_path}` }}
                      style={styles.attachmentImage}
                      resizeMode="cover"
                    />
                    <View style={styles.attachmentOverlay}>
                      <Ionicons name="eye" size={16} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Closed Notice */}
        {!canReply && (
          <View style={styles.closedNotice}>
            <Ionicons name="lock-closed" size={20} color={theme.colors.textSecondary} />
            <Text style={styles.closedNoticeText} allowFontScaling={false}>
              This ticket is closed. You cannot reply to closed tickets.
            </Text>
          </View>
        )}

        {/* Messages */}
        <View style={styles.messagesContainer}>
          {ticket.messages.map((message) => (
            <View 
              key={message.id} 
              style={[
                styles.messageWrapper,
                message.is_admin_reply ? { alignItems: 'flex-start' } : { alignItems: 'flex-end' }
              ]}
            >
              <View style={[
                styles.messageBubble,
                message.is_admin_reply ? styles.adminMessage : styles.userMessage
              ]}>
                <Text 
                  style={[
                    styles.messageSender,
                    message.is_admin_reply ? styles.adminMessageSender : styles.userMessageSender
                  ]}
                  allowFontScaling={false}
                >
                  {message.is_admin_reply ? 'Support Team' : 'You'}
                </Text>
                <Text 
                  style={[
                    styles.messageText,
                    message.is_admin_reply ? styles.adminMessageText : styles.userMessageText
                  ]}
                  allowFontScaling={false}
                >
                  {message.message}
                </Text>
                
                {/* Message Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <View style={styles.messageAttachments}>
                    {message.attachments.map((attachment) => (
                      <TouchableOpacity
                        key={attachment.id}
                        onPress={() => viewImage(`${API_BASE_URL.replace('/api', '')}${attachment.file_path}`)}
                        activeOpacity={0.8}
                      >
                        <Image 
                          source={{ uri: `${API_BASE_URL.replace('/api', '')}${attachment.file_path}` }}
                          style={styles.messageAttachmentImage}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
                
                <Text 
                  style={[
                    styles.messageTime,
                    message.is_admin_reply ? styles.adminMessageTime : styles.userMessageTime
                  ]}
                  allowFontScaling={false}
                >
                  {formatDate(message.created_at)}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Refresh Button Below Messages */}
        <View style={styles.refreshButtonContainer}>
          <TouchableOpacity 
            style={styles.floatingRefreshButton}
            onPress={handleManualRefresh}
            disabled={isRefreshing}
            activeOpacity={0.6}
          >
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Ionicons 
                name="refresh" 
                size={16} 
                color="#007AFF"
              />
            </Animated.View>
            <Text style={styles.refreshButtonText} allowFontScaling={false}>
              {isRefreshing ? 'Updating...' : 'Tap to refresh'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Input */}
      {canReply && (
        <View style={styles.inputSection}>
          {/* Reply Attachments Preview */}
          {replyAttachments.length > 0 && (
            <View style={styles.replyAttachmentsPreview}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {replyAttachments.map((attachment, index) => (
                  <View key={index} style={styles.replyAttachmentItem}>
                    <Image source={{ uri: attachment.uri }} style={styles.replyAttachmentImage} />
                    <TouchableOpacity
                      style={styles.removeReplyAttachmentButton}
                      onPress={() => removeReplyAttachment(index)}
                    >
                      <Ionicons name="close-circle" size={20} color="#FF3B30" />
                    </TouchableOpacity>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
          
          <View style={styles.inputContainer}>
            <TouchableOpacity
              style={styles.attachButton}
              onPress={pickImageForReply}
              disabled={replyAttachments.length >= 3}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="image" 
                size={24} 
                color={replyAttachments.length >= 3 ? theme.colors.textSecondary : theme.colors.primary} 
              />
              {replyAttachments.length > 0 && (
                <View style={styles.attachmentBadge}>
                  <Text style={styles.attachmentBadgeText} allowFontScaling={false}>{replyAttachments.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Type your message..."
              placeholderTextColor={theme.colors.textSecondary}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={1000}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!newMessage.trim() || sendingMessage) && styles.sendButtonDisabled
              ]}
              onPress={sendReply}
              disabled={!newMessage.trim() || sendingMessage}
              activeOpacity={0.7}
            >
              {sendingMessage ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Image Viewer Modal */}
      <Modal
        visible={showImageModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowImageModal(false)}
      >
        <View style={styles.imageModalContainer}>
          <TouchableOpacity 
            style={styles.imageModalClose}
            onPress={() => setShowImageModal(false)}
            activeOpacity={0.9}
          >
            <Ionicons name="close" size={32} color="#FFFFFF" />
          </TouchableOpacity>
          
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
          
          <View style={styles.imageModalActions}>
            <TouchableOpacity
              style={styles.imageActionButton}
              onPress={() => {
                setShowImageModal(false);
                if (selectedImage) {
                  Linking.openURL(selectedImage);
                }
              }}
            >
              <Ionicons name="open-outline" size={20} color="#FFFFFF" />
              <Text style={styles.imageActionText} allowFontScaling={false}>Open in Browser</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
};

export default TicketDetailScreen;

