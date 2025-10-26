import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import TransactionService from '../services/transactionService';
import OfflineScreen from '../components/OfflineScreen';
import { useNetwork } from '../context/NetworkContext';
import { BannerAdComponent } from '../components/AdMobComponents';

const Tab = createMaterialTopTabNavigator();

// Create styles outside the component so they can be shared
const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 0, // Header will handle spacing
  },
  dropdownContainer: {
    position: 'absolute',
    top: 0, // Will be positioned by custom header
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 9999,
    overflow: 'hidden', // Important for Android clipping
    // Remove elevation and shadows for Android
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    borderTopWidth: 0,
    borderBottomWidth: 0,
  },
  horizontalScrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  monthItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    minHeight: 50,
  },
  selectedMonthItem: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  monthText: {
    fontSize: 12,
    color: '#333333',
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 16,
  },
  expenseText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '400',
    marginBottom: 2,
    textAlign: 'center',
    lineHeight: 14,
  },
  selectedMonthText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
  // Transaction list styles
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  adContainer: {
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderTopColor: '#E0E0E0',
    borderBottomColor: '#E0E0E0',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  transactionCategory: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 2,
    fontWeight: 'bold',
  },
  transactionDate: {
    fontSize: 10,
    color: '#999999',
    marginTop: 4,
  },
  transactionRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    fontSize: 14,
    color: '#999999',
    textAlign: 'center',
  },
  // Category list styles
  totalSpendingHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginBottom: 8,
  },
  totalSpendingLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 4,
  },
  totalSpendingAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333333',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 2,
  },
  categoryTransactionCount: {
    fontSize: 10,
    color: '#999999',
    fontWeight: '400',
  },
  categoryRight: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  categoryAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF3B30',
    marginBottom: 2,
  },
  categoryPercentage: {
    fontSize: 10,
    color: '#666666',
    fontWeight: '500',
  },
  // Monthly summary styles
  monthlySummaryContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginTop: 15,
  },
  monthlySummaryContainerWithDropdown: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    marginTop: 70, // Space for dropdown
  },
  summaryHeader: {
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#999999',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  incomeAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34C759',
  },
  expenseAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF3B30',
  },
  balanceAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 16,
  },
  // Month navigation buttons
  monthNavContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  monthNavButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    maxWidth: 150,
  },
  monthNavButtonDisabled: {
    backgroundColor: '#CCCCCC',
    shadowOpacity: 0.1,
    elevation: 2,
  },
  monthNavButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginHorizontal: 8,
  },
  monthNavButtonLeft: {
    alignSelf: 'flex-start',
  },
  monthNavButtonRight: {
    alignSelf: 'flex-end',
  },
});

// Transactions Tab Component
const TransactionsTab: React.FC<{ 
  selectedMonth: string; 
  onPreviousMonth: () => void; 
  onNextMonth: () => void; 
  isPreviousDisabled: boolean; 
  isNextDisabled: boolean;
  previousMonthName: string;
  nextMonthName: string;
  isCurrentMonth: boolean;
}> = ({ selectedMonth, onPreviousMonth, onNextMonth, isPreviousDisabled, isNextDisabled, previousMonthName, nextMonthName, isCurrentMonth }) => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const styles = createStyles(theme);
  
  // Transactions will be fetched from TransactionService
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load transactions data
  const loadTransactions = async () => {
    try {
      setLoading(true);
      const allTransactions = await TransactionService.getTransactions();
      setTransactions(allTransactions);
      setLoading(false);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  // Force refresh when tab comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔍 AllTransactionScreen: Force refreshing transactions on focus');
      loadTransactions();
    }, [])
  );

  // Parse month year from selectedMonth string and filter transactions
  const filteredTransactions = React.useMemo(() => {
    if (!selectedMonth || transactions.length === 0) return [];
    
    // Parse the month string (e.g., "December" or "December 2023")
    const currentYear = new Date().getFullYear();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    let targetMonth, targetYear;
    
    if (selectedMonth.includes(' ')) {
      // Format: "December 2023"
      const [monthName, yearStr] = selectedMonth.split(' ');
      targetMonth = monthNames.indexOf(monthName);
      targetYear = parseInt(yearStr);
    } else {
      // Format: "December" (current year)
      targetMonth = monthNames.indexOf(selectedMonth);
      targetYear = currentYear;
    }
    
    return transactions.filter(transaction => {
      if (!transaction || !transaction.date) return false;
      
      // Parse date with the same logic as display function
      let transactionDate: Date;
      if (transaction.date instanceof Date) {
        transactionDate = transaction.date;
      } else {
        const dateString = typeof transaction.date === 'string' ? transaction.date : String(transaction.date);
        
        if (dateString.includes('T')) {
          const [datePart, timePart] = dateString.split('T');
          const [year, month, day] = datePart.split('-').map(Number);
          const cleanTimePart = timePart.split('.')[0].split('+')[0].split('Z')[0];
          const [hours, minutes, seconds] = (cleanTimePart || '00:00:00').split(':').map(Number);
          transactionDate = new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0);
        } else if (dateString.includes('-')) {
          const [year, month, day] = dateString.split('-').map(Number);
          transactionDate = new Date(year, month - 1, day);
        } else {
          transactionDate = new Date(dateString);
        }
      }
      
      if (isNaN(transactionDate.getTime())) return false;
      const matches = transactionDate.getMonth() === targetMonth && 
                      transactionDate.getFullYear() === targetYear;
      
      console.log(`🔍 Filtering transaction: date=${transaction.date}, parsed=${transactionDate.toISOString()}, target=${targetMonth}/${targetYear}, matches=${matches}`);
      
      return matches;
    });
  }, [transactions, selectedMonth]);

  // Format transaction date
  const formatTransactionDate = (date: any) => {
    // Handle undefined or invalid date
    if (!date) {
      return 'Invalid Date';
    }
    
    // Convert date to Date object if it's already a Date
    let dateObj: Date;
    if (date instanceof Date) {
      dateObj = date;
    } else {
      // Ensure date is a string before calling string methods
      const dateString = typeof date === 'string' ? date : String(date);
      
      // Debug log to see what we're receiving
      console.log('🔍 Date string received:', dateString);
      
      // Parse date with time in local timezone (no timezone conversion)
      if (dateString.includes('T')) {
        // ISO-like format with time: "2025-10-21T15:30:00" (no timezone)
        const [datePart, timePart] = dateString.split('T');
        const [year, month, day] = datePart.split('-').map(Number);
        // Handle time part with or without microseconds and timezone
        const cleanTimePart = timePart.split('.')[0].split('+')[0].split('Z')[0]; // Remove milliseconds and timezone
        const [hours, minutes, seconds] = (cleanTimePart || '00:00:00').split(':').map(Number);
        dateObj = new Date(year, month - 1, day, hours || 0, minutes || 0, seconds || 0);
      } else if (dateString.includes('-')) {
        // Date-only format (YYYY-MM-DD) - parse as local date at midnight
        const [year, month, day] = dateString.split('-').map(Number);
        dateObj = new Date(year, month - 1, day);
      } else {
        // Fallback to standard Date parsing
        dateObj = new Date(dateString);
      }
    }
    
    // Check if date is valid
    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const transactionDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

    if (transactionDate.getTime() === today.getTime()) {
      // Show time for today's transactions
      return `Today, ${dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (transactionDate.getTime() === yesterday.getTime()) {
      // Show time for yesterday's transactions
      return `Yesterday, ${dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      // Show date and time for older transactions
      return `${dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}, ${dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {loading ? (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText} allowFontScaling={false}>Loading transactions...</Text>
        </View>
      ) : filteredTransactions.length > 0 ? (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {filteredTransactions.map((transaction, index) => {
            const showAd = index > 0 && index % 5 === 0;
            
            return (
              <React.Fragment key={transaction.id}>
                <TouchableOpacity 
                  style={styles.transactionItem}
                  onPress={() => (navigation as any).navigate('TransactionDetail', { transactionId: transaction.id })}
                >
                  <View style={styles.transactionLeft}>
                    <View style={[styles.categoryIcon, { backgroundColor: transaction.categorycolor || transaction.color || '#007AFF' }]}>
                      <Ionicons name={transaction.categoryicon || transaction.icon || 'receipt'} size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.transactionDetails}>
                      <Text style={styles.transactionTitle} allowFontScaling={false}>{transaction.description || transaction.title}</Text>
                      <Text style={styles.transactionCategory} allowFontScaling={false}>{transaction.category}</Text>
                    </View>
                  </View>
                  <View style={styles.transactionRight}>
                    <View style={styles.amountContainer}>
                      <Ionicons 
                        name={transaction.type === 'expense' ? 'arrow-up' : 'arrow-down'} 
                        size={12} 
                        color={transaction.type === 'expense' ? '#FF3B30' : '#34C759'} 
                        style={{ 
                          transform: [{ rotate: '45deg' }], 
                          marginRight: 4 
                        }} 
                      />
                      <Text style={[
                        styles.transactionAmount,
                        { color: transaction.type === 'expense' ? '#FF3B30' : '#34C759' }
                      ]} allowFontScaling={false}>
                        ₹{transaction.amount ? parseFloat(transaction.amount).toFixed(2) : '0.00'}
                      </Text>
                    </View>
                    <Text style={styles.transactionDate} allowFontScaling={false}>{formatTransactionDate(transaction.date)}</Text>
                  </View>
                </TouchableOpacity>
                
                {/* Show banner ad after every 6 transactions */}
                {showAd && (
                  <View style={styles.adContainer}>
                    <BannerAdComponent />
                  </View>
                )}
              </React.Fragment>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="receipt-outline" size={56} color="#CCCCCC" />
          <Text style={styles.emptyStateTitle} allowFontScaling={false}>No Transactions</Text>
          <Text style={styles.emptyStateSubtitle} allowFontScaling={false}>
            No transactions found for {selectedMonth}
          </Text>
        </View>
      )}
      
      {/* Month Navigation Buttons */}
      <View style={styles.monthNavContainer}>
        {!isPreviousDisabled && (
          <TouchableOpacity 
            style={[styles.monthNavButton, styles.monthNavButtonLeft]} 
            onPress={onPreviousMonth}
          >
            <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
            <Text style={styles.monthNavButtonText} allowFontScaling={false}>{previousMonthName}</Text>
          </TouchableOpacity>
        )}
        
        {!isCurrentMonth && (
          <TouchableOpacity 
            style={[styles.monthNavButton, styles.monthNavButtonRight]} 
            onPress={onNextMonth}
          >
            <Text style={styles.monthNavButtonText} allowFontScaling={false}>{nextMonthName}</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Categories Tab Component
const CategoriesTab: React.FC<{ 
  selectedMonth: string; 
  onPreviousMonth: () => void; 
  onNextMonth: () => void; 
  isPreviousDisabled: boolean; 
  isNextDisabled: boolean;
  previousMonthName: string;
  nextMonthName: string;
  isCurrentMonth: boolean;
}> = ({ selectedMonth, onPreviousMonth, onNextMonth, isPreviousDisabled, isNextDisabled, previousMonthName, nextMonthName, isCurrentMonth }) => {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  
  // Transactions will be fetched from TransactionService
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load transactions data
  const loadTransactions = async () => {
    try {
      setLoading(true);
      const allTransactions = await TransactionService.getTransactions();
      setTransactions(allTransactions);
      setLoading(false);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  // Force refresh when tab comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔍 AllTransactionScreen: Force refreshing transactions on focus');
      loadTransactions();
    }, [])
  );

  // Parse month year from selectedMonth string and filter transactions
  const filteredTransactions = React.useMemo(() => {
    if (!selectedMonth || transactions.length === 0) return [];
    
    // Parse the month string (e.g., "December" or "December 2023")
    const currentYear = new Date().getFullYear();
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    
    let targetMonth, targetYear;
    
    if (selectedMonth.includes(' ')) {
      // Format: "December 2023"
      const [monthName, yearStr] = selectedMonth.split(' ');
      targetMonth = monthNames.indexOf(monthName);
      targetYear = parseInt(yearStr);
    } else {
      // Format: "December" (current year)
      targetMonth = monthNames.indexOf(selectedMonth);
      targetYear = currentYear;
    }
    
    return transactions.filter(transaction => {
      if (!transaction || !transaction.date) return false;
      const transactionDate = new Date(transaction.date);
      if (isNaN(transactionDate.getTime())) return false;
      return transactionDate.getMonth() === targetMonth && 
             transactionDate.getFullYear() === targetYear &&
             transaction.type === 'expense'; // Only show expenses for category analysis
    });
  }, [transactions, selectedMonth]);

  // Calculate category-wise spending
  const categorySpending = React.useMemo(() => {
    const spending: { [key: string]: { amount: number; count: number; icon: string; color: string } } = {};
    
    filteredTransactions.forEach(transaction => {
      const category = transaction.category;
      if (!spending[category]) {
        spending[category] = {
          amount: 0,
          count: 0,
          icon: transaction.categoryicon || transaction.icon || 'ellipsis-horizontal',
          color: transaction.categorycolor || transaction.color || '#BDC3C7'
        };
      }
      spending[category].amount += parseFloat(transaction.amount || 0);
      spending[category].count += 1;
    });
    
    // Convert to array and sort by amount (highest first)
    const sortedCategories = Object.entries(spending)
      .map(([category, data]) => ({
        category,
        ...data
      }))
      .sort((a, b) => b.amount - a.amount);
    
    return sortedCategories;
  }, [filteredTransactions]);

  // Calculate total spending for percentage calculation
  const totalSpending = React.useMemo(() => {
    return categorySpending.reduce((total, category) => total + category.amount, 0);
  }, [categorySpending]);

  // Calculate percentage for each category
  const getPercentage = (amount: number) => {
    if (totalSpending === 0) return 0;
    return (amount / totalSpending) * 100;
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {loading ? (
        <View style={styles.loadingState}>
          <Text style={styles.loadingText} allowFontScaling={false}>Loading categories...</Text>
        </View>
      ) : categorySpending.length > 0 ? (
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          {/* Category List */}
          {categorySpending.map((category, index) => {
            const showAd = index > 0 && index % 3 === 0;
            
            return (
              <React.Fragment key={category.category}>
                <View style={styles.categoryItem}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                      <Ionicons name={category.icon as any} size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.categoryDetails}>
                      <Text style={styles.categoryName} allowFontScaling={false}>
                        {category.category.charAt(0).toUpperCase() + category.category.slice(1)}
                      </Text>
                      <Text style={styles.categoryTransactionCount} allowFontScaling={false}>
                        {category.count} transaction{category.count !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.categoryRight}>
                    <Text style={styles.categoryAmount} allowFontScaling={false}>₹{category.amount ? category.amount.toFixed(2) : '0.00'}</Text>
                    <Text style={styles.categoryPercentage} allowFontScaling={false}>
                      {getPercentage(category.amount).toFixed(1)}%
                    </Text>
                  </View>
                </View>
                
                {/* Show banner ad after every 3 categories */}
                {showAd && (
                  <View style={styles.adContainer}>
                    <BannerAdComponent />
                  </View>
                )}
              </React.Fragment>
            );
          })}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="pie-chart-outline" size={56} color="#CCCCCC" />
          <Text style={styles.emptyStateTitle} allowFontScaling={false}>No Expenses</Text>
          <Text style={styles.emptyStateSubtitle} allowFontScaling={false}>
            No expenses found for {selectedMonth}
          </Text>
        </View>
      )}
      
      {/* Month Navigation Buttons */}
      <View style={styles.monthNavContainer}>
        {!isPreviousDisabled && (
          <TouchableOpacity 
            style={[styles.monthNavButton, styles.monthNavButtonLeft]} 
            onPress={onPreviousMonth}
          >
            <Ionicons name="chevron-back" size={18} color="#FFFFFF" />
            <Text style={styles.monthNavButtonText} allowFontScaling={false}>{previousMonthName}</Text>
          </TouchableOpacity>
        )}
        
        {!isCurrentMonth && (
          <TouchableOpacity 
            style={[styles.monthNavButton, styles.monthNavButtonRight]} 
            onPress={onNextMonth}
          >
            <Text style={styles.monthNavButtonText} allowFontScaling={false}>{nextMonthName}</Text>
            <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const AllTransactionScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { isOfflineMode } = useNetwork();
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const styles = createStyles(theme);

  // Animation values
  const dropdownAnimation = useRef(new Animated.Value(0)).current;
  const overviewAnimation = useRef(new Animated.Value(0)).current;

  // Monthly expenses and income will be fetched from TransactionService
  const [monthlyExpenses, setMonthlyExpenses] = useState<{ [key: string]: number }>({});
  const [monthlyIncome, setMonthlyIncome] = useState<{ [key: string]: number }>({});
  const [expensesLoading, setExpensesLoading] = useState(true);

  // Load monthly expense and income data
  const loadMonthlyData = async () => {
    try {
      setExpensesLoading(true);
      const allTransactions = await TransactionService.getTransactions();
      
      // Calculate monthly expenses and income
      const expenseData: { [key: string]: number } = {};
      const incomeData: { [key: string]: number } = {};
      
      allTransactions.forEach(transaction => {
        const date = new Date(transaction.date);
        const monthNames = [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        const currentYear = new Date().getFullYear();
        const transactionYear = date.getFullYear();
        const monthName = monthNames[date.getMonth()];
        
        // Create month label (e.g., "December" for current year, "December 2023" for other years)
        const monthLabel = transactionYear === currentYear ? monthName : `${monthName} ${transactionYear}`;
        
        if (transaction.type === 'expense') {
          expenseData[monthLabel] = (expenseData[monthLabel] || 0) + parseFloat(transaction.amount || 0);
        } else if (transaction.type === 'income') {
          incomeData[monthLabel] = (incomeData[monthLabel] || 0) + parseFloat(transaction.amount || 0);
        }
      });
      
      setMonthlyExpenses(expenseData);
      setMonthlyIncome(incomeData);
      setExpensesLoading(false);
    } catch (error) {
      console.error('Error loading monthly data:', error);
      setExpensesLoading(false);
    }
  };

  const getMonthlyExpense = (monthLabel: string) => {
    return monthlyExpenses[monthLabel] || 0;
  };

  useEffect(() => {
    loadMonthlyData();
  }, []);

  // Reload when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadMonthlyData();
    }, [])
  );

  // Generate months from current month to 3 years back
  const generateMonths = () => {
    const months = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    
    for (let i = 0; i <= 36; i++) { // 3 years = 36 months, from newest to oldest
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthYear = date.getFullYear();
      
      // Show year only for previous years, not current year
      const label = monthYear === currentYear 
        ? date.toLocaleDateString('en-US', { month: 'long' })
        : date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      months.push({
        id: i.toString(),
        label,
        value: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        date
      });
    }
    
    return months;
  };

  const months = generateMonths();

  // Set initial selected month to current month (first item in array)
  useEffect(() => {
    if (months.length > 0) {
      setSelectedMonth(months[0].label);
    }
  }, []);

  // Month navigation functions
  const goToPreviousMonth = () => {
    const currentIndex = months.findIndex(month => month.label === selectedMonth);
    if (currentIndex < months.length - 1) {
      setSelectedMonth(months[currentIndex + 1].label);
    }
  };

  const goToNextMonth = () => {
    const currentIndex = months.findIndex(month => month.label === selectedMonth);
    if (currentIndex > 0) {
      setSelectedMonth(months[currentIndex - 1].label);
    }
  };

  // Get month names for navigation
  const getPreviousMonthName = () => {
    const currentIndex = months.findIndex(month => month.label === selectedMonth);
    if (currentIndex < months.length - 1) {
      return months[currentIndex + 1].label;
    }
    return '';
  };

  const getNextMonthName = () => {
    const currentIndex = months.findIndex(month => month.label === selectedMonth);
    if (currentIndex > 0) {
      return months[currentIndex - 1].label;
    }
    return '';
  };

  // Check if navigation buttons should be disabled
  const isPreviousDisabled = () => {
    const currentIndex = months.findIndex(month => month.label === selectedMonth);
    return currentIndex >= months.length - 1;
  };

  const isNextDisabled = () => {
    const currentIndex = months.findIndex(month => month.label === selectedMonth);
    return currentIndex <= 0;
  };

  // Check if we're on current month (hide next button)
  const isCurrentMonth = () => {
    const currentIndex = months.findIndex(month => month.label === selectedMonth);
    return currentIndex === 0;
  };

  const handleMonthSelect = (month: any) => {
    setSelectedMonth(month.label);
    
    // Animate closing
    Animated.parallel([
      Animated.timing(dropdownAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false, // Keep false for height interpolation
        easing: Easing.in(Easing.cubic),
      }),
      Animated.timing(overviewAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: false,
        easing: Easing.in(Easing.cubic),
      }),
    ]).start(() => {
      setIsDropdownVisible(false);
    });
  };

  const handleDropdownToggle = () => {
    const isOpening = !isDropdownVisible;
    setIsDropdownVisible(isOpening);

    if (isOpening) {
      // Opening animation
      Animated.parallel([
        Animated.timing(dropdownAnimation, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false, // Keep false for height interpolation
          easing: Easing.out(Easing.cubic),
        }),
        Animated.timing(overviewAnimation, {
          toValue: 70,
          duration: 300,
          useNativeDriver: false,
          easing: Easing.out(Easing.cubic),
        }),
      ]).start();
    } else {
      // Closing animation
      Animated.parallel([
        Animated.timing(dropdownAnimation, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false, // Keep false for height interpolation
          easing: Easing.in(Easing.cubic),
        }),
        Animated.timing(overviewAnimation, {
          toValue: 0,
          duration: 250,
          useNativeDriver: false,
          easing: Easing.in(Easing.cubic),
        }),
      ]).start();
    }
  };

  // Auto-scroll to current month when dropdown becomes visible
  useEffect(() => {
    if (isDropdownVisible && scrollViewRef.current) {
      setTimeout(() => {
        // Scroll to the beginning to show the current month (which is the first item in the array)
        scrollViewRef.current?.scrollTo({ x: 0, animated: true });
      }, 200); // Increased timeout to ensure dropdown is fully rendered
    }
  }, [isDropdownVisible]);

  // Set up custom header with month selector
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      header: ({ navigation }: any) => (
        <View style={{ backgroundColor: '#FFFFFF' }}>
          <View style={[
            {
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 16,
              paddingTop: insets.top + 8,
              paddingBottom: 12,
              backgroundColor: '#FFFFFF',
            }
          ]}>
            {/* Left - Back Button */}
            <TouchableOpacity
              style={{ padding: 8, marginRight: 12 }}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Ionicons name="arrow-back" size={24} color="#007AFF" />
            </TouchableOpacity>

            {/* Left - Title and Month Selector beside back button */}
            <View style={{ flex: 1, alignItems: 'flex-start' }}>
              <Text style={{ 
                fontSize: 14, 
                fontWeight: '600', 
                color: '#000000',
                marginBottom: 4
              }} allowFontScaling={false}>
                All Transactions
              </Text>
              <TouchableOpacity 
                style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center'
                }}
                onPress={handleDropdownToggle}
              >
                <Text style={{ 
                  fontSize: 12, 
                  color: '#666666',
                  marginRight: 4,
                  fontWeight: 'bold'
                }} allowFontScaling={false}>
                  {selectedMonth}
                </Text>
                <Ionicons name="chevron-down" size={14} color="#666666" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ),
    });
  }, [navigation, selectedMonth, isDropdownVisible, insets.top]);


  // Calculate monthly summary for selected month
  const monthlySummary = React.useMemo(() => {
    if (!selectedMonth) return { income: 0, expense: 0, balance: 0, isCurrentMonth: false };
    
    const monthLabel = selectedMonth;
    const income = monthlyIncome[monthLabel] || 0;
    const expense = monthlyExpenses[monthLabel] || 0;
    const balance = income - expense;
    
    // Check if selected month is current month
    const currentDate = new Date();
    const currentMonthName = currentDate.toLocaleDateString('en-US', { month: 'long' });
    const currentYear = currentDate.getFullYear();
    const currentMonthLabel = `${currentMonthName}`;
    
    const isCurrentMonth = monthLabel === currentMonthLabel || monthLabel === `${currentMonthName} ${currentYear}`;
    
    return { income, expense, balance, isCurrentMonth };
  }, [selectedMonth, monthlyExpenses, monthlyIncome]);

  // Show offline screen when offline
  if (isOfflineMode) {
    return (
      <OfflineScreen 
        title="No transactions to show 📱"
        message="Your transaction history is stored safely in the cloud. Connect to the internet to view your financial data."
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Monthly Summary Section */}
      <Animated.View style={[
        styles.monthlySummaryContainer,
        { marginTop: overviewAnimation }
      ]}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle} allowFontScaling={false}>{selectedMonth} Overview</Text>
          </View>
          
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel} allowFontScaling={false}>Income</Text>
              <Text style={styles.incomeAmount} allowFontScaling={false}>₹{monthlySummary.income.toLocaleString()}</Text>
            </View>
            
            <View style={styles.statDivider} />
            
            <View style={styles.statItem}>
              <Text style={styles.statLabel} allowFontScaling={false}>Spent</Text>
              <Text style={styles.expenseAmount} allowFontScaling={false}>₹{monthlySummary.expense.toLocaleString()}</Text>
            </View>
            
            {monthlySummary.isCurrentMonth && (
              <>
                <View style={styles.statDivider} />
                
                <View style={styles.statItem}>
                  <Text style={styles.statLabel} allowFontScaling={false}>Balance</Text>
                  <Text style={[
                    styles.balanceAmount, 
                    { color: monthlySummary.balance >= 0 ? '#34C759' : '#FF3B30' }
                  ]}>
                    ₹{monthlySummary.balance.toLocaleString()}
                  </Text>
                </View>
              </>
            )}
          </View>
        </Animated.View>

        {/* Tab Navigator - Positioned below summary */}
        <Tab.Navigator
          screenOptions={{
            tabBarStyle: {
              backgroundColor: '#FFFFFF',
              elevation: 0,
              shadowOpacity: 0,
              borderBottomWidth: 1,
              borderBottomColor: '#E5E5E5',
              marginTop: 0, // Fixed positioning - no dynamic movement
              paddingTop: 0,
              paddingBottom: 0,
            },
            tabBarIndicatorStyle: {
              backgroundColor: '#007AFF',
              height: 2,
            },
            tabBarLabelStyle: {
              fontSize: 12,
              fontWeight: '600',
              textTransform: 'none',
            },
            tabBarActiveTintColor: '#007AFF',
            tabBarInactiveTintColor: '#666666',
          }}
        >
          <Tab.Screen 
            name="Transactions" 
            options={{ title: 'Transactions' }}
          >
            {() => (
              <TransactionsTab 
                selectedMonth={selectedMonth}
                onPreviousMonth={goToPreviousMonth}
                onNextMonth={goToNextMonth}
                isPreviousDisabled={isPreviousDisabled()}
                isNextDisabled={isNextDisabled()}
                previousMonthName={getPreviousMonthName()}
                nextMonthName={getNextMonthName()}
                isCurrentMonth={isCurrentMonth()}
              />
            )}
          </Tab.Screen>
          <Tab.Screen 
            name="Categories" 
            options={{ title: 'Categories' }}
          >
            {() => (
              <CategoriesTab 
                selectedMonth={selectedMonth}
                onPreviousMonth={goToPreviousMonth}
                onNextMonth={goToNextMonth}
                isPreviousDisabled={isPreviousDisabled()}
                isNextDisabled={isNextDisabled()}
                previousMonthName={getPreviousMonthName()}
                nextMonthName={getNextMonthName()}
                isCurrentMonth={isCurrentMonth()}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>

        {/* Horizontal Dropdown List - Overlay on top */}
        {isDropdownVisible && (
          <Animated.View style={[
            styles.dropdownContainer,
            {
              opacity: dropdownAnimation,
              maxHeight: dropdownAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 70],
              }),
              transform: [{
                translateY: dropdownAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-10, 0], // Slide down animation (reduced for smoother feel)
                })
              }],
            }
          ]}>
                         <ScrollView 
               ref={scrollViewRef}
               horizontal 
               showsHorizontalScrollIndicator={false}
               contentContainerStyle={styles.horizontalScrollContent}
             >
              {months.map((month) => (
                                 <TouchableOpacity
                   key={month.id}
                   style={[
                     styles.monthItem,
                     selectedMonth === month.label && styles.selectedMonthItem
                   ]}
                   onPress={() => handleMonthSelect(month)}
                 >
                   <Text style={[
                       styles.expenseText,
                       selectedMonth === month.label && styles.selectedMonthText,
                     ]} allowFontScaling={false}>
                     ₹{getMonthlyExpense(month.label).toLocaleString()}
                   </Text>
                   <Text style={[
                       styles.monthText,
                       selectedMonth === month.label && styles.selectedMonthText,
                     ]} allowFontScaling={false}>
                     {month.label}
                   </Text>
                 </TouchableOpacity>
              ))}
            </ScrollView>
          </Animated.View>
        )}
    </View>
  );
};

export default AllTransactionScreen;
