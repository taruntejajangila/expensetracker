import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import GoalService from '../services/GoalService';
import { BannerAdComponent } from '../components/AdMobComponents';

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

interface UpdateProgressScreenProps {
  route: {
    params: {
      goal: SavingsGoal;
    };
  };
  navigation: any;
}

const UpdateProgressScreen: React.FC<UpdateProgressScreenProps> = ({ route, navigation }) => {
  const { goal } = route.params;
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [newAmount, setNewAmount] = useState('');
  const [transactionType, setTransactionType] = useState<'add' | 'withdraw'>('add');
  const [isLoading, setIsLoading] = useState(false);

  const formatCurrency = (amount: number) => {
    const isNegative = amount < 0;
    const absoluteAmount = Math.abs(amount);
    return `${isNegative ? '-' : ''}₹${absoluteAmount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const getColorWithOpacity = (color: string, opacity: number) => {
    // Convert hex to rgba
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  const handleSaveProgress = async () => {
    if (!newAmount) {
      Alert.alert('Error', 'Please enter an amount.');
      return;
    }

    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount greater than 0.');
      return;
    }

    try {
      setIsLoading(true);
      let result: { success: boolean };
      
      if (transactionType === 'add') {
        // Add money to the goal
        result = await GoalService.addToGoal(goal.id, amount);
      } else {
        // Withdraw money from the goal
        // Check if withdrawal amount is valid
        if (amount > goal.currentAmount) {
          Alert.alert('Error', 'Cannot withdraw more than the current amount saved.');
          setIsLoading(false);
          return;
        }
        result = await GoalService.withdrawFromGoal(goal.id, amount);
      }
      
      if (result.success) {
        Alert.alert('Success', 'Goal progress updated successfully!', [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            }
          }
        ]);
      } else {
        Alert.alert('Error', 'Failed to update goal progress. Please try again.');
      }
    } catch (error) {
      console.error('Error updating goal progress:', error);
      Alert.alert('Error', 'Failed to update goal progress. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const headerPaddingTop = Platform.OS === 'android' ? insets.top + 5 : insets.top + 10;

  const styles = createStyles(theme, insets);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
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
              Update Progress
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              Add or withdraw money
            </Text>
          </View>
          
          <View style={styles.headerRight} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Goal Info */}
        <View style={styles.goalInfo}>
          <View style={[styles.goalIcon, { backgroundColor: getColorWithOpacity(goal.color, 0.15) }]}>
            <Text style={styles.goalIconText} allowFontScaling={false}>{goal.icon}</Text>
          </View>
          <Text style={styles.goalName} allowFontScaling={false}>{goal.name}</Text>
        </View>
        
        {/* Progress Info */}
        <View style={styles.progressInfo}>
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel} allowFontScaling={false}>Target Amount</Text>
            <Text style={styles.progressValue} allowFontScaling={false}>
              {formatCurrency(goal.targetAmount)}
            </Text>
          </View>
          <View style={styles.progressItem}>
            <Text style={styles.progressLabel} allowFontScaling={false}>Current Amount</Text>
            <Text style={styles.progressValue} allowFontScaling={false}>
              {formatCurrency(goal.currentAmount)}
            </Text>
          </View>
        </View>
        
        {/* Input Container */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel} allowFontScaling={false}>Transaction Type</Text>
          <View style={styles.transactionTypeContainer}>
            <TouchableOpacity
              style={[
                styles.transactionTypeButton,
                transactionType === 'add' && styles.transactionTypeButtonActive
              ]}
              onPress={() => setTransactionType('add')}
              disabled={isLoading}
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
              disabled={isLoading}
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
          
          <Text style={styles.inputLabel} allowFontScaling={false}>Amount</Text>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            value={newAmount}
            onChangeText={setNewAmount}
            placeholder="Enter amount"
            placeholderTextColor={theme.colors.textSecondary}
            editable={!isLoading}
            allowFontScaling={false}
          />
        </View>
        
        {/* Banner Ad */}
        <View style={styles.adContainer}>
          <BannerAdComponent />
        </View>
        
        {/* Buttons */}
        <View style={styles.buttons}>
          <TouchableOpacity 
            style={styles.cancelButton} 
            onPress={() => navigation.goBack()}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelButtonText} allowFontScaling={false}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
            onPress={handleSaveProgress}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.saveButtonText} allowFontScaling={false}>
              {isLoading ? 'Updating...' : 'Update'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: any, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  headerContainer: {
    paddingHorizontal: theme.spacing?.md || 16,
    paddingBottom: theme.spacing?.md || 16,
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 24 + insets.bottom,
  },
  goalInfo: {
    alignItems: 'center',
    marginBottom: 32,
  },
  goalIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  goalIconText: {
    fontSize: 32,
    textAlign: 'center',
  },
  goalName: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 56,
    borderColor: theme.colors.border,
    borderWidth: 2,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 14,
    color: theme.colors.text,
    backgroundColor: theme.colors.surface,
    textAlign: 'center',
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
  adContainer: {
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textSecondary,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default UpdateProgressScreen;

