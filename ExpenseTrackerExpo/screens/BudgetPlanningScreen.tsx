import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useNetwork } from '../context/NetworkContext';
import OfflineScreen from '../components/OfflineScreen';
import { useScroll } from '../context/ScrollContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { categoryService, Category } from '../services/CategoryService';
import TransactionService from '../services/transactionService';
import BudgetService from '../services/BudgetService';


interface BudgetCategory {
  id: string | number;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentageUsed: number;
}

interface Expense {
  id: number;
  amount: number;
  categoryId: number;
  date: string;
}

interface Budget {
  id: number;
  categoryId: number;
  amount: number;
  period: string;
  startDate: string;
  endDate: string;
}

interface BudgetOverview {
  month: string;
  year: number;
  totalBudget: number;
  totalSpent: number;
  categories: BudgetCategory[];
}

const BudgetPlanningScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { scrollY } = useScroll();
  const { isOfflineMode } = useNetwork();
  const [currentBudget, setCurrentBudget] = useState<BudgetOverview | null>(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<BudgetCategory | null>(null);
  const [budgetInput, setBudgetInput] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    loadBudget();
  }, []);

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Budget screen focused - refreshing data...');
      loadBudget();
    }, [])
  );

  const loadBudget = async () => {
    setIsLoading(true);
    try {
      // Load all data in parallel using real services
      const [categoriesData, expensesData, budgetsData] = await Promise.all([
        categoryService.getCategories(),
        TransactionService.getTransactions(),
        BudgetService.getBudgets()
      ]);
      
      // Filter to only show expense categories (not income categories)
      // Users budget their expenses, not their income, so we exclude income categories
      const expenseCategories = categoriesData.filter(category => category.type === 'expense');
      
      // Remove duplicate categories by ID
      const uniqueCategories = expenseCategories.filter((category, index, self) => 
        index === self.findIndex(c => c.id === category.id)
      );
       
      // Update state
      setCategories(categoriesData);
      setExpenses(expensesData);
      setBudgets(budgetsData);
      
      // Build budget overview from the loaded data
      buildBudgetOverview(uniqueCategories, expensesData, budgetsData);
    } catch (error) {
      console.error('❌ Error loading budget data:', error);
      Alert.alert('Error', 'Failed to load budget data');
    } finally {
      setIsLoading(false);
    }
  };

  const buildBudgetOverview = (categoriesData: Category[], expensesData: any[], budgetsData: any[]) => {
    const currentDate = new Date();
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' });
    const currentYear = currentDate.getFullYear();
    
    console.log('🔍 BudgetPlanningScreen: Building budget overview...');
    console.log('🔍 BudgetPlanningScreen: Categories:', categoriesData.length);
    console.log('🔍 BudgetPlanningScreen: Expenses:', expensesData.length);
    console.log('🔍 BudgetPlanningScreen: Budgets:', budgetsData.length);
    
    // Create budget categories from expense categories only
    const budgetCategories: BudgetCategory[] = categoriesData.map(category => {
      // Find budget for this category (compare as strings to handle type mismatch)
      const budget = budgetsData.find((b: any) => String(b.categoryId) === String(category.id));
      const budgetAmount = budget ? parseFloat(budget.amount || 0) : 0;
      
      console.log(`🔍 Matching budget for ${category.name} (ID: ${category.id}):`, 
        budget ? `Found - ₹${budgetAmount}` : 'Not found',
        `Available budgets:`, budgetsData.map((b: any) => `${b.categoryId}(${typeof b.categoryId})`).join(', ')
      );
      
      // Calculate spent amount from expenses for current month
      const currentMonthExpenses = expensesData.filter((e: any) => {
        if (!e.date) return false;
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() === currentDate.getMonth() && 
               expenseDate.getFullYear() === currentDate.getFullYear() &&
               e.type === 'expense' &&
               e.category === category.name;
      });
      
      const spentAmount = currentMonthExpenses.reduce((sum: number, expense: any) => {
        return sum + parseFloat(expense.amount || 0);
      }, 0);
      
      console.log(`🔍 BudgetPlanningScreen: Category ${category.name}:`, {
        budgetAmount,
        spentAmount,
        expenseCount: currentMonthExpenses.length
      });
      
      const percentageUsed = budgetAmount === 0 ? 0 : Math.min((spentAmount / budgetAmount) * 100, 100);
      
      return {
        id: category.id || `category-${Math.random()}`,
        name: category.name || 'Unknown Category',
        icon: category.icon || 'ellipsis-horizontal',
        color: category.color || '#A9A9A9',
        type: 'expense', // All categories in budget screen are expense categories
        budgetAmount: isNaN(budgetAmount) ? 0 : budgetAmount,
        spentAmount: isNaN(spentAmount) ? 0 : spentAmount,
        remainingAmount: Math.max((isNaN(budgetAmount) ? 0 : budgetAmount) - (isNaN(spentAmount) ? 0 : spentAmount), 0),
        percentageUsed: isNaN(percentageUsed) ? 0 : percentageUsed,
      };
    });
    
    // Calculate totals
    const totalBudget = budgetCategories.reduce((sum, cat) => sum + cat.budgetAmount, 0);
    const totalSpent = budgetCategories.reduce((sum, cat) => sum + cat.spentAmount, 0);
    
    console.log('🔍 BudgetPlanningScreen: Budget overview totals:', {
      totalBudget,
      totalSpent,
      categoriesCount: budgetCategories.length
    });
    
    const budgetOverview: BudgetOverview = {
      month: currentMonth,
      year: currentYear,
      totalBudget,
      totalSpent,
      categories: budgetCategories
    };
    
    setCurrentBudget(budgetOverview);
  };

  const formatCurrency = (amount: number) => {
    if (isNaN(amount) || amount === null || amount === undefined) {
      return '₹0';
    }
    return `₹${amount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const getProgressPercentage = (spent: number, budget: number) => {
    if (budget === 0 || isNaN(budget) || isNaN(spent)) return 0;
    const percentage = (spent / budget) * 100;
    return isNaN(percentage) ? 0 : Math.min(percentage, 100);
  };

  const getProgressColor = (percentage: number) => {
    if (isNaN(percentage) || percentage < 0) return '#4ECDC4';
    if (percentage < 50) return '#4ECDC4';
    if (percentage < 80) return '#FFEAA7';
    return '#FF6B6B';
  };

  const getRemainingAmount = (budget: number, spent: number) => {
    if (isNaN(budget) || isNaN(spent)) return 0;
    return Math.max(budget - spent, 0);
  };

  const handleEditBudget = (category: BudgetCategory) => {
    setSelectedCategory(category);
    setBudgetInput(category.budgetAmount.toString());
    setIsEditModalVisible(true);
  };

  const saveBudgetEdit = async () => {
    if (selectedCategory && currentBudget) {
      const newAmount = parseFloat(budgetInput) || 0;
      
      try {
        console.log('🔍 BudgetPlanningScreen: Saving budget edit for category:', selectedCategory.name, 'amount:', newAmount);
        
        // Check if budget already exists for this category
        const existingBudget = budgets.find((b: any) => b.categoryId === selectedCategory.id.toString());
        
        if (existingBudget) {
          // Update existing budget
          console.log('🔍 BudgetPlanningScreen: Updating existing budget:', existingBudget.id);
          const result = await BudgetService.updateBudget(existingBudget.id, { amount: newAmount });
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to update budget');
          }
        } else {
          // Create new budget
          console.log('🔍 BudgetPlanningScreen: Creating new budget for category:', selectedCategory.id);
          const currentDate = new Date();
          const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          
          const result = await BudgetService.addBudget({
            name: `${selectedCategory.name} Budget`,
            categoryId: selectedCategory.id.toString(),
            amount: newAmount,
            period: 'monthly',
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString()
          });
          
          if (!result.success) {
            throw new Error(result.error || 'Failed to create budget');
          }
        }
        
        // Reload all data and rebuild overview
        console.log('🔍 BudgetPlanningScreen: Reloading budget data...');
        await loadBudget();
        
        Alert.alert('Success', 'Budget updated successfully!');
      } catch (error) {
        console.error('🔍 BudgetPlanningScreen: Error saving budget:', error);
        Alert.alert('Error', `Failed to save budget: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    setIsEditModalVisible(false);
    setSelectedCategory(null);
    setBudgetInput('');
  };

  const styles = createStyles(theme, insets);

  // Show offline screen when offline
  if (isOfflineMode) {
    return (
      <OfflineScreen 
        title="Budget planning unavailable 📊"
        message="Your budget data is stored safely in the cloud. Connect to the internet to plan and track your expenses."
      />
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText} allowFontScaling={false}>Loading budget data...</Text>
      </View>
    );
  }

  if (!currentBudget || currentBudget.categories.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Ionicons name="pie-chart-outline" size={64} color="#999" />
          <Text style={styles.emptyStateTitle} allowFontScaling={false}>No Expense Categories Found</Text>
          <Text style={styles.emptyStateSubtitle} allowFontScaling={false}>
            Add some expense categories in the admin panel to start budgeting your expenses
          </Text>

        </View>
      </View>
    );
  }

  const overallProgress = currentBudget.totalBudget === 0 || isNaN(currentBudget.totalBudget) || isNaN(currentBudget.totalSpent) 
    ? 0 
    : Math.min((currentBudget.totalSpent / currentBudget.totalBudget) * 100, 100);

  // Header Component
  const BudgetHeader: React.FC<{ theme: any; insets: any }> = ({ theme, insets }) => {
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
              Budget Planning
            </Text>
          </View>
          <View style={styles.headerRight}>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <BudgetHeader theme={theme} insets={insets} />
      
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
        {/* Budget Overview Card */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.overviewCard}
        >
          <View style={styles.overviewHeader}>
            <Text style={styles.overviewIcon} allowFontScaling={false}>📊</Text>
            <Text style={styles.overviewTitle} allowFontScaling={false}>BUDGET OVERVIEW</Text>
          </View>
          
          <Text style={styles.monthYear} allowFontScaling={false}>{currentBudget.month} {currentBudget.year}</Text>
          
          <View style={styles.budgetSummary}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue} allowFontScaling={false}>{formatCurrency(currentBudget.totalBudget)}</Text>
              <Text style={styles.summaryLabel} allowFontScaling={false}>Total Budget</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue} allowFontScaling={false}>{formatCurrency(currentBudget.totalSpent)}</Text>
              <Text style={styles.summaryLabel} allowFontScaling={false}>Total Spent</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue} allowFontScaling={false}>
                {formatCurrency(getRemainingAmount(currentBudget.totalBudget, currentBudget.totalSpent))}
              </Text>
              <Text style={styles.summaryLabel} allowFontScaling={false}>Remaining</Text>
            </View>
          </View>

          <View style={styles.overallProgress}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel} allowFontScaling={false}>Overall Progress</Text>
              <Text style={styles.progressPercentage} allowFontScaling={false}>{Math.round(overallProgress)}%</Text>
            </View>
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { 
                    width: `${overallProgress}%`,
                    backgroundColor: getProgressColor(overallProgress)
                  }
                ]} 
              />
            </View>
          </View>
        </LinearGradient>

        {/* Categories Section */}
        <View style={styles.categoriesSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle} allowFontScaling={false}>Expense Categories</Text>
            <TouchableOpacity style={styles.addCategoryButton}>
              <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
            </TouchableOpacity>
          </View>
          
          {currentBudget.categories.map((category) => {
            const progress = getProgressPercentage(category.spentAmount, category.budgetAmount);
            const remaining = getRemainingAmount(category.budgetAmount, category.spentAmount);
            const isOverBudget = category.spentAmount > category.budgetAmount;
            
            return (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryCard}
                onPress={() => handleEditBudget(category)}
                activeOpacity={0.7}
              >
                <View style={styles.categoryHeader}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                      <Ionicons name={category.icon as any} size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.categoryInfo}>
                      <Text style={styles.categoryName} allowFontScaling={false} numberOfLines={1}>{category.name}</Text>
                      <Text style={[
                        styles.categoryStatus,
                        { color: isOverBudget ? '#FF6B6B' : '#4ECDC4' }
                      ]} allowFontScaling={false}>
                        {isOverBudget 
                          ? `Over by ${formatCurrency(category.spentAmount - category.budgetAmount)}`
                          : `${formatCurrency(remaining)} remaining`
                        }
                      </Text>
                    </View>
                  </View>
                  <View style={styles.categoryRight}>
                    <Text style={styles.categoryAmount} allowFontScaling={false} numberOfLines={1}>
                      {formatCurrency(category.spentAmount)} / {formatCurrency(category.budgetAmount)}
                    </Text>
                    <Ionicons name="chevron-forward" size={16} color="#999" />
                  </View>
                </View>
                
                <View style={styles.categoryProgressContainer}>
                  <View style={styles.categoryProgressBar}>
                    <View 
                      style={[
                        styles.categoryProgressFill, 
                        { 
                          width: `${Math.min(progress, 100)}%`,
                          backgroundColor: getProgressColor(progress)
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.categoryProgressText} allowFontScaling={false}>{Math.round(progress)}%</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Budget Tips */}
        <View style={styles.tipsSection}>
          <LinearGradient
            colors={['#2C5530', '#4A7C59']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.tipsCard}
          >
            <View style={styles.tipsHeader}>
              <View style={styles.tipsIconContainer}>
                <Ionicons name="bulb" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.tipsHeaderText}>
                <Text style={styles.tipsTitle} allowFontScaling={false}>Budget Tips</Text>
                <Text style={styles.tipsSubtitle} allowFontScaling={false}>Smart spending insights</Text>
              </View>
            </View>
            
            <View style={styles.tipsList}>
              {currentBudget && currentBudget.categories.length > 0 ? (
                <>
                  {(() => {
                    const wellPerformingCategories = currentBudget.categories.filter(cat => 
                      cat.budgetAmount > 0 && cat.percentageUsed < 50
                    );
                    const overBudgetCategories = currentBudget.categories.filter(cat => 
                      cat.budgetAmount > 0 && cat.percentageUsed > 100
                    );
                    const nearLimitCategories = currentBudget.categories.filter(cat => 
                      cat.budgetAmount > 0 && cat.percentageUsed > 80 && cat.percentageUsed <= 100
                    );
                    
                    const tips = [];
                    let tipIndex = 0;
                    
                    if (wellPerformingCategories.length > 0) {
                      tips.push(
                        <View key={`good-${Date.now()}-${tipIndex++}`} style={styles.tipItem}>
                          <Ionicons name="checkmark-circle" size={16} color="#4ECDC4" />
                          <Text style={styles.tipText} allowFontScaling={false}>
                            Great job with {wellPerformingCategories[0].name}! You're under budget.
                          </Text>
                        </View>
                      );
                    }
                    
                    if (overBudgetCategories.length > 0) {
                      tips.push(
                        <View key={`over-${Date.now()}-${tipIndex++}`} style={styles.tipItem}>
                          <Ionicons name="warning" size={16} color="#FF6B6B" />
                          <Text style={styles.tipText} allowFontScaling={false}>
                            {overBudgetCategories[0].name} is over budget. Consider reducing expenses.
                          </Text>
                        </View>
                      );
                    }
                    
                    if (nearLimitCategories.length > 0) {
                      tips.push(
                        <View key={`near-${Date.now()}-${tipIndex++}`} style={styles.tipItem}>
                          <Ionicons name="trending-up" size={16} color="#FFEAA7" />
                          <Text style={styles.tipText} allowFontScaling={false}>
                            {nearLimitCategories[0].name} is near budget limit. Monitor spending carefully.
                          </Text>
                        </View>
                      );
                    }
                    
                    if (tips.length === 0) {
                      tips.push(
                        <View key={`default-${Date.now()}-${tipIndex++}`} style={styles.tipItem}>
                          <Ionicons name="bulb" size={16} color="#4ECDC4" />
                          <Text style={styles.tipText} allowFontScaling={false}>
                            Set budgets for your expense categories to track spending better.
                          </Text>
                        </View>
                      );
                    }
                    
                    return tips;
                  })()}
                </>
              ) : (
                <View style={styles.tipItem}>
                  <Ionicons name="bulb" size={16} color="#4ECDC4" />
                  <Text style={styles.tipText} allowFontScaling={false}>
                    Set budgets for your expense categories to track spending better.
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>
        </View>
      </ScrollView>

      {/* Edit Budget Modal */}
      <Modal
        visible={isEditModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsEditModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle} allowFontScaling={false}>
              Edit {selectedCategory?.name} Budget
            </Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel} allowFontScaling={false}>Budget Amount</Text>
              <TextInput style={styles.budgetInput}
                value={budgetInput}
                onChangeText={setBudgetInput}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor="#999" allowFontScaling={false} />
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setIsEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText} allowFontScaling={false}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveBudgetEdit}
              >
                <Text style={styles.saveButtonText} allowFontScaling={false}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
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
  subtitleText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 100,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },

  overviewCard: {
    borderRadius: 20,
    padding: 24,
    marginTop: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  overviewIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  overviewTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  monthYear: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  budgetSummary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 24,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 8,
  },
  overallProgress: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  progressPercentage: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  categoriesSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: 0.5,
  },
  addCategoryButton: {
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.03)',
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
    letterSpacing: 0.3,
    flexShrink: 1,
    numberOfLines: 1,
  },
  categoryStatus: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    opacity: 1,
  },
  categoryRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  categoryAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'right',
    marginBottom: 4,
    flexShrink: 1,
    numberOfLines: 1,
  },
  categoryProgressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  categoryProgressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#F8F9FA',
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  categoryProgressFill: {
    height: '100%',
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
  categoryProgressText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1A1A1A',
    minWidth: 40,
    textAlign: 'right',
    letterSpacing: 0.5,
  },
  tipsSection: {
    marginBottom: 24,
  },
  tipsCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  tipsIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  tipsHeaderText: {
    flex: 1,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  tipsSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  tipsList: {
    gap: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  tipText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  budgetInput: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    height: 56,
    color: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F5F5F5',
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default BudgetPlanningScreen;




