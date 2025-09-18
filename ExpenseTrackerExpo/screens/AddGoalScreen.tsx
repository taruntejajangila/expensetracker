import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';
import GoalService from '../services/GoalService';

interface AddGoalScreenProps {
  navigation: any;
}

const AddGoalScreen: React.FC<AddGoalScreenProps> = ({ navigation }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('🎯');
  const [selectedColor, setSelectedColor] = useState('#667eea');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [deadlineDate, setDeadlineDate] = useState(new Date());

  const icons = [
    '🎯', '💰', '🏠', '🚗', '✈️', '🎓', '💍', '🏥', '💻', '📱', 
    '🎮', '🎨', '📚', '🏋️', '🎵', '🍕', '☕', '🛍️', '🎭', '🏖️',
    '⭐', '🌟', '💎', '🏆', '🎁', '💼', '📈', '🔋', '🏦', '💳',
    '📊', '🏡', '🚁', '⛵', '🎸', '🎬', '📖', '🏃', '⚽', '🎾',
    '🏊', '🚴', '🎿', '🌍', '🌙', '☀️', '🌈', '🌸', '🌺', '🌻'
  ];

  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe',
    '#43e97b', '#38f9d7', '#fa709a', '#fee140', '#a8edea', '#fed6e3',
    '#ffecd2', '#fcb69f', '#ff9a9e', '#fecfef', '#fecfef', '#fad0c4',
    '#ffd1ff', '#a8edea', '#d299c2', '#fef9d7', '#89f7fe', '#66a6ff'
  ];

  const colorNames = {
    '#667eea': 'Blue',
    '#764ba2': 'Purple',
    '#f093fb': 'Pink',
    '#f5576c': 'Red',
    '#4facfe': 'Sky Blue',
    '#00f2fe': 'Cyan',
    '#43e97b': 'Green',
    '#38f9d7': 'Teal',
    '#fa709a': 'Rose',
    '#fee140': 'Yellow',
    '#a8edea': 'Mint',
    '#fed6e3': 'Light Pink',
    '#ffecd2': 'Peach',
    '#fcb69f': 'Coral',
    '#ff9a9e': 'Salmon',
    '#fecfef': 'Lavender',
    '#fad0c4': 'Pale Pink',
    '#ffd1ff': 'Light Purple',
    '#d299c2': 'Mauve',
    '#fef9d7': 'Cream',
    '#89f7fe': 'Light Blue',
    '#66a6ff': 'Royal Blue'
  };

  const handleSaveGoal = async () => {
    if (!goalName.trim()) {
      Alert.alert('Error', 'Please enter a goal name');
      return;
    }

    if (!targetAmount.trim() || parseFloat(targetAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid target amount');
      return;
    }

    if (!deadline.trim()) {
      Alert.alert('Error', 'Please select a deadline');
      return;
    }

    try {
      // Save the goal using the GoalService
      const newGoal = await GoalService.createGoal({
        name: goalName.trim(),
        targetAmount: parseFloat(targetAmount),
        currentAmount: 0,
        icon: selectedIcon,
        color: selectedColor,
        targetDate: deadline,
        goalType: category.trim() || `${goalName.trim()} Goal`
      });

      Alert.alert(
        'Success!',
        'Your savings goal has been created successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to create savings goal. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleIconSelect = (icon: string) => {
    setSelectedIcon(icon);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
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
              Add Goal
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              Create a new savings goal
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

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* Goal Preview Card */}
        <View style={styles.previewCard}>
          <LinearGradient
            colors={['#24243e', '#302b63', '#0f0c29']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.previewGradient}
          >
            <View style={styles.previewHeader}>
              <View style={styles.previewIconContainer}>
                <Text style={styles.previewIconText} allowFontScaling={false}>{selectedIcon}</Text>
              </View>
              <View style={styles.previewMainInfo}>
                <Text style={styles.previewName} allowFontScaling={false}>
                  {goalName || 'Your Goal Name'}
                </Text>
                <Text style={styles.previewAmount} allowFontScaling={false}>
                  {targetAmount ? `₹${parseFloat(targetAmount).toLocaleString()}` : '₹0'}
                </Text>
              </View>
            </View>
            
            <View style={styles.previewContent}>
              <View style={styles.previewDetails}>
                <View style={styles.previewDetailItem}>
                  <Ionicons name="time-outline" size={16} color="rgba(255, 255, 255, 0.8)" />
                  <Text style={styles.previewDetailText} allowFontScaling={false}>
                    {deadline || 'No deadline set'}
                  </Text>
                </View>
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
            placeholder="e.g., Emergency Fund, House Down Payment"
            placeholderTextColor={theme.colors.textSecondary}
            maxLength={50} allowFontScaling={false} />
        </View>

        {/* Target Amount Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel} allowFontScaling={false}>Target Amount *</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol} allowFontScaling={false}>₹</Text>
            <TextInput style={styles.amountInput}
              value={targetAmount}
              onChangeText={setTargetAmount}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="numeric"
              maxLength={10} allowFontScaling={false} />
          </View>
        </View>

        {/* Icon and Color Selection - Side by Side */}
        <View style={styles.iconColorContainer}>
          {/* Icon Selection */}
          <View style={styles.halfWidthSection}>
            <Text style={styles.inputLabel} allowFontScaling={false}>Choose Icon</Text>
            <TouchableOpacity
              style={styles.iconPickerButton}
              onPress={() => setShowIconPicker(true)}
            >
              <View style={styles.iconPickerContent}>
                <Text style={styles.iconPickerButtonText} allowFontScaling={false}>
                  {selectedIcon || 'Select an icon'}
                </Text>
                <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>

        {/* Icon Picker Modal */}
        <Modal
          visible={showIconPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowIconPicker(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1}
            onPress={() => setShowIconPicker(false)}
          >
            <View style={styles.iconPickerModal}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Ionicons name="happy-outline" size={24} color={theme.colors.primary} />
                  <Text style={styles.modalTitle} allowFontScaling={false}>Choose Your Goal Icon</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowIconPicker(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close-circle" size={28} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalContent}>
                <Text style={styles.modalSubtitle} allowFontScaling={false}>
                  Pick an icon that represents your goal
                </Text>
                
                <ScrollView 
                  style={styles.iconPickerScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.iconPickerScrollContent}
                >
                  <View style={styles.iconPickerGrid}>
                    {icons.map((icon, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.iconPickerOption,
                          selectedIcon === icon && {
                            backgroundColor: selectedColor + '20',
                            borderColor: selectedColor,
                            borderWidth: 3,
                            transform: [{ scale: 1.1 }],
                            shadowColor: selectedColor,
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 6,
                          }
                        ]}
                        onPress={() => {
                          handleIconSelect(icon);
                          setShowIconPicker(false);
                        }}
                      >
                        <Text style={styles.iconPickerOptionText} allowFontScaling={false}>{icon}</Text>
                        {selectedIcon === icon && (
                          <View style={[
                            styles.iconPickerCheckmark,
                            { backgroundColor: selectedColor }
                          ]}>
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

          {/* Color Selection */}
          <View style={styles.halfWidthSection}>
            <Text style={styles.inputLabel} allowFontScaling={false}>Choose Color</Text>
            <TouchableOpacity
              style={styles.colorPickerButton}
              onPress={() => setShowColorPicker(true)}
            >
              <View style={styles.colorPickerContent}>
                <View style={styles.colorPickerPreview}>
                  <View style={[styles.colorPreviewCircle, { backgroundColor: selectedColor }]} />
                  <Text style={styles.colorPickerButtonText} allowFontScaling={false}>
                    {colorNames[selectedColor] || 'Select a color'}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color={theme.colors.textSecondary} />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Color Picker Modal */}
        <Modal
          visible={showColorPicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowColorPicker(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay} 
            activeOpacity={1}
            onPress={() => setShowColorPicker(false)}
          >
            <View style={styles.colorPickerModal}>
              <View style={styles.modalHeader}>
                <View style={styles.modalTitleContainer}>
                  <Ionicons name="color-palette-outline" size={24} color={theme.colors.primary} />
                  <Text style={styles.modalTitle} allowFontScaling={false}>Choose Your Goal Color</Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowColorPicker(false)}
                  style={styles.closeButton}
                >
                  <Ionicons name="close-circle" size={28} color={theme.colors.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalContent}>
                <Text style={styles.modalSubtitle} allowFontScaling={false}>
                  Pick a color that represents your goal
                </Text>
                
                <ScrollView 
                  style={styles.colorPickerScroll}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.colorPickerScrollContent}
                >
                  <View style={styles.colorPickerGrid}>
                    {colors.map((color, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.colorPickerOption,
                          { backgroundColor: color },
                          selectedColor === color && styles.colorPickerOptionSelected
                        ]}
                        onPress={() => {
                          handleColorSelect(color);
                          setShowColorPicker(false);
                        }}
                      >
                        {selectedColor === color && (
                          <View style={styles.colorPickerCheckmark}>
                            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Deadline Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel} allowFontScaling={false}>Deadline</Text>
          <TouchableOpacity
            style={styles.deadlinePickerButton}
            onPress={() => setShowDatePicker(!showDatePicker)}
            activeOpacity={0.8}
          >
            <View style={styles.deadlinePickerContent}>
              <View style={styles.deadlinePreview}>
                <Ionicons name="calendar-outline" size={20} color={theme.colors.textSecondary} />
                <Text style={styles.deadlinePickerButtonText} allowFontScaling={false}>
                  {deadline || 'Select a deadline'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          
          {showDatePicker && (
            <View style={styles.datePickerContainer}>
              {/* Date Picker */}
              <DateTimePicker
                value={deadlineDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(event: any, selectedDate?: Date) => {
                  if (selectedDate) {
                    setDeadlineDate(selectedDate);
                    // Save as ISO date string for proper parsing
                    setDeadline(selectedDate.toISOString());
                  }
                  // Close after any selection, even if it's the same date (iOS inline or Android set)
                  const action = event?.type;
                  if (action === 'set' || Platform.OS === 'ios') {
                    setShowDatePicker(false);
                  }
                }}
                style={styles.picker}
              />
              
              <Text style={styles.selectedDateText} allowFontScaling={false}>
                Selected: {deadlineDate.toLocaleDateString('en-US', { 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </Text>
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
            placeholderTextColor={theme.colors.textSecondary}
            maxLength={50} allowFontScaling={false} />
        </View>

        {/* Save Button */}
        <TouchableOpacity 
          style={[
            styles.saveButton,
            (!goalName.trim() || !targetAmount.trim()) && styles.saveButtonDisabled
          ]}
          onPress={handleSaveGoal}
          disabled={!goalName.trim() || !targetAmount.trim()}
        >
          <Text style={styles.saveButtonText} allowFontScaling={false}>Create Savings Goal</Text>
        </TouchableOpacity>
             </ScrollView>
     </View>
   );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  },
  previewMainInfo: {
    flex: 1,
  },
  previewContent: {
    gap: 16,
  },
  previewName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  previewAmount: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  previewDetails: {
    gap: 8,
  },
  previewDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  iconColorContainer: {
    flexDirection: 'row',
    gap: 16,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  halfWidthSection: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 14,
    color: theme.colors.text,
    height: 56,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    height: 56,
  },
  currencySymbol: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  iconPickerButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: 16,
    marginTop: 8,
    height: 56,
    justifyContent: 'center',
  },
  iconPickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconPickerButtonText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  iconPickerModal: {
    backgroundColor: theme.colors.background,
    borderRadius: 24,
    width: '100%',
    height: 600,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 15,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 24,
    paddingBottom: 20,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    minHeight: 450,
  },
  iconPickerScroll: {
    flex: 1,
    minHeight: 350,
  },
  iconPickerScrollContent: {
    paddingBottom: 20,
    paddingTop: 10,
  },
  iconPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    padding: 16,
  },
  iconPickerOption: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.surface,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  iconPickerOptionSelected: {
    backgroundColor: theme.colors.primary + '20',
    borderColor: theme.colors.primary,
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
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
    top: -4,
    right: -4,
    backgroundColor: theme.colors.primary,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  colorPickerButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: 16,
    marginTop: 8,
    height: 56,
    justifyContent: 'center',
  },
  colorPickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  colorPickerPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  colorPreviewCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  colorPickerButtonText: {
    fontSize: 16,
    color: theme.colors.text,
    fontWeight: '500',
  },
  colorPickerModal: {
    backgroundColor: theme.colors.background,
    borderRadius: 24,
    width: '100%',
    height: 600,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 15,
    overflow: 'hidden',
  },
  colorPickerScroll: {
    flex: 1,
    minHeight: 350,
  },
  colorPickerScrollContent: {
    paddingBottom: 20,
    paddingTop: 10,
  },
  colorPickerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    padding: 16,
  },
  colorPickerOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorPickerOptionSelected: {
    borderColor: '#FFFFFF',
    borderWidth: 3,
    transform: [{ scale: 1.1 }],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  colorPickerCheckmark: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#000000',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background,
  },
  deadlinePickerButton: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    padding: 16,
    marginTop: 8,
    height: 56,
    justifyContent: 'center',
  },
  deadlinePickerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  deadlinePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deadlinePickerButtonText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  datePickerContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  picker: {
    width: '100%',
    height: Platform.OS === 'ios' ? 200 : 50,
  },
  selectedDateText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic',
  },


  saveButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    marginHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: theme.colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default AddGoalScreen;
