import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useScroll } from '../context/ScrollContext';
import { useNavigation, NavigationProp, CommonActions, useFocusEffect } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import TransactionService from '../services/transactionService';
import { BannerAdComponent } from '../components/AdMobComponents';
import { formatCurrency } from '../utils/currencyFormatter';

const { width } = Dimensions.get('window');

// Greeting function (same as HomeScreen)
const getGreeting = (userName?: string) => {
  const hour = new Date().getHours();
  let greeting;
  
  if (hour < 12) {
    greeting = 'Good Morning';
  } else if (hour < 17) {
    greeting = 'Good Afternoon';
  } else {
    greeting = 'Good Evening';
  }
  
  return userName ? `${greeting}, ${userName}!` : `${greeting}!`;
};

const SpentInMonthScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { scrollY } = useScroll();
  const navigation = useNavigation<NavigationProp<any>>();
  const insets = useSafeAreaInsets();

  // Financial data
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [spentAmount, setSpentAmount] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);
  const [safeToSpendPerDay, setSafeToSpendPerDay] = useState(0);
  const [remainingDays, setRemainingDays] = useState(0);
  const [loading, setLoading] = useState(true);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  
  // Expense trends data
  const [dailySpending, setDailySpending] = useState<any[]>([]);
  const [categorySpending, setCategorySpending] = useState<any[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<any[]>([]);
  const [averageDailySpending, setAverageDailySpending] = useState(0);

  // Month selection (current month + historical)
  const monthOptions = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 37 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - index, 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        shortLabel: date.toLocaleDateString('en-US', { month: 'short' }),
        fullLabel: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        yearLabel: date.toLocaleDateString('en-US', { year: 'numeric' }),
        date,
      };
    });
  }, []);
  // Dropdown state
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const dropdownAnimation = useRef(new Animated.Value(0)).current;
  const dropdownScrollRef = useRef<ScrollView>(null);

  // Monthly expense summary for dropdown labels
  const [monthlyExpenseSummary, setMonthlyExpenseSummary] = useState<{ [key: string]: number }>({});
  const [isExpenseSummaryLoading, setIsExpenseSummaryLoading] = useState(false);

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const selectedMonthOption = monthOptions[selectedMonthIndex] ?? monthOptions[0];

  const hideDropdown = useCallback(() => {
    if (!isDropdownVisible) {
      return;
    }
    Animated.timing(dropdownAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: false,
    }).start(() => {
      setIsDropdownVisible(false);
    });
  }, [isDropdownVisible, dropdownAnimation]);

  const showDropdown = useCallback(() => {
    if (isDropdownVisible) {
      return;
    }
    if (!isExpenseSummaryLoading && Object.keys(monthlyExpenseSummary).length === 0) {
      loadMonthlyExpenseSummary();
    }
    setIsDropdownVisible(true);
    Animated.timing(dropdownAnimation, {
      toValue: 1,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [
    isDropdownVisible,
    dropdownAnimation,
    monthlyExpenseSummary,
    isExpenseSummaryLoading,
    loadMonthlyExpenseSummary,
  ]);

  const handleDropdownToggle = useCallback(() => {
    if (isDropdownVisible) {
      hideDropdown();
    } else {
      showDropdown();
    }
  }, [isDropdownVisible, hideDropdown, showDropdown]);

  const handleSelectMonth = useCallback(
    (index: number) => {
      if (index === selectedMonthIndex) {
        hideDropdown();
        return;
      }
      setSelectedMonthIndex(index);
      hideDropdown();
    },
    [selectedMonthIndex, hideDropdown]
  );
  
  // Calculate progress based on income vs spent
  const progress = monthlyIncome > 0 ? (spentAmount / monthlyIncome) * 100 : 0;
  // Fixed density to prevent scaling with display size changes
  // Match the native density lock (2.5f) - don't use PixelRatio.get() as it can change
  const LOCKED_DENSITY = 2.5; // Match native density lock
  const baseRadius = 33; // Base radius in dp
  const baseStrokeWidth = 5.5; // Base stroke width in dp
  const radius = baseRadius * LOCKED_DENSITY; // 82.5px (fixed)
  const strokeWidth = baseStrokeWidth * LOCKED_DENSITY; // 13.75px (fixed)
  const svgSize = Math.round((baseRadius * 2 + baseStrokeWidth) * LOCKED_DENSITY); // 179px (rounded for precision)
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const loadMonthlyExpenseSummary = useCallback(async () => {
    try {
      setIsExpenseSummaryLoading(true);
      const allTransactions = await TransactionService.getTransactions();
      const summary: { [key: string]: number } = {};
      allTransactions.forEach(transaction => {
        if (!transaction?.date || transaction.type !== 'expense') {
          return;
        }
        const date = new Date(transaction.date);
        if (isNaN(date.getTime())) {
          return;
        }
        const label = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        summary[label] = (summary[label] || 0) + parseFloat(transaction.amount || 0);
      });
      setMonthlyExpenseSummary(summary);
    } catch (error) {
      console.error('Error loading monthly expense summary:', error);
    } finally {
      setIsExpenseSummaryLoading(false);
    }
  }, []);

  // Load transaction data for the selected month
  const loadTransactionData = useCallback(async (referenceDate: Date) => {
    try {
      setLoading(true);
      
      // Load recent transactions
      console.log('🔍 SpentInMonthScreen: Loading recent transactions...');
      const recentTransactionData = await TransactionService.getRecentTransactions(10);
      console.log('🔍 SpentInMonthScreen: Recent transactions loaded:', recentTransactionData.length);
      console.log('🔍 SpentInMonthScreen: Sample recent transaction:', recentTransactionData[0]);
      setRecentTransactions(recentTransactionData);
      
      // Determine target month/year
      const normalizedReference = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
      const targetMonth = normalizedReference.getMonth();
      const targetYear = normalizedReference.getFullYear();
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const isCurrentMonth = targetMonth === currentMonth && targetYear === currentYear;
      
      // Load transactions for target month
      const monthlyTransactions = await TransactionService.getTransactionsByMonth(targetYear, targetMonth);
      
      // Calculate monthly expenses
      console.log('🔍 SpentInMonthScreen: Monthly transactions:', monthlyTransactions.length);
      console.log('🔍 SpentInMonthScreen: Sample transaction amounts:', monthlyTransactions.slice(0, 3).map(t => ({ amount: t.amount, type: typeof t.amount })));
      
      const monthlyExpenses = monthlyTransactions
        .filter(transaction => transaction.type === 'expense')
        .reduce((total, transaction) => {
          const amount = parseFloat(transaction.amount || 0);
          console.log('🔍 SpentInMonthScreen: Adding expense:', { amount, total, newTotal: total + amount });
          return total + amount;
        }, 0);
      
      console.log('🔍 SpentInMonthScreen: Total monthly expenses:', monthlyExpenses);
      setSpentAmount(monthlyExpenses);
      const summaryLabel = normalizedReference.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      setMonthlyExpenseSummary(prev => ({
        ...prev,
        [summaryLabel]: monthlyExpenses,
      }));
      
      // Calculate monthly income
      const totalMonthlyIncome = monthlyTransactions
        .filter(transaction => transaction.type === 'income')
        .reduce((total, transaction) => {
          const amount = parseFloat(transaction.amount || 0);
          console.log('🔍 SpentInMonthScreen: Adding income:', { amount, total, newTotal: total + amount });
          return total + amount;
        }, 0);
      
      console.log('🔍 SpentInMonthScreen: Total monthly income:', totalMonthlyIncome);
      setMonthlyIncome(totalMonthlyIncome);
      
      // Calculate remaining balance
      const balance = totalMonthlyIncome - monthlyExpenses;
      setRemainingBalance(balance);
      
      // Calculate remaining days in the month
      const today = new Date();
      const lastDayOfSelectedMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
      const daysRemaining = isCurrentMonth
        ? lastDayOfSelectedMonth - today.getDate() + 1
        : 0;
      setRemainingDays(daysRemaining);
      
      // Calculate safe to spend per day
      const safeDaily = daysRemaining > 0 && balance > 0 ? balance / daysRemaining : 0;
      setSafeToSpendPerDay(safeDaily);
      
      console.log('🔍 SpentInMonthScreen: Financial summary:', {
        totalMonthlyIncome,
        monthlyExpenses,
        remainingBalance: balance,
        daysRemaining,
        safeToSpendPerDay: safeDaily
      });
      
      // Calculate expense trends
      const currentMonthTransactions = monthlyTransactions.filter(t => t.type === 'expense');
      
      // Daily spending trend (last 7 days)
      const endOfRange = isCurrentMonth
        ? new Date(currentYear, currentMonth, today.getDate())
        : new Date(targetYear, targetMonth + 1, 0);
      const totalDaysToShow = Math.min(7, endOfRange.getDate());
      const startDay = Math.max(1, endOfRange.getDate() - totalDaysToShow + 1);
      const last7Days = [];
      for (let day = startDay; day <= endOfRange.getDate(); day++) {
        const candidate = new Date(targetYear, targetMonth, day);
        const dateStr = candidate.toISOString().split('T')[0];
        last7Days.push({
          date: dateStr,
          dayName: candidate.toLocaleDateString('en-US', { weekday: 'short' }),
          amount: 0
        });
      }
      
      currentMonthTransactions.forEach(transaction => {
        const transactionDate = new Date(transaction.date).toISOString().split('T')[0];
        const dayIndex = last7Days.findIndex(day => day.date === transactionDate);
        if (dayIndex !== -1) {
          last7Days[dayIndex].amount += parseFloat(transaction.amount || 0);
        }
      });
      
      setDailySpending(last7Days);
      
      // Category spending breakdown
      const categoryMap = new Map();
      currentMonthTransactions.forEach(transaction => {
        const category = transaction.category || 'Others';
        const amount = parseFloat(transaction.amount || 0);
        categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
      });
      
      const categoryArray = Array.from(categoryMap.entries())
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: monthlyExpenses > 0 ? (amount / monthlyExpenses) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 5); // Top 5 categories
      
      setCategorySpending(categoryArray);
      
      // Weekly trend (4 weeks of current month)
      const weeklyTrendData = [];
      const weeksInMonth = Math.ceil(lastDayOfSelectedMonth / 7);
      for (let week = 0; week < weeksInMonth; week++) {
        const weekStart = week * 7 + 1;
        const weekEnd = Math.min(weekStart + 6, lastDayOfSelectedMonth);
        let weekAmount = 0;
        
        currentMonthTransactions.forEach(transaction => {
          const transactionDay = new Date(transaction.date).getDate();
          if (transactionDay >= weekStart && transactionDay <= weekEnd) {
            weekAmount += parseFloat(transaction.amount || 0);
          }
        });
        
        weeklyTrendData.push({
          week: week + 1,
          amount: weekAmount,
          label: `Week ${week + 1}`
        });
      }
      
      setWeeklyTrend(weeklyTrendData);
      
      // Average daily spending
      const elapsedDays = isCurrentMonth ? today.getDate() : lastDayOfSelectedMonth;
      const avgDaily = elapsedDays > 0 ? monthlyExpenses / elapsedDays : 0;
      setAverageDailySpending(avgDaily);
      
      console.log('🔍 SpentInMonthScreen: Expense trends calculated:', {
        dailySpending: last7Days,
        categorySpending: categoryArray,
        weeklyTrend: weeklyTrendData,
        averageDailySpending: avgDaily
      });
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading transaction data:', error);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedMonthOption) {
      return;
    }
    loadTransactionData(selectedMonthOption.date);
  }, [selectedMonthOption, loadTransactionData]);

  useEffect(() => {
    loadMonthlyExpenseSummary();
  }, [loadMonthlyExpenseSummary]);

  useEffect(() => {
    if (isDropdownVisible && dropdownScrollRef.current) {
      const timeout = setTimeout(() => {
        dropdownScrollRef.current?.scrollTo({
          x: Math.max(0, selectedMonthIndex * 100),
          animated: true,
        });
      }, 150);
      return () => clearTimeout(timeout);
    }
  }, [isDropdownVisible, selectedMonthIndex]);
  
  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (!selectedMonthOption) {
        return;
      }
      loadTransactionData(selectedMonthOption.date);
    }, [selectedMonthOption, loadTransactionData])
  );

  // Date formatting function (robust version from HomeScreen)
  const formatTransactionDate = (date: Date | string | undefined) => {
    try {
      // Handle undefined or invalid dates
      if (!date) {
        return 'Unknown date';
      }
      
      // Convert string to Date if needed
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      // Check if date is valid and has the required methods
      if (!dateObj || typeof dateObj.getTime !== 'function' || isNaN(dateObj.getTime())) {
        return 'Invalid date';
      }
      
      // Additional check to ensure date methods exist
      if (typeof dateObj.getFullYear !== 'function' || 
          typeof dateObj.getMonth !== 'function' || 
          typeof dateObj.getDate !== 'function') {
        return 'Invalid date';
      }
      
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const transactionDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());

      const timeString = dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      if (transactionDate.getTime() === today.getTime()) {
        return `Today, ${timeString}`;
      } else if (transactionDate.getTime() === yesterday.getTime()) {
        return `Yesterday, ${timeString}`;
      } else {
        return `${dateObj.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}, ${timeString}`;
      }
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid date';
    }
  };

  const styles = StyleSheet.create({
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
    headerCenterButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
    },
    headerSubtitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
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
      fontSize: 14,
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
    notificationButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropdownContainer: {
      backgroundColor: '#FFFFFF',
      overflow: 'hidden',
    },
    horizontalScrollContent: {
      paddingHorizontal: theme.spacing.md,
      paddingVertical: theme.spacing.sm,
    },
    monthItem: {
      paddingVertical: 12,
      paddingHorizontal: 18,
      marginRight: 10,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      backgroundColor: '#F8F8F8',
      minWidth: 110,
      alignItems: 'center',
      justifyContent: 'center',
    },
    selectedMonthItem: {
      backgroundColor: theme.colors.primary,
      borderColor: theme.colors.primary,
    },
    expenseText: {
      fontSize: 12,
      color: '#666666',
      fontWeight: '600',
      marginBottom: 4,
    },
    monthText: {
      fontSize: 12,
      color: '#333333',
      fontWeight: '600',
      textAlign: 'center',
    },
    yearText: {
      fontSize: 10,
      color: '#666666',
      marginTop: 2,
    },
    selectedMonthText: {
      color: '#FFFFFF',
    },
         content: {
       flex: 1,
     },
     scrollContent: {
       flexGrow: 1,
       paddingHorizontal: theme.spacing.md,
       paddingTop: 0, // No top padding to eliminate space
       paddingBottom: 100 + insets.bottom, // Increased padding for tab bar and better scrolling
     },

    monthTitle: {
      fontSize: theme.fontSize.md,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'center',
      marginTop: theme.spacing.md, // Add breathing room from header
      marginBottom: theme.spacing.lg,
    },
    progressContainer: {
      alignItems: 'center',
      marginBottom: theme.spacing.xl,
      overflow: 'visible', // Allow circle to extend beyond container if needed
      backgroundColor: 'transparent', // Ensure no white background
    },
    progressCircle: {
      width: 179, // Fixed width (matches svgSize calculation)
      height: 179, // Fixed height (matches svgSize calculation)
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center', // Ensure horizontal centering
      overflow: 'visible', // Allow stroke to extend beyond bounds
      backgroundColor: 'transparent', // Ensure no white background
    },
    progressText: {
      fontSize: theme.fontSize.lg,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    progressSubtext: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    progressDetails: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      width: '100%',
      marginTop: theme.spacing.lg,
    },
    detailItem: {
      alignItems: 'center',
    },
    detailLabel: {
      fontSize: 10,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    detailValue: {
      fontSize: theme.fontSize.md,
      fontWeight: 'bold',
      color: theme.colors.text,
    },
    adContainer: {
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: {
       backgroundColor: '#FFFFFF',
       borderRadius: 16,
       padding: theme.spacing.lg,
       marginTop: theme.spacing.lg,
       borderWidth: 1,
       borderColor: '#E5E5E5',
       shadowColor: '#000',
       shadowOffset: {
         width: 0,
         height: 4,
       },
       shadowOpacity: 0.15,
       shadowRadius: 8,
       elevation: 8,
     },
     cardContent: {
       alignItems: 'center',
     },
     cardTitle: {
       fontSize: theme.fontSize.md,
       fontWeight: 'bold',
       color: theme.colors.text,
       marginBottom: theme.spacing.xs,
     },
     cardSubtitle: {
       fontSize: theme.fontSize.sm,
       color: theme.colors.textSecondary,
       textAlign: 'center',
     },
     cardHeader: {
       flexDirection: 'row',
       justifyContent: 'space-between',
       alignItems: 'center',
       marginBottom: theme.spacing.md,
     },
     cardHeaderTitle: {
       fontSize: theme.fontSize.md,
       fontWeight: 'bold',
       color: theme.colors.text,
       textAlign: 'left',
     },
     addButton: {
       flexDirection: 'row',
       alignItems: 'center',
       paddingHorizontal: theme.spacing.md,
       paddingVertical: theme.spacing.sm,
       borderRadius: 20,
       backgroundColor: '#007AFF',
       shadowColor: '#007AFF',
       shadowOffset: {
         width: 0,
         height: 2,
       },
       shadowOpacity: 0.3,
       shadowRadius: 4,
       elevation: 4,
     },
     addButtonText: {
       fontSize: theme.fontSize.sm,
       fontWeight: 'bold',
       color: '#FFFFFF',
       marginLeft: 6,
     },
     transactionsList: {
       width: '100%',
     },
           transactionItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        paddingHorizontal: 0,
        marginBottom: 2,
      },
     transactionLeft: {
       flexDirection: 'row',
       alignItems: 'center',
       flex: 1,
     },
     transactionIcon: {
       width: 32,
       height: 32,
       borderRadius: 16,
       alignItems: 'center',
       justifyContent: 'center',
       marginRight: theme.spacing.sm,
     },
     transactionInfo: {
       flex: 1,
     },
     transactionTitle: {
       fontSize: theme.fontSize.sm,
       fontWeight: '600',
       color: theme.colors.text,
       marginBottom: 2,
     },
     transactionCategory: {
       fontSize: 10,
       color: theme.colors.textSecondary,
     },
     transactionAmount: {
       fontSize: theme.fontSize.sm,
       fontWeight: 'bold',
     },
     transactionRight: {
       alignItems: 'flex-end',
     },
     transactionDate: {
       fontSize: 10,
       color: theme.colors.textSecondary,
       marginTop: 2,
     },
           viewAllButton: {
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        marginTop: 0,
      },
           viewAllText: {
        fontSize: theme.fontSize.sm,
        fontWeight: '600',
        color: '#007AFF',
      },
      loadingContainer: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
      },
      loadingText: {
        fontSize: 14,
        color: '#999',
      },
      emptyContainer: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
      },
      emptyText: {
        fontSize: theme.fontSize.md,
        fontWeight: '600',
        color: theme.colors.text,
        marginTop: 16,
        textAlign: 'center',
      },
      emptySubtext: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        marginTop: 8,
        textAlign: 'center',
      },
      
      // Expense Trends Styles
      trendsContainer: {
        paddingBottom: theme.spacing.lg,
      },
      trendCard: {
        // Additional styles specific to trend cards can go here
        // Base card styling is inherited from styles.card
      },
      trendHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.md,
      },
      trendTitle: {
        fontSize: theme.fontSize.md,
        fontWeight: '600',
        color: theme.colors.text,
        marginLeft: theme.spacing.sm,
      },
      
      // Daily Trend Styles
      dailyTrendContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
        height: 100,
      },
      dailyTrendItem: {
        flex: 1,
        alignItems: 'center',
        marginHorizontal: 2,
      },
      dailyTrendBar: {
        width: 20,
        backgroundColor: '#007AFF',
        borderRadius: 10,
        marginBottom: theme.spacing.xs,
      },
      dailyTrendLabel: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
        fontWeight: '500',
        marginBottom: 2,
      },
      dailyTrendAmount: {
        fontSize: theme.fontSize.xs - 2,
        color: theme.colors.text,
        fontWeight: '600',
        textAlign: 'center',
      },
      
      // Category Trend Styles
      categoryTrendContainer: {
        gap: theme.spacing.sm,
      },
      categoryTrendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: theme.spacing.xs,
      },
      categoryTrendInfo: {
        flex: 1,
        marginRight: theme.spacing.sm,
      },
      categoryTrendName: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text,
        fontWeight: '500',
        marginBottom: 2,
      },
      categoryTrendAmount: {
        fontSize: theme.fontSize.xs,
        color: theme.colors.textSecondary,
        fontWeight: '400',
      },
      categoryTrendBarContainer: {
        flex: 2,
        height: 8,
        backgroundColor: '#F0F0F0',
        borderRadius: 4,
        marginRight: theme.spacing.sm,
      },
      categoryTrendBar: {
        height: '100%',
        backgroundColor: '#34C759',
        borderRadius: 4,
      },
      categoryTrendPercentage: {
        fontSize: theme.fontSize.xs - 2,
        color: theme.colors.textSecondary,
        fontWeight: '600',
        minWidth: 30,
        textAlign: 'right',
      },
      
      // Weekly Trend Styles
      weeklyTrendContainer: {
        gap: theme.spacing.sm,
      },
      weeklyTrendItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.spacing.xs,
      },
      weeklyTrendLabel: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text,
        fontWeight: '500',
      },
      weeklyTrendAmount: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.text,
        fontWeight: '600',
      },
      
      // Average Styles
      averageContainer: {
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
      },
      averageAmount: {
        fontSize: theme.fontSize.xl,
        color: theme.colors.text,
        fontWeight: '700',
        marginBottom: 4,
      },
      averageLabel: {
        fontSize: theme.fontSize.sm,
        color: theme.colors.textSecondary,
        fontWeight: '400',
      },
  });

  // Header Component
  const ScreenHeader: React.FC<{
    user?: any;
    theme: any;
    insets: any;
    selectedLabel: string;
    isOpen: boolean;
    onToggle: () => void;
  }> = ({ user, theme, insets, selectedLabel, isOpen, onToggle }) => {
    // Different padding for Android vs iOS
    const headerPaddingTop = Platform.OS === 'android' ? insets.top + 5 : insets.top + 10;
    const monthYear = selectedLabel || new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
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
          
          <TouchableOpacity
            style={styles.headerCenterButton}
            activeOpacity={0.7}
            onPress={onToggle}
          >
            <Text style={[styles.headerTitle, { color: theme.colors.text }]} allowFontScaling={false}>
              {monthYear}
            </Text>
            <View style={styles.headerSubtitleRow}>
              <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
                Monthly spending overview
              </Text>
              <Ionicons
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color={theme.colors.textSecondary}
                style={{ marginLeft: 6 }}
              />
            </View>
          </TouchableOpacity>
          
          <View style={styles.headerRight}>
            {/* Empty space to balance the header */}
          </View>
        </View>
      </View>
    );
  };

     return (
     <View style={styles.container}>
       {/* Header with Safe Area */}
      <ScreenHeader
        user={user}
        theme={theme}
        insets={insets}
        selectedLabel={selectedMonthOption?.fullLabel ?? ''}
        isOpen={isDropdownVisible}
        onToggle={handleDropdownToggle}
      />

      {isDropdownVisible && (
        <Animated.View
          style={[
            styles.dropdownContainer,
            {
              opacity: dropdownAnimation,
              maxHeight: dropdownAnimation.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 80],
              }),
              transform: [
                {
                  translateY: dropdownAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <ScrollView
            ref={dropdownScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {monthOptions.map((month, index) => {
              const isSelected = index === selectedMonthIndex;
              const isCurrentYear =
                month.date.getFullYear() === new Date().getFullYear();
              const expenseLabel =
                monthlyExpenseSummary[
                  month.date.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })
                ] ?? 0;
              const monthLabelText = isCurrentYear
                ? month.date.toLocaleDateString('en-US', {
                    month: 'short',
                  })
                : `${month.date
                    .toLocaleDateString('en-US', { month: 'short' })
                    .replace('.', '')}'${month.date
                    .getFullYear()
                    .toString()
                    .slice(-2)}`;

              return (
                <TouchableOpacity
                  key={month.key}
                  style={[
                    styles.monthItem,
                    isSelected && styles.selectedMonthItem,
                  ]}
                  onPress={() => handleSelectMonth(index)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.expenseText,
                      isSelected && styles.selectedMonthText,
                    ]}
                    allowFontScaling={false}
                  >
                    {formatCurrency(expenseLabel)}
                  </Text>
                  <Text
                    style={[
                      styles.monthText,
                      isSelected && styles.selectedMonthText,
                    ]}
                    allowFontScaling={false}
                  >
                    {monthLabelText}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>
      )}
       
       <ScrollView
         style={styles.content}
         contentContainerStyle={[styles.scrollContent, { paddingTop: 0 }]}
         showsVerticalScrollIndicator={true}
         bounces={true}
         onScroll={Animated.event(
           [{ nativeEvent: { contentOffset: { y: scrollY } } }],
           { useNativeDriver: false }
         )}
         scrollEventThrottle={16}
       >
        <Text style={styles.monthTitle} allowFontScaling={false}>
          <Text style={{ fontWeight: 'normal' }} allowFontScaling={false}>Spent in </Text>
          <Text style={{ color: '#007AFF', fontWeight: 'bold' }} allowFontScaling={false}>
            {selectedMonthOption?.fullLabel ?? ''}
          </Text>
        </Text>

        {/* Circular Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressCircle}>
            <Svg 
              width={svgSize} 
              height={svgSize}
              viewBox={`0 0 ${svgSize} ${svgSize}`}
              preserveAspectRatio="xMidYMid meet"
              style={{ 
                backgroundColor: 'transparent',
                alignSelf: 'center', // Ensure SVG is centered
              }}
            >
              {/* Background circle (blue for remaining) */}
              <Circle
                cx={svgSize / 2}
                cy={svgSize / 2}
                r={radius}
                stroke="#007AFF"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Progress circle (red for spent) */}
              <Circle
                cx={svgSize / 2}
                cy={svgSize / 2}
                r={radius}
                stroke="#FF3B30"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${svgSize / 2} ${svgSize / 2})`}
              />
            </Svg>
                         <View style={{ 
               position: 'absolute', 
               alignItems: 'center',
               justifyContent: 'center',
               width: '100%',
               height: '100%',
               backgroundColor: 'transparent', // Ensure no white background
             }}>
               <View style={{ alignItems: 'center' }}>
                 <Ionicons 
                   name="arrow-up" 
                   size={20} 
                   color="#000000" 
                   style={{ 
                     marginBottom: 4, 
                     transform: [{ rotate: '45deg' }],
                     fontWeight: 'bold'
                   }} 
                 />
                 <Text style={styles.progressText} allowFontScaling={false}>
                   {loading ? '--' : formatCurrency(spentAmount)}
                 </Text>
                 <Text style={styles.progressSubtext} allowFontScaling={false}>Spent</Text>
               </View>
             </View>
          </View>
          
          <View style={styles.progressDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel} allowFontScaling={false}>Income</Text>
              <Text style={[styles.detailValue, { color: '#34C759' }]} allowFontScaling={false}>
                {loading ? '--' : formatCurrency(monthlyIncome)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel} allowFontScaling={false}>Remaining</Text>
              <Text style={[styles.detailValue, { color: '#007AFF' }]} allowFontScaling={false}>
                {loading ? '--' : formatCurrency(remainingBalance)}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel} allowFontScaling={false}>Safe to Spend</Text>
              <Text style={[styles.detailValue, { color: '#FF9500' }]} allowFontScaling={false}>
                {loading ? '--' : `${formatCurrency(Math.floor(safeToSpendPerDay))}/day`}
              </Text>
            </View>
          </View>
         </View>
         
         {/* Banner Ad - Above Recent Transactions */}
         {!loading && (
           <View style={styles.adContainer}>
             <BannerAdComponent />
           </View>
         )}
         
         {/* Recent Transactions Card - Always show when not loading */}
         {!loading && (
           <View style={styles.card}>
             <View style={styles.cardHeader}>
               <Text style={styles.cardHeaderTitle} allowFontScaling={false}>Recent Transactions</Text>
               <TouchableOpacity 
                 style={styles.addButton}
                 onPress={() => {
                   // Navigating to AddTransaction
                   navigation.dispatch(
                     CommonActions.navigate({
                       name: 'AddTransaction',
                       params: { fromScreen: 'SpentInMonth' }
                     })
                   );
                 }}
               >
                 <Ionicons name="add" size={20} color="#FFFFFF" />
                 <Text style={styles.addButtonText} allowFontScaling={false}>add</Text>
               </TouchableOpacity>
             </View>
             <View style={styles.transactionsList}>
               {recentTransactions.length === 0 ? (
                 <View style={styles.emptyContainer}>
                   <Ionicons name="receipt-outline" size={48} color="#999" />
                   <Text style={styles.emptyText} allowFontScaling={false}>No recent transactions</Text>
                   <Text style={styles.emptySubtext} allowFontScaling={false}>Your recent transactions will appear here</Text>
                 </View>
               ) : (
                 <>
                                     {recentTransactions.slice(0, 6).map((transaction, index) => {
                      // Debug logging for transaction rendering
                      if (index === 0) {
                        console.log('🔍 SpentInMonthScreen: Rendering transaction:', {
                          id: transaction.id,
                          description: transaction.description,
                          title: transaction.title,
                          category: transaction.category,
                          categorycolor: transaction.categorycolor,
                          color: transaction.color,
                          categoryicon: transaction.categoryicon,
                          icon: transaction.icon,
                          amount: transaction.amount,
                          type: transaction.type,
                          date: transaction.date
                        });
                      }
                      
                      return (
                        <TouchableOpacity 
                          key={transaction.id} 
                          style={[styles.transactionItem, index < Math.min(recentTransactions.length, 6) - 1 ? { borderBottomWidth: 1, borderBottomColor: '#F0F0F0' } : {}]}
                          onPress={() => (navigation as any).navigate('TransactionDetail', { transactionId: transaction.id })}
                        >
                          <View style={styles.transactionLeft}>
                            <View style={[styles.transactionIcon, { backgroundColor: transaction.categorycolor || transaction.color || '#007AFF' }]}>
                              <Ionicons name={transaction.categoryicon || transaction.icon || 'receipt'} size={16} color="#FFFFFF" />
                            </View>
                            <View style={styles.transactionInfo}>
                              <Text style={styles.transactionTitle} allowFontScaling={false}>{transaction.description || transaction.title}</Text>
                              <Text style={styles.transactionCategory} allowFontScaling={false}>{transaction.category}</Text>
                            </View>
                          </View>
                          <View style={styles.transactionRight}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons 
                                name="arrow-up" 
                                size={12} 
                                color={transaction.type === 'expense' ? '#FF3B30' : '#34C759'} 
                                style={{ 
                                  marginRight: 4,
                                  transform: [{ rotate: transaction.type === 'expense' ? '45deg' : '-135deg' }]
                                }} 
                              />
                              <Text style={[styles.transactionAmount, { color: transaction.type === 'expense' ? '#FF3B30' : '#34C759' }]} allowFontScaling={false}>
                                ₹{parseFloat(transaction.amount || 0).toFixed(2)}
                              </Text>
                            </View>
                            <Text style={styles.transactionDate} allowFontScaling={false}>{formatTransactionDate(transaction.date)}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                   
                   {/* View All Button - Only show if we have more than 6 transactions */}
                   {recentTransactions.length > 6 && (
                     <TouchableOpacity 
                       style={styles.viewAllButton}
                       onPress={() => {
                         navigation.dispatch(
                           CommonActions.navigate({
                             name: 'AllTransaction',
                           })
                         );
                       }}
                     >
                       <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                         <Text style={styles.viewAllText} allowFontScaling={false}>View All</Text>
                         <Ionicons name="chevron-forward" size={16} color="#007AFF" style={{ marginLeft: 4 }} />
                       </View>
                     </TouchableOpacity>
                   )}
                 </>
               )}
             </View>
           </View>
         )}

         {/* Expense Trends Section */}
         {!loading && (
           <View style={styles.trendsContainer}>
             {/* Average Daily Spending */}
             <View style={[styles.card, styles.trendCard]}>
               <View style={styles.trendHeader}>
                 <Ionicons name="analytics" size={20} color="#9C27B0" />
                 <Text style={styles.trendTitle} allowFontScaling={false}>Daily Average</Text>
               </View>
               <View style={styles.averageContainer}>
                 <Text style={styles.averageAmount} allowFontScaling={false}>
                   {formatCurrency(averageDailySpending)}
                 </Text>
                 <Text style={styles.averageLabel} allowFontScaling={false}>
                   per day this month
                 </Text>
               </View>
             </View>

             {/* Daily Spending Trend */}
             <View style={[styles.card, styles.trendCard]}>
               <View style={styles.trendHeader}>
                 <Ionicons name="trending-up" size={20} color="#007AFF" />
                 <Text style={styles.trendTitle} allowFontScaling={false}>Last 7 Days</Text>
               </View>
               <View style={styles.dailyTrendContainer}>
                 {dailySpending.map((day, index) => {
                   const maxAmount = Math.max(...dailySpending.map(d => d.amount));
                   const height = maxAmount > 0 ? (day.amount / maxAmount) * 60 : 0;
                   return (
                     <View key={index} style={styles.dailyTrendItem}>
                       <View style={[styles.dailyTrendBar, { height: Math.max(height, 2) }]} />
                       <Text style={styles.dailyTrendLabel} allowFontScaling={false}>{day.dayName}</Text>
                       <Text style={styles.dailyTrendAmount} allowFontScaling={false}>
                         {formatCurrency(day.amount)}
                       </Text>
                     </View>
                   );
                 })}
               </View>
             </View>

             {/* Top Spending Categories */}
             {categorySpending.length > 0 && (
               <View style={[styles.card, styles.trendCard]}>
                 <View style={styles.trendHeader}>
                   <Ionicons name="pie-chart" size={20} color="#34C759" />
                   <Text style={styles.trendTitle} allowFontScaling={false}>Top Categories</Text>
                 </View>
                 <View style={styles.categoryTrendContainer}>
                   {categorySpending.map((category, index) => (
                     <View key={index} style={styles.categoryTrendItem}>
                       <View style={styles.categoryTrendInfo}>
                         <Text style={styles.categoryTrendName} allowFontScaling={false}>
                           {category.category}
                         </Text>
                         <Text style={styles.categoryTrendAmount} allowFontScaling={false}>
                           {formatCurrency(category.amount)}
                         </Text>
                       </View>
                       <View style={styles.categoryTrendBarContainer}>
                         <View 
                           style={[
                             styles.categoryTrendBar, 
                             { width: `${category.percentage}%` }
                           ]} 
                         />
                       </View>
                       <Text style={styles.categoryTrendPercentage} allowFontScaling={false}>
                         {category.percentage.toFixed(0)}%
                       </Text>
                     </View>
                   ))}
                 </View>
               </View>
             )}

             {/* Weekly Trend */}
             {weeklyTrend.length > 0 && (
               <View style={[styles.card, styles.trendCard]}>
                 <View style={styles.trendHeader}>
                   <Ionicons name="calendar" size={20} color="#FF9500" />
                   <Text style={styles.trendTitle} allowFontScaling={false}>Weekly Breakdown</Text>
                 </View>
                 <View style={styles.weeklyTrendContainer}>
                   {weeklyTrend.map((week, index) => (
                     <View key={index} style={styles.weeklyTrendItem}>
                       <Text style={styles.weeklyTrendLabel} allowFontScaling={false}>
                         {week.label}
                       </Text>
                       <Text style={styles.weeklyTrendAmount} allowFontScaling={false}>
                         {formatCurrency(week.amount)}
                       </Text>
                     </View>
                   ))}
                 </View>
               </View>
             )}

          </View>
         )}
         
         {/* Banner Ad at the bottom of the screen */}
         {!loading && (
           <View style={styles.adContainer}>
             <BannerAdComponent />
           </View>
         )}
         
         {/* Extra spacing to ensure last item is visible */}
         <View style={{ height: 50 }} />
        
      </ScrollView>
    </View>
  );
};


export default SpentInMonthScreen;


