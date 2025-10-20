import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  StyleSheet,
  Animated,
  Dimensions,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { useNetwork } from '../context/NetworkContext';
import OfflineScreen from '../components/OfflineScreen';
import { useScroll } from '../context/ScrollContext';
import GoalService, { Goal } from '../services/GoalService';
import { useFocusEffect } from '@react-navigation/native';

interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  icon: string;
  color: string;
  deadline: string;
  category: string;
}

const SavingsGoalsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { scrollY } = useScroll();
  const { isOfflineMode } = useNetwork();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentGoal, setCurrentGoal] = useState<SavingsGoal | null>(null);
  const [newAmount, setNewAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'add' | 'withdraw'>('add');

  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const formatCurrency = (amount: number) => {
    const isNegative = amount < 0;
    const absoluteAmount = Math.abs(amount);
    return `${isNegative ? '-' : ''}₹${absoluteAmount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const getProgress = (current: number, target: number) => {
    return Math.min(Math.round((current / target) * 100), 100);
  };

  const getDaysRemaining = (deadline: string) => {
    try {
      // Check if deadline is defined
      if (!deadline) {
        return 'No deadline';
      }

      const today = new Date();
      let deadlineDate: Date;
      
      // Try to parse the deadline - handle both ISO strings and formatted strings
      if (deadline.includes('T') || deadline.includes('Z')) {
        // ISO date string
        deadlineDate = new Date(deadline);
      } else {
        // Try to parse formatted date string
        deadlineDate = new Date(deadline);
      }
      
      // Check if the date is valid
      if (isNaN(deadlineDate.getTime())) {
        return 'Invalid date';
      }
      
      const diffTime = deadlineDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'Overdue';
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Tomorrow';
      if (diffDays < 7) return `${diffDays} days`;
      if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks`;
      if (diffDays < 365) return `${Math.ceil(diffDays / 30)} months`;
      return `${Math.ceil(diffDays / 365)} years`;
    } catch (error) {
      console.error('Error calculating days remaining:', error);
      return 'Date error';
    }
  };

  const formatDeadlineDisplay = (deadline: string) => {
    try {
      // Check if deadline is defined
      if (!deadline) {
        return 'No deadline set';
      }

      let deadlineDate: Date;
      
      // Try to parse the deadline - handle both ISO strings and formatted strings
      if (deadline.includes('T') || deadline.includes('Z')) {
        // ISO date string
        deadlineDate = new Date(deadline);
      } else {
        // Try to parse formatted date string
        deadlineDate = new Date(deadline);
      }
      
      // Check if the date is valid
      if (isNaN(deadlineDate.getTime())) {
        return 'Invalid date';
      }
      
      // Format as "Jan 15, 2025" for display
      return deadlineDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting deadline display:', error);
      return 'Date error';
    }
  };

  const getColorWithOpacity = (hexColor: string, opacity: number = 0.2) => {
    try {
      // Remove # if present
      const hex = hexColor.replace('#', '');
      
      // Convert hex to RGB
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      
      // Return rgba string
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    } catch (error) {
      console.error('Error converting color:', error);
      // Fallback to a light gray
      return 'rgba(200, 200, 200, 0.2)';
    }
  };

  const getStatusColor = (current: number, target: number) => {
    const progress = (current / target) * 100;
    if (progress >= 100) return '#34C759'; // Green
    if (progress >= 75) return '#FF9500'; // Orange
    if (progress >= 50) return '#FF6B6B'; // Red
    return '#007AFF'; // Blue
  };

  const getStatusEmoji = (current: number, target: number) => {
    const progress = (current / target) * 100;
    if (progress >= 100) return '🎉';
    if (progress >= 75) return '🚀';
    if (progress >= 50) return '💪';
    return '🎯';
  };

  const loadGoals = async () => {
    try {
      setIsLoading(true);
      const loadedGoals = await GoalService.getGoals();
      
      // Map Goal interface to SavingsGoal interface
      const mappedGoals: SavingsGoal[] = loadedGoals.map((goal: Goal) => ({
        id: goal.id,
        name: goal.name,
        targetAmount: goal.targetAmount,
        currentAmount: goal.currentAmount,
        icon: goal.icon,
        color: goal.color,
        deadline: goal.targetDate,
        category: goal.goalType || 'other',
      }));
      
      console.log('🔍 SavingsGoalsScreen: Loaded goals:', mappedGoals.length);
      setGoals(mappedGoals);
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load goals when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadGoals();
    }, [])
  );

  const handleUpdateProgress = (goal: SavingsGoal) => {
    setCurrentGoal(goal);
    setNewAmount(''); // Clear the input field
    setTransactionType('add'); // Reset transaction type to default
    setIsModalVisible(true);
  };

  const handleEditGoal = (goal: SavingsGoal) => {
    // @ts-ignore
    navigation.navigate('EditGoal', { goal });
  };

  const handleSaveProgress = async () => {
    if (currentGoal && newAmount) {
      const amount = parseFloat(newAmount);
      if (!isNaN(amount) && amount > 0) {
        try {
          let result: { success: boolean };
          
          if (transactionType === 'add') {
            // Add money to the goal
            result = await GoalService.addToGoal(currentGoal.id, amount);
          } else {
            // Withdraw money from the goal
            // Check if withdrawal amount is valid
            if (amount > currentGoal.currentAmount) {
              Alert.alert('Error', 'Cannot withdraw more than the current amount saved.');
              return;
            }
            result = await GoalService.withdrawFromGoal(currentGoal.id, amount);
          }
          
          if (result.success) {
            // Reload goals to get updated data
            await loadGoals();
            setIsModalVisible(false);
            setCurrentGoal(null);
            setNewAmount('');
            setTransactionType('add'); // Reset to default
          } else {
            Alert.alert('Error', 'Failed to update goal progress. Please try again.');
          }
        } catch (error) {
          console.error('Error updating goal progress:', error);
          Alert.alert('Error', 'Failed to update goal progress. Please try again.');
        }
      } else {
        Alert.alert('Error', 'Please enter a valid amount greater than 0.');
      }
    } else {
      Alert.alert('Error', 'Please enter an amount.');
    }
  };

  const totalTarget = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrent = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  const overallProgress = getProgress(totalCurrent, totalTarget);

  // Header Component
  const SavingsGoalsHeader: React.FC<{ theme: any; insets: any }> = ({ theme, insets }) => {
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
          <View style={styles.greetingContainer}>
            <Text style={[styles.greetingText, { color: theme.colors.text }]} allowFontScaling={false}>
              Savings Goals
            </Text>
          </View>
          <View style={styles.headerRight} />
        </View>
      </View>
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
  }, insets);

  // Show offline screen when offline
  if (isOfflineMode) {
    return (
      <OfflineScreen 
        title="Goals are sleeping 💤"
        message="Your savings goals are stored safely in the cloud. Connect to the internet to track your progress and add new goals."
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <SavingsGoalsHeader theme={theme} insets={insets} />
      
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 16 }]}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >


        {/* Overall Progress Card */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.overallProgressCard}
        >
          <View style={styles.overallProgressHeader}>
            <Text style={styles.overallProgressIcon} allowFontScaling={false}>🎯</Text>
            <Text style={styles.overallProgressTitle} allowFontScaling={false}>SAVINGS OVERVIEW</Text>
          </View>
          <View style={styles.overallProgressStats}>
            <View style={styles.overallStatItem}>
              <Text style={styles.overallStatValue} allowFontScaling={false}>{formatCurrency(totalCurrent)}</Text>
              <Text style={styles.overallStatLabel} allowFontScaling={false}>Total Saved</Text>
            </View>
            <View style={styles.overallStatDivider} />
            <View style={styles.overallStatItem}>
              <Text style={styles.overallStatValue} allowFontScaling={false}>{formatCurrency(totalTarget)}</Text>
              <Text style={styles.overallStatLabel} allowFontScaling={false}>Total Goal</Text>
            </View>
            <View style={styles.overallStatDivider} />
            <View style={styles.overallStatItem}>
              <Text style={styles.overallStatValue} allowFontScaling={false}>{formatCurrency(totalTarget - totalCurrent)}</Text>
              <Text style={styles.overallStatLabel} allowFontScaling={false}>Remaining</Text>
            </View>
          </View>
          <View style={styles.overallProgressBarContainer}>
            <View style={styles.overallProgressBarHeader}>
              <Text style={styles.overallProgressLabel} allowFontScaling={false}>Overall Progress</Text>
              <Text style={styles.overallProgressPercentage} allowFontScaling={false}>{overallProgress}%</Text>
            </View>
            <View style={styles.overallProgressBar}>
              <View style={[styles.overallProgressBarFill, { width: `${overallProgress}%` }]} />
            </View>
          </View>
        </LinearGradient>

        {/* Goals Section */}
        <View style={styles.goalsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle} allowFontScaling={false}>Your Goals</Text>
            <TouchableOpacity 
              style={styles.addGoalButton}
              onPress={() => navigation.navigate('AddGoal' as never)}
            >
              <Ionicons name="add" size={20} color={theme.colors.primary} />
              <Text style={styles.addGoalButtonText} allowFontScaling={false}>Add Goal</Text>
            </TouchableOpacity>
          </View>
          
          {goals.map(goal => {
            const progress = getProgress(goal.currentAmount, goal.targetAmount);
            const isCompleted = goal.currentAmount >= goal.targetAmount;
            const statusColor = getStatusColor(goal.currentAmount, goal.targetAmount);
            
            return (
              <View key={goal.id} style={styles.goalCardContainer}>
                <TouchableOpacity
                  style={[styles.goalCard, { borderLeftColor: goal.color || '#007AFF' }]}
                  onPress={() => handleUpdateProgress(goal)}
                  activeOpacity={0.8}
                >
                  {/* Header with Icon and Status */}
                  <View style={styles.goalHeader}>
                    <View style={[styles.goalIconContainer, { backgroundColor: goal.color || '#007AFF' }]}>
                      <Text style={styles.goalIconText} allowFontScaling={false}>{goal.icon}</Text>
                    </View>
                    <View style={styles.goalInfo}>
                      <Text style={styles.goalName} allowFontScaling={false}>{goal.name}</Text>
                      <Text style={styles.goalTagline} allowFontScaling={false}>
                        {isCompleted 
                          ? `🎉 Goal achieved! Congratulations!`
                          : `You still have ${getDaysRemaining(goal.deadline)} to fulfill your goal`
                        }
                      </Text>
                    </View>
                    <View style={styles.goalStatusBadge}>
                      <Text style={[styles.goalStatusText, { color: statusColor }]} allowFontScaling={false}>
                        {isCompleted ? '🎉' : getStatusEmoji(goal.currentAmount, goal.targetAmount)}
                      </Text>
                    </View>
                  </View>

                  {/* Progress Section */}
                  <View style={styles.goalProgressSection}>
                    <View style={styles.goalProgressHeader}>
                      <Text style={styles.goalProgressLabel} allowFontScaling={false}>Progress</Text>
                      <Text style={[styles.goalProgressPercentage, { color: statusColor }]} allowFontScaling={false}>
                        {progress}%
                      </Text>
                    </View>
                    <View style={styles.goalProgressBarContainer}>
                      <View style={styles.goalProgressBar}>
                        <View 
                          style={[
                            styles.goalProgressBarFill, 
                            { 
                              width: `${progress}%`,
                              backgroundColor: statusColor
                            }
                          ]} 
                        />
                      </View>
                      <View style={styles.goalProgressDots}>
                        {[0, 25, 50, 75, 100].map((milestone) => (
                          <View 
                            key={milestone}
                            style={[
                              styles.progressDot,
                              { 
                                backgroundColor: progress >= milestone ? statusColor : theme.colors.border,
                                opacity: progress >= milestone ? 1 : 0.3
                              }
                            ]} 
                          />
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* Amounts Section */}
                  <View style={styles.goalAmountsSection}>
                    <View style={styles.goalAmountRow}>
                      <View style={styles.goalAmountItem}>
                        <Text style={styles.goalAmountLabel} allowFontScaling={false}>Saved</Text>
                        <Text style={styles.goalCurrentAmount} allowFontScaling={false}>
                          {formatCurrency(goal.currentAmount)}
                        </Text>
                      </View>
                      <View style={styles.goalAmountDivider} />
                      <View style={styles.goalAmountItem}>
                        <Text style={styles.goalAmountLabel} allowFontScaling={false}>Target</Text>
                        <Text style={styles.goalTargetAmount} allowFontScaling={false}>
                          {formatCurrency(goal.targetAmount)}
                        </Text>
                      </View>
                      <View style={styles.goalAmountDivider} />
                      <View style={styles.goalAmountItem}>
                        <Text style={styles.goalAmountLabel} allowFontScaling={false}>
                          {isCompleted ? 'Achieved!' : 'Remaining'}
                        </Text>
                        <Text style={[styles.goalRemainingAmount, { color: statusColor }]} allowFontScaling={false}>
                          {isCompleted
                            ? '🎉'
                            : formatCurrency(goal.targetAmount - goal.currentAmount)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Footer with Deadline and Actions */}
                  <View style={styles.goalFooter}>
                    <View style={styles.goalDeadline}>
                      <Ionicons name="time-outline" size={16} color={theme.colors.textSecondary} />
                      <View style={styles.deadlineInfo}>
                        <Text style={styles.goalDeadlineDate} allowFontScaling={false}>
                          {formatDeadlineDisplay(goal.deadline)}
                        </Text>
                        <Text style={styles.goalDeadlineText} allowFontScaling={false}>
                          {getDaysRemaining(goal.deadline)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.goalActionButtons}>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.editButton]}
                        onPress={() => handleEditGoal(goal)}
                      >
                        <Ionicons name="create-outline" size={16} color={theme.colors.primary} />
                        <Text style={styles.actionButtonText} allowFontScaling={false}>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.actionButton, styles.updateButton]}
                        onPress={() => handleUpdateProgress(goal)}
                      >
                        <Ionicons name="add-circle-outline" size={16} color="#FFFFFF" />
                        <Text style={[styles.actionButtonText, styles.updateButtonText]} allowFontScaling={false}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Loading State */}
        {isLoading && (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText} allowFontScaling={false}>Loading your goals...</Text>
          </View>
        )}

        {/* Empty State */}
        {!isLoading && goals.length === 0 && (
          <View style={styles.emptyStateContainer}>
            <Text style={styles.emptyStateIcon} allowFontScaling={false}>🎯</Text>
            <Text style={styles.emptyStateTitle} allowFontScaling={false}>No Savings Goals Yet</Text>
            <Text style={styles.emptyStateSubtitle} allowFontScaling={false}>
              Create your first savings goal to start tracking your progress
            </Text>
            <TouchableOpacity
              style={styles.createFirstGoalButton}
              onPress={() => navigation.navigate('AddGoal' as never)}
            >
              <Text style={styles.createFirstGoalButtonText} allowFontScaling={false}>Create Your First Goal</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <View style={styles.tipsHeader}>
            <View style={styles.tipsHeaderIcon}>
              <Text style={styles.tipsHeaderIconText} allowFontScaling={false}>💡</Text>
            </View>
            <Text style={styles.tipsTitle} allowFontScaling={false}>Smart Savings Tips</Text>
            <Text style={styles.tipsSubtitle} allowFontScaling={false}>Boost your financial success with these proven strategies</Text>
          </View>
          
          <View style={styles.tipsContainer}>
            <View style={styles.tipCard}>
              <View style={styles.tipIconContainer}>
                <Text style={styles.tipIcon} allowFontScaling={false}>🎯</Text>
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipHeader} allowFontScaling={false}>Set SMART Goals</Text>
                <Text style={styles.tipText} allowFontScaling={false}>
                  Make your goals Specific, Measurable, Achievable, Relevant, and Time-bound for better success rates
                </Text>
                <View style={styles.tipTag}>
                  <Text style={styles.tipTagText} allowFontScaling={false}>Strategy</Text>
                </View>
              </View>
            </View>

            <View style={styles.tipCard}>
              <View style={styles.tipIconContainer}>
                <Text style={styles.tipIcon} allowFontScaling={false}>💰</Text>
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipHeader} allowFontScaling={false}>Pay Yourself First</Text>
                <Text style={styles.tipText} allowFontScaling={false}>
                  Automatically transfer money to savings before spending on other things
                </Text>
                <View style={styles.tipTag}>
                  <Text style={styles.tipTagText} allowFontScaling={false}>Habit</Text>
                </View>
              </View>
            </View>

            <View style={styles.tipCard}>
              <View style={styles.tipIconContainer}>
                <Text style={styles.tipIcon} allowFontScaling={false}>📊</Text>
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipHeader} allowFontScaling={false}>Track Progress Regularly</Text>
                <Text style={styles.tipText} allowFontScaling={false}>
                  Monitor your savings progress weekly to stay motivated and on track
                </Text>
                <View style={styles.tipTag}>
                  <Text style={styles.tipTagText} allowFontScaling={false}>Monitoring</Text>
                </View>
              </View>
            </View>

            <View style={styles.tipCard}>
              <View style={styles.tipIconContainer}>
                <Text style={styles.tipIcon} allowFontScaling={false}>🚀</Text>
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipHeader} allowFontScaling={false}>Start Small, Grow Big</Text>
                <Text style={styles.tipText} allowFontScaling={false}>
                  Begin with achievable amounts and gradually increase as you build the habit
                </Text>
                <View style={styles.tipTag}>
                  <Text style={styles.tipTagText} allowFontScaling={false}>Growth</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Update Progress Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => Keyboard.dismiss()}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle} allowFontScaling={false}>Update Progress</Text>
                  <TouchableOpacity 
                    style={styles.modalCloseButton}
                    onPress={() => setIsModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.modalGoalInfo}>
                  <View style={[styles.modalGoalIcon, { backgroundColor: getColorWithOpacity(currentGoal?.color || '#007AFF', 0.15) }]}>
                    <Text style={styles.modalGoalIconText} allowFontScaling={false}>{currentGoal?.icon}</Text>
                  </View>
                  <Text style={styles.modalGoalName} allowFontScaling={false}>{currentGoal?.name}</Text>
                </View>
                
                <View style={styles.modalProgressInfo}>
                  <View style={styles.modalProgressItem}>
                    <Text style={styles.modalProgressLabel} allowFontScaling={false}>Target Amount</Text>
                    <Text style={styles.modalProgressValue} allowFontScaling={false}>
                      {formatCurrency(currentGoal?.targetAmount || 0)}
                    </Text>
                  </View>
                  <View style={styles.modalProgressItem}>
                    <Text style={styles.modalProgressLabel} allowFontScaling={false}>Current Amount</Text>
                    <Text style={styles.modalProgressValue} allowFontScaling={false}>
                      {formatCurrency(currentGoal?.currentAmount || 0)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.modalInputContainer}>
                  <Text style={styles.modalInputLabel} allowFontScaling={false}>Transaction Type</Text>
                  <View style={styles.transactionTypeContainer}>
                    <TouchableOpacity
                      style={[
                        styles.transactionTypeButton,
                        transactionType === 'add' && styles.transactionTypeButtonActive
                      ]}
                      onPress={() => setTransactionType('add')}
                    >
                      <Ionicons 
                        name="add-circle" 
                        size={20} 
                        color={transactionType === 'add' ? '#FFFFFF' : theme.colors.primary} 
                      />
                      <Text style={[
                        styles.transactionTypeText,
                        transactionType === 'add' && styles.transactionTypeTextActive
                      ]} allowFontScaling={false}>
                        Add Money
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[
                        styles.transactionTypeButton,
                        transactionType === 'withdraw' && styles.transactionTypeButtonActive
                      ]}
                      onPress={() => setTransactionType('withdraw')}
                    >
                      <Ionicons 
                        name="remove-circle" 
                        size={20} 
                        color={transactionType === 'withdraw' ? '#FFFFFF' : theme.colors.primary} 
                      />
                      <Text style={[
                        styles.transactionTypeText,
                        transactionType === 'withdraw' && styles.transactionTypeTextActive
                      ]} allowFontScaling={false}>
                        Withdraw Money
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={styles.transactionTypeHint} allowFontScaling={false}>
                    💡 Withdraw option is available for personal emergencies or when you need to reallocate funds to other priorities.
                  </Text>
                  
                  <Text style={styles.modalInputLabel} allowFontScaling={false}>Amount</Text>
                  <TextInput style={styles.modalInput}
                    keyboardType="numeric"
                    value={newAmount}
                    onChangeText={setNewAmount}
                    placeholder="Enter amount"
                    placeholderTextColor={theme.colors.textSecondary} allowFontScaling={false} />
                </View>
                
                <View style={styles.modalButtons}>
                  <TouchableOpacity 
                    style={styles.modalCancelButton} 
                    onPress={() => setIsModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCancelButtonText} allowFontScaling={false}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.modalSaveButton} 
                    onPress={handleSaveProgress}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalSaveButtonText} allowFontScaling={false}>Update</Text>
                  </TouchableOpacity>
                </View>
                             </View>
           </View>
         </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const createStyles = (theme: any, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  // Header Styles
  headerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: theme.colors.background,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: '100%',
  },
  headerLeft: {
    position: 'absolute',
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    position: 'absolute',
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  greetingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  greetingText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
  },

  overallProgressCard: {
    borderRadius: 20,
    padding: 24,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  overallProgressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  overallProgressIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  overallProgressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  overallProgressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  overallStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  overallStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  overallStatLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  overallStatDivider: {
    width: 1,
    height: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 10,
  },
  overallProgressBarContainer: {
    marginTop: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 10,
    padding: 12,
  },
  overallProgressBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  overallProgressLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  overallProgressPercentage: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    minWidth: 40,
    textAlign: 'right',
    letterSpacing: 0.5,
  },
  overallProgressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  overallProgressBarFill: {
    height: '100%',
    backgroundColor: '#06D6A0',
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  goalsSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  addGoalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.primary + '10',
  },
  addGoalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
    marginLeft: 6,
  },
  goalCardContainer: {
    marginBottom: 12,
  },
  goalCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
    borderRightColor: 'rgba(0, 0, 0, 0.05)',
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  goalIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  goalIconText: {
    fontSize: 16,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: 16,
    width: 16,
    height: 16,
  },
  goalInfo: {
    flex: 1,
  },
  goalName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 2,
    lineHeight: 18,
  },
  goalTagline: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    fontWeight: '400',
    fontStyle: 'italic',
    marginTop: 2,
  },
  goalStatusBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  goalStatusText: {
    fontSize: 14,
  },
  goalProgressSection: {
    marginBottom: 12,
  },
  goalProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  goalProgressLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  goalProgressPercentage: {
    fontSize: 12,
    fontWeight: '700',
  },
  goalProgressBarContainer: {
    position: 'relative',
  },
  goalProgressBar: {
    height: 4,
    backgroundColor: theme.colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  goalProgressBarFill: {
    height: '100%',
    borderRadius: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  goalProgressDots: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingHorizontal: 1,
  },
  progressDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
  goalAmountsSection: {
    marginBottom: 12,
  },
  goalAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  goalAmountItem: {
    alignItems: 'center',
    flex: 1,
  },
  goalAmountLabel: {
    fontSize: 9,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  goalCurrentAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
  goalTargetAmount: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.text,
  },
  goalRemainingAmount: {
    fontSize: 13,
    fontWeight: '700',
  },
  goalAmountDivider: {
    width: 1,
    height: 20,
    backgroundColor: theme.colors.border,
    marginHorizontal: 4,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalDeadline: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  deadlineInfo: {
    marginLeft: 4,
  },
  goalDeadlineDate: {
    fontSize: 10,
    color: theme.colors.text,
    fontWeight: '600',
    marginBottom: 1,
  },
  goalDeadlineText: {
    fontSize: 9,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  goalActionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    minWidth: 70,
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: theme.colors.primary + '15',
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  updateButton: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
  },
  updateButtonText: {
    color: '#FFFFFF',
  },

  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  emptyStateContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  createFirstGoalButton: {
    backgroundColor: theme.colors.primary,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  createFirstGoalButtonText: {
    fontSize: 16,
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
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalGoalInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalGoalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalGoalIconText: {
    fontSize: 32,
    textAlign: 'center',
  },
  modalGoalName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  modalGoalCategory: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  modalProgressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  modalProgressItem: {
    alignItems: 'center',
    flex: 1,
  },
  modalProgressLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  modalProgressValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  modalInputContainer: {
    marginBottom: 24,
  },
  modalInputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  modalInput: {
    width: '100%',
    height: 56,
    borderColor: theme.colors.border,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: theme.colors.text,
    backgroundColor: theme.colors.background,
    textAlign: 'center',
    fontWeight: '600',
  },
  modalInputHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  transactionTypeContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  transactionTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.primary,
    backgroundColor: 'transparent',
    gap: 8,
  },
  transactionTypeButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  transactionTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  transactionTypeTextActive: {
    color: '#FFFFFF',
  },
  transactionTypeHint: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 16,
    paddingHorizontal: 8,
    fontStyle: 'italic',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  modalSaveButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  modalSaveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  tipsSection: {
    marginHorizontal: 20,
    marginBottom: 32,
    paddingTop: 24,
  },
  tipsHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  tipsHeaderIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  tipsHeaderIconText: {
    fontSize: 28,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  tipsSubtitle: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  tipsContainer: {
    gap: 16,
  },
  tipCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.colors.border + '20',
  },
  tipIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: theme.colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  tipIcon: {
    fontSize: 26,
  },
  tipContent: {
    alignItems: 'center',
  },
  tipHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 12,
  },
  tipTag: {
    backgroundColor: theme.colors.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.primary + '30',
  },
  tipTagText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default SavingsGoalsScreen;
