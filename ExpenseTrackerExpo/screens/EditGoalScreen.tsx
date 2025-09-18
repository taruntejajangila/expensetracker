import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GoalService from '../services/GoalService';

interface EditGoalScreenProps {
  route: {
    params: {
      goal: {
        id: string;
        name: string;
        targetAmount: number;
        currentAmount: number;
        icon: string;
        color: string;
        deadline: string;
        category: string;
      };
    };
  };
  navigation: any;
}

const EditGoalScreen: React.FC<EditGoalScreenProps> = ({ route, navigation }) => {
  const { goal } = route.params;
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  

  
  const [goalName, setGoalName] = useState(goal.name);
  const [targetAmount, setTargetAmount] = useState(goal.targetAmount.toString());
  const [selectedIcon, setSelectedIcon] = useState(goal.icon);
  const [selectedColor, setSelectedColor] = useState(goal.color);
  const [deadline, setDeadline] = useState(goal.deadline);
  const [deadlineDate, setDeadlineDate] = useState(new Date(goal.deadline));
  const [category, setCategory] = useState(goal.category);
  
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const icons = ['🎯', '💰', '🏠', '🚗', '✈️', '🎓', '💍', '🏥', '📱', '💻', '🎮', '📚', '🏋️', '🎨', '🎵', '🍕', '☕', '🌴', '🏖️', '🎪', '🎭', '🎨', '📸', '🎬', '🎤', '🎧', '🎹', '🎸', '🥁', '🎺', '🎻', '🎷', '🎺', '🎸', '🎹', '🎤', '🎧', '🎬', '📸', '🎨', '🎭', '🎪', '🏖️', '🌴', '☕', '🍕', '🎵', '🏋️', '📚', '🎮', '💻', '📱', '🏥', '💍', '🎓', '✈️', '🚗', '🏠', '💰', '🎯'];

  const colors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', 
    '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
    '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7BDE2',
    '#F9E79F', '#D5A6BD', '#A9CCE3', '#FAD7A0', '#ABEBC6'
  ];

  const colorNames: { [key: string]: string } = {
    '#FF6B6B': 'Red',
    '#4ECDC4': 'Teal',
    '#45B7D1': 'Blue',
    '#96CEB4': 'Green',
    '#FFEAA7': 'Yellow',
    '#DDA0DD': 'Plum',
    '#98D8C8': 'Mint',
    '#F7DC6F': 'Gold',
    '#BB8FCE': 'Lavender',
    '#85C1E9': 'Sky Blue',
    '#F8C471': 'Orange',
    '#82E0AA': 'Light Green',
    '#F1948A': 'Coral',
    '#D7BDE2': 'Light Purple',
    '#F9E79F': 'Light Yellow',
    '#D5A6BD': 'Rose',
    '#A9CCE3': 'Light Blue',
    '#FAD7A0': 'Peach',
    '#ABEBC6': 'Mint Green'
  };

  const handleSaveGoal = async () => {
    if (!goalName.trim() || !targetAmount.trim()) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const amount = parseFloat(targetAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }

    try {
      const updatedGoal = {
        ...goal,
        name: goalName.trim(),
        targetAmount: amount,
        icon: selectedIcon,
        color: selectedColor,
        deadline: deadline,
        category: category.trim(),
        updatedAt: new Date().toISOString(),
      };

      await GoalService.updateGoal(goal.id, updatedGoal);
      Alert.alert('Success', 'Goal updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Error updating goal:', error);
      Alert.alert('Error', 'Failed to update goal. Please try again.');
    }
  };

  const handleDeleteGoal = () => {
    Alert.alert(
      'Delete Goal',
      `Are you sure you want to delete "${goalName}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await GoalService.deleteGoal(goal.id);
              Alert.alert('Success', 'Goal deleted successfully!', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Error deleting goal:', error);
              Alert.alert('Error', 'Failed to delete goal. Please try again.');
            }
          }
        }
      ]
    );
  };

  // Create styles with fallback theme
  const styles = createStyles(theme || {
    colors: {
      primary: '#007AFF',
      secondary: '#5856D6',
      background: '#FFFFFF',
      surface: '#F2F2F7',
      text: '#000000',
      textSecondary: '#8E8E93',
      border: '#C6C6C8',
      error: '#FF3B30',
      success: '#34C759',
      warning: '#FF9500',
      info: '#007AFF',
    }
  });

  // Header Component
  const ScreenHeader: React.FC<{ theme: any; insets: any }> = ({ theme, insets }) => {
    const headerPaddingTop = Platform.OS === 'android' ? insets.top + 5 : insets.top + 10;
    
    return (
      <View style={[styles.headerContainer, { paddingTop: headerPaddingTop, backgroundColor: theme.colors.background }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]} allowFontScaling={false}>
              Edit Goal
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              Update your savings goal
            </Text>
          </View>
          
          <View style={styles.headerRight} />
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Safe Area */}
      <ScreenHeader theme={theme} insets={insets} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Goal Preview Card */}
        <View style={styles.previewCard}>
          <LinearGradient
            colors={['#24243e', '#302b63', '#0f0c29']}
            end={{ x: 1, y: 0 }}
            style={styles.previewGradient}
          >
            <View style={styles.previewHeader}>
              <View style={styles.previewIconContainer}>
                <Text style={styles.previewIconText} allowFontScaling={false}>{selectedIcon}</Text>
              </View>
              <View style={styles.previewMainInfo}>
                <Text style={styles.previewHeaderText} allowFontScaling={false}>{goalName || 'Your Goal Name'}</Text>
                <Text style={styles.previewSubtitle} allowFontScaling={false}>
                  Target: {targetAmount ? `₹${parseFloat(targetAmount).toLocaleString()}` : '₹0'}
                </Text>
              </View>
            </View>
            <View style={styles.previewDetails}>
              <View style={styles.previewDetailItem}>
                <Text style={styles.previewDetailText} allowFontScaling={false}>
                  Current: ₹{goal.currentAmount.toLocaleString()}
                </Text>
              </View>
              <View style={styles.previewDetailItem}>
                <Text style={styles.previewDetailText} allowFontScaling={false}>
                  Deadline: {deadlineDate.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric', 
                    year: 'numeric' 
                  })}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Goal Name Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel} allowFontScaling={false}>Goal Name *</Text>
                     <TextInput style={styles.textInput}
             value={goalName}
             onChangeText={setGoalName}
             placeholder="e.g., Emergency Fund, Vacation Savings"
             placeholderTextColor={(theme || {}).colors?.textSecondary || '#8E8E93'}
             maxLength={50} allowFontScaling={false} />
        </View>

        {/* Target Amount Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel} allowFontScaling={false}>Target Amount *</Text>
                     <TextInput style={styles.textInput}
             value={targetAmount}
             onChangeText={setTargetAmount}
             placeholder="0.00"
             placeholderTextColor={(theme || {}).colors?.textSecondary || '#8E8E93'}
             keyboardType="numeric"
             maxLength={12} allowFontScaling={false} />
        </View>

        {/* Icon and Color Selection - Side by Side */}
        <View style={styles.iconColorContainer}>
          {/* Choose Icon */}
          <View style={styles.halfWidthSection}>
            <Text style={styles.inputLabel} allowFontScaling={false}>Choose Icon</Text>
            <TouchableOpacity
              style={styles.iconPickerButton}
              onPress={() => setShowIconPicker(true)}
            >
              <Text style={styles.iconPickerContent} allowFontScaling={false}>{selectedIcon}</Text>
              <Text style={styles.iconPickerButtonText} allowFontScaling={false}>Change Icon</Text>
            </TouchableOpacity>
          </View>

          {/* Choose Color */}
          <View style={styles.halfWidthSection}>
            <Text style={styles.inputLabel} allowFontScaling={false}>Choose Color</Text>
            <TouchableOpacity
              style={styles.colorPickerButton}
              onPress={() => setShowColorPicker(true)}
            >
              <View style={styles.colorPickerContent}>
                <View style={[styles.colorPreviewCircle, { backgroundColor: selectedColor }]} />
                <Text style={styles.colorPickerButtonText} allowFontScaling={false}>
                  {colorNames[selectedColor] || 'Choose Color'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Deadline Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel} allowFontScaling={false}>Deadline</Text>
          <TouchableOpacity
            style={styles.deadlinePickerButton}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.deadlinePickerContent}>
              <Text style={styles.deadlinePreview} allowFontScaling={false}>
                {deadlineDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </Text>
              <Text style={styles.deadlinePickerButtonText} allowFontScaling={false}>Change Date</Text>
            </View>
          </TouchableOpacity>
          
          {showDatePicker && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={deadlineDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  if (selectedDate) {
                    setDeadlineDate(selectedDate);
                    setDeadline(selectedDate.toISOString());
                  }
                  const action = event?.type;
                  if (action === 'set' || Platform.OS === 'ios') {
                    setShowDatePicker(false);
                  }
                }}
                style={styles.picker}
              />
            </View>
          )}
        </View>

        {/* Category Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel} allowFontScaling={false}>Category (Optional)</Text>
                     <TextInput style={styles.textInput}
             value={category}
             onChangeText={setCategory}
             placeholder="e.g., Emergency Fund Goal, Vacation Savings"
             placeholderTextColor={(theme || {}).colors?.textSecondary || '#8E8E93'}
             maxLength={50} allowFontScaling={false} />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={handleDeleteGoal}
          >
            <Text style={styles.deleteButtonText} allowFontScaling={false}>Delete Goal</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSaveGoal}
          >
            <Text style={styles.saveButtonText} allowFontScaling={false}>Update Goal</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Icon Picker Modal */}
      <Modal
        visible={showIconPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowIconPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.iconPickerModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle} allowFontScaling={false}>Choose Your Goal Icon</Text>
              </View>
                             <TouchableOpacity
                 style={styles.closeButton}
                 onPress={() => setShowIconPicker(false)}
               >
                 <Ionicons name="close" size={24} color={(theme || {}).colors?.text || '#000000'} />
               </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle} allowFontScaling={false}>Select an icon that represents your goal</Text>
            <ScrollView style={styles.iconPickerScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.iconPickerScrollContent}>
                <View style={styles.iconPickerGrid}>
                  {icons.map((icon, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.iconPickerOption,
                        selectedIcon === icon && styles.iconPickerOptionSelected
                      ]}
                      onPress={() => {
                        setSelectedIcon(icon);
                        setShowIconPicker(false);
                      }}
                    >
                      <Text style={styles.iconPickerOptionText} allowFontScaling={false}>{icon}</Text>
                      {selectedIcon === icon && (
                        <View style={styles.iconPickerCheckmark}>
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Color Picker Modal */}
      <Modal
        visible={showColorPicker}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowColorPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.colorPickerModal}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle} allowFontScaling={false}>Choose Your Goal Color</Text>
              </View>
                             <TouchableOpacity
                 style={styles.closeButton}
                 onPress={() => setShowColorPicker(false)}
               >
                 <Ionicons name="close" size={24} color={(theme || {}).colors?.text || '#000000'} />
               </TouchableOpacity>
            </View>
            <Text style={styles.modalSubtitle} allowFontScaling={false}>Select a color for your goal</Text>
            <ScrollView style={styles.colorPickerScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.colorPickerScrollContent}>
                <View style={styles.colorPickerGrid}>
                  {colors.map((color, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.colorPickerOption,
                        selectedColor === color && styles.colorPickerOptionSelected
                      ]}
                      onPress={() => {
                        setSelectedColor(color);
                        setShowColorPicker(false);
                      }}
                    >
                      <View style={[styles.colorPickerOptionCircle, { backgroundColor: color }]} />
                      <Text style={styles.colorPickerOptionText} allowFontScaling={false}>
                        {colorNames[color]}
                      </Text>
                      {selectedColor === color && (
                        <View style={styles.colorPickerCheckmark}>
                          <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
     container: {
     flex: 1,
     backgroundColor: theme.colors?.background || '#FFFFFF',
   },
  // Header Styles
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
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  previewCard: {
    margin: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  previewGradient: {
    padding: 24,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  previewIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  previewIconText: {
    fontSize: 24,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  previewMainInfo: {
    flex: 1,
  },
  previewHeaderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  previewSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  previewDetails: {
    gap: 8,
  },
  previewDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewDetailText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  inputSection: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
     inputLabel: {
     fontSize: 14,
     fontWeight: '600',
     color: theme.colors?.text || '#000000',
     marginBottom: 8,
   },
     textInput: {
     width: '100%',
     height: 56,
     borderColor: theme.colors?.border || '#C6C6C8',
     borderWidth: 2,
     borderRadius: 12,
     paddingHorizontal: 16,
     paddingVertical: 16,
     fontSize: 14,
     color: theme.colors?.text || '#000000',
     backgroundColor: theme.colors?.surface || '#F2F2F7',
   },
  iconColorContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 24,
    gap: 12,
  },
  halfWidthSection: {
    flex: 1,
  },
     iconPickerButton: {
     height: 56,
     borderColor: theme.colors?.border || '#C6C6C8',
     borderWidth: 2,
     borderRadius: 12,
     backgroundColor: theme.colors?.surface || '#F2F2F7',
     alignItems: 'center',
     justifyContent: 'center',
     flexDirection: 'row',
     gap: 8,
     padding: 16,
     marginTop: 8,
   },
  iconPickerContent: {
    fontSize: 20,
  },
     iconPickerButtonText: {
     fontSize: 14,
     fontWeight: '600',
     color: theme.colors?.text || '#000000',
   },
     colorPickerButton: {
     height: 56,
     borderColor: theme.colors?.border || '#C6C6C8',
     borderWidth: 2,
     borderRadius: 12,
     backgroundColor: theme.colors?.surface || '#F2F2F7',
     alignItems: 'center',
     justifyContent: 'center',
     padding: 16,
     marginTop: 8,
   },
  colorPickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  colorPreviewCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
     colorPickerButtonText: {
     fontSize: 14,
     fontWeight: '600',
     color: theme.colors?.text || '#000000',
   },
     deadlinePickerButton: {
     height: 56,
     borderColor: theme.colors?.border || '#C6C6C8',
     borderWidth: 2,
     borderRadius: 12,
     backgroundColor: theme.colors?.surface || '#F2F2F7',
     alignItems: 'center',
     justifyContent: 'center',
     padding: 16,
     marginTop: 8,
   },
  deadlinePickerContent: {
    alignItems: 'center',
  },
     deadlinePreview: {
     fontSize: 14,
     fontWeight: '600',
     color: theme.colors?.text || '#000000',
     marginBottom: 4,
   },
     deadlinePickerButtonText: {
     fontSize: 14,
     color: theme.colors?.textSecondary || '#8E8E93',
   },
  datePickerContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  picker: {
    width: 200,
  },
  actionButtons: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 32,
    gap: 12,
  },
  deleteButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FF3B30',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF3B30',
  },
     saveButton: {
     flex: 1,
     paddingVertical: 16,
     paddingHorizontal: 24,
     borderRadius: 12,
     backgroundColor: theme.colors?.primary || '#007AFF',
     alignItems: 'center',
     justifyContent: 'center',
   },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 20,
  },
     iconPickerModal: {
     backgroundColor: theme.colors?.surface || '#F2F2F7',
     borderRadius: 20,
     width: '100%',
     height: 600,
     maxHeight: '90%',
   },
     colorPickerModal: {
     backgroundColor: theme.colors?.surface || '#F2F2F7',
     borderRadius: 20,
     width: '100%',
     height: 600,
     maxHeight: '90%',
   },
     modalHeader: {
     flexDirection: 'row',
     justifyContent: 'space-between',
     alignItems: 'center',
     padding: 20,
     borderBottomWidth: 1,
     borderBottomColor: theme.colors?.border || '#C6C6C8',
   },
  modalTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
     modalTitle: {
     fontSize: 18,
     fontWeight: '700',
     color: theme.colors?.text || '#000000',
   },
  closeButton: {
    padding: 4,
  },
     modalSubtitle: {
     fontSize: 11,
     color: theme.colors?.textSecondary || '#8E8E93',
     textAlign: 'center',
     paddingHorizontal: 20,
     paddingBottom: 20,
   },
  modalContent: {
    flex: 1,
    paddingHorizontal: 20,
    minHeight: 450,
  },
  iconPickerScroll: {
    flex: 1,
    minHeight: 350,
  },
  iconPickerScrollContent: {
    padding: 20,
  },
  iconPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
     iconPickerOption: {
     width: 52,
     height: 52,
     borderRadius: 26,
     backgroundColor: theme.colors?.background || '#FFFFFF',
     alignItems: 'center',
     justifyContent: 'center',
     borderWidth: 2,
     borderColor: 'transparent',
   },
     iconPickerOptionSelected: {
     borderColor: theme.colors?.primary || '#007AFF',
     backgroundColor: (theme.colors?.primary || '#007AFF') + '15',
   },
  iconPickerOptionText: {
    fontSize: 24,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 24,
  },
     iconPickerCheckmark: {
     position: 'absolute',
     top: -2,
     right: -2,
     width: 20,
     height: 20,
     borderRadius: 10,
     backgroundColor: theme.colors?.primary || '#007AFF',
     alignItems: 'center',
     justifyContent: 'center',
   },
  colorPickerScroll: {
    flex: 1,
  },
  colorPickerScrollContent: {
    padding: 20,
  },
  colorPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
     colorPickerOption: {
     width: '48%',
     padding: 16,
     borderRadius: 12,
     backgroundColor: theme.colors?.background || '#FFFFFF',
     alignItems: 'center',
     borderWidth: 2,
     borderColor: 'transparent',
   },
     colorPickerOptionSelected: {
     borderColor: theme.colors?.primary || '#007AFF',
     backgroundColor: (theme.colors?.primary || '#007AFF') + '15',
   },
  colorPickerOptionCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginBottom: 8,
  },
     colorPickerOptionText: {
     fontSize: 14,
     fontWeight: '600',
     color: theme.colors?.text || '#000000',
     textAlign: 'center',
   },
     colorPickerCheckmark: {
     position: 'absolute',
     top: 8,
     right: 8,
     width: 20,
     height: 20,
     borderRadius: 10,
     backgroundColor: theme.colors?.primary || '#007AFF',
     alignItems: 'center',
     justifyContent: 'center',
   },
});

export default EditGoalScreen;
