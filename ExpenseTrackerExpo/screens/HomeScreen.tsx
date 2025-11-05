import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Platform,
  FlatList,
  Animated,
  Image,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useScroll } from '../context/ScrollContext';
import { useNotifications } from '../context/NotificationContext';
import { useNetwork } from '../context/NetworkContext';
import { useDrawer } from '../context/DrawerContext';

import TransactionService from '../services/transactionService';
import AccountService from '../services/AccountService';
import { LoanService } from '../services/LoanService';
import DailyReminderService from '../services/DailyReminderService';
import NotificationNavigationService from '../services/NotificationNavigationService';
import OfflineBanner from '../components/OfflineBanner';
import OfflineScreen from '../components/OfflineScreen';
import { formatCurrency } from '../utils/currencyFormatter';
import { BannerAdComponent } from '../components/AdMobComponents';
import AdMobService from '../services/AdMobService';
// Removed mock InterstitialAdModal
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api.config';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import AppOpenAdService from '../services/AppOpenAdService';

const { width } = Dimensions.get('window');

// Helper function to get greeting
const getGreeting = (userName?: string) => {
  return userName ? `Hi ${userName} 😉` : 'Hi User 😉';
};

// Helper function to get time-based subtitle message
const getTimeBasedSubtitle = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 12) {
    // Morning (5 AM - 12 PM)
    return "Start your day with smart financial planning ☀️";
  } else if (hour >= 12 && hour < 17) {
    // Afternoon (12 PM - 5 PM)
    return "Keep tracking your expenses 📊";
  } else if (hour >= 17 && hour < 21) {
    // Evening (5 PM - 9 PM)
    return "Review your spending today 🌙";
  } else {
    // Night (9 PM - 5 AM)
    return "Plan for tomorrow 💤";
  }
};

// Helper function to get category icon
const getCategoryIcon = (category: string) => {
  const iconMap: { [key: string]: string } = {
    'Food & Dining': '🍕',
    'Food': '🍕',
    'Transport': '🚗',
    'Transportation': '🚗',
    'Bills & Utilities': '💡',
    'Bills': '💡',
    'Utilities': '💡',
    'Shopping': '🛍️',
    'Entertainment': '🎬',
    'Healthcare': '🏥',
    'Education': '📚',
    'Travel': '✈️',
    'Groceries': '🛒',
    'Fuel': '⛽',
    'Rent': '🏠',
    'Insurance': '🛡️',
    'Others': '📦',
    'Miscellaneous': '📦',
  };
  
  // Try exact match first
  if (iconMap[category]) {
    return iconMap[category];
  }
  
  // Try partial match
  const lowerCategory = category.toLowerCase();
  for (const [key, icon] of Object.entries(iconMap)) {
    if (lowerCategory.includes(key.toLowerCase()) || key.toLowerCase().includes(lowerCategory)) {
      return icon;
    }
  }
  
  // Default icon
  return '📦';
};


const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { scrollY } = useScroll();
  const { isOfflineMode } = useNetwork();
  const { openDrawer } = useDrawer();
  
  // Get refresh parameter from route
  const refresh = (route.params as any)?.refresh;
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Recent transactions will be fetched from API
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Financial data will be fetched from API
  const [currentBalance, setCurrentBalance] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalExpense, setTotalExpense] = useState(0);
  
  // Enhanced Money Manager data
  const [allTimeIncome, setAllTimeIncome] = useState(0);
  const [allTimeExpense, setAllTimeExpense] = useState(0);
  const [previousMonthSavings, setPreviousMonthSavings] = useState(0);
  const [enhancedIncome, setEnhancedIncome] = useState(0);
  
  // Spending Categories data
  const [spendingCategories, setSpendingCategories] = useState<any[]>([]);
  const [totalMonthlySpending, setTotalMonthlySpending] = useState(0);
  
  // Active Loans data
  const [activeLoans, setActiveLoans] = useState<any[]>([]);
  const [totalOutstandingBalance, setTotalOutstandingBalance] = useState(0);
  const [totalMonthlyPayment, setTotalMonthlyPayment] = useState(0);
  const [nextPaymentDate, setNextPaymentDate] = useState<string | null>(null);
  
  
  // Credit card expenses hidden for v1 release
  // const [totalCreditCardExpenses, setTotalCreditCardExpenses] = useState(0);

  // Carousel banner state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerFlatListRef = useRef<FlatList>(null);
  const [banners, setBanners] = useState<any[]>([]);
  
  // Smart Insights auto-slide state
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);
  
  // Viewability tracking for second banner ad (lazy loading)
  const [showSecondBannerAd, setShowSecondBannerAd] = useState(false);
  const secondBannerAdRef = useRef<View>(null);
  const insightsScrollViewRef = useRef<ScrollView>(null);
  
  // Cache and debouncing state
  const [lastDataLoad, setLastDataLoad] = useState<number>(0);
  const [isDataStale, setIsDataStale] = useState(true);
  const [appInitialized, setAppInitialized] = useState(false);
  const loadDataTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const CACHE_DURATION = 120000; // 2 minutes cache (increased to reduce API calls)
  const DEBOUNCE_DELAY = 3000; // 3 seconds debounce (increased to reduce rapid calls)
  
  // Global request deduplication
  const [isLoadingData, setIsLoadingData] = useState(false);
  
  // Money Manager ad state
  const [moneyManagerClicks, setMoneyManagerClicks] = useState(5); // Start at 5, counts down
  
  const loadAds = async () => {
    try {
      // Load banners from the public API endpoint
      const response = await fetch(`${API_BASE_URL}/banners/public`);
      if (response.ok) {
        const bannerResponse = await response.json();
        if (bannerResponse.success && bannerResponse.data) {
          // Transform banner data to include full image URLs
          const transformedBanners = bannerResponse.data.map((banner: any) => {
            let imageUrl = null;
            
            if (banner.image_url) {
              // Check if it's already a full URL (Cloudinary or external)
              if (banner.image_url.startsWith('http://') || banner.image_url.startsWith('https://')) {
                imageUrl = banner.image_url;
              } else {
                // For relative paths (local storage fallback)
                imageUrl = `${API_BASE_URL.replace('/api', '')}${banner.image_url}`;
              }
            }
            
            return {
              ...banner,
              imageUrl
            };
          });
          setBanners(transformedBanners);
          setCurrentBannerIndex(0);
        } else {
          throw new Error('Invalid banner response format');
        }
        } else {
          setBanners([]);
        }
    } catch (e) {
      console.error('❌ HomeScreen: Error loading banners:', e);
      setBanners([]);
    }
  };

  // Function to format date based on when it occurred
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
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const transactionDate = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate());
      
      const timeString = dateObj.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });

      if (transactionDate.getTime() === today.getTime()) {
        return `Today, ${timeString}`;
      } else if (transactionDate.getTime() === yesterday.getTime()) {
        return `Yesterday, ${timeString}`;
      } else {
        return dateObj.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        }) + `, ${timeString}`;
      }
    } catch (error) {
      console.error('Error formatting date:', error, 'Date value:', date);
      return 'Invalid date';
    }
  };

  const { theme } = useTheme();
  const { user } = useAuth();
  const { registerForPushNotifications } = useNotifications();

  // Handle immediate refresh when coming from AddTransaction
  useEffect(() => {
    if (refresh) {
      setIsDataStale(true);
      setAppInitialized(true);
      loadStats(true); // Force refresh stats
      loadTransactionData(true); // Force refresh transactions
      // Clear the refresh flag to prevent infinite loops
      (navigation as any).setParams({ refresh: false });
    }
  }, [refresh, navigation]);

  // Load transaction data with caching and debouncing
  const loadTransactionData = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // Check if data is fresh and not forcing refresh
    if (!forceRefresh && !isDataStale && (now - lastDataLoad) < CACHE_DURATION) {
      return;
    }
    
    // Prevent multiple concurrent calls
    if (isLoadingData || (loading && !forceRefresh)) {
      return;
    }
    
    // Set global loading flag
    setIsLoadingData(true);
    
    // Set a safety timeout to clear loading after 10 seconds
    const loadingTimeout = setTimeout(() => {
      console.log('⚠️ Loading timeout - clearing loading state');
      setLoading(false);
      setIsLoading(false);
      setIsLoadingData(false);
    }, 10000);
    
    try {
      // Only set loading if not already loading
      if (!loading) {
        setLoading(true);
      }
      
      // Load recent transactions
      const recentTransactionData = await TransactionService.getRecentTransactions(10);
      
      setRecentTransactions(recentTransactionData);
      
      // Load financial summary with force refresh if needed
      const transactions = await TransactionService.getTransactions(forceRefresh);
      
      // Filter transactions for CURRENT MONTH (Money Manager shows current month data)
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      
      const currentMonthTransactions = (transactions || []).filter(t => {
        const txnDate = new Date(t.date);
        return txnDate.getFullYear() === currentYear && txnDate.getMonth() === currentMonth;
      });
      
      // Separate current month transactions by type
      const incomeTransactions = currentMonthTransactions.filter(t => t.type === 'income');
      const expenseTransactions = currentMonthTransactions.filter(t => t.type === 'expense');
      const transferTransactions = currentMonthTransactions.filter(t => t.type === 'transfer');
      
      const totalIncome = incomeTransactions
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      // For v1 release, all expenses are treated as cash expenses
      // Credit card functionality is hidden
      const totalCashExpenses = expenseTransactions
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      // Credit card expenses hidden for v1 release
      // const isCreditCardTransaction = (transaction: any) => {
      //   const accountType = transaction.accountType;
      //   const isCreditCardBillPayment = transaction.description && 
      //     (transaction.description.toLowerCase().includes('credit card') || 
      //      transaction.description.toLowerCase().includes('bill payment') ||
      //      transaction.description.toLowerCase().includes('card payment'));
      //   if (isCreditCardBillPayment) {
      //     return false;
      //   }
      //   return accountType === 'credit_card';
      // };
      // const cashExpenses = expenseTransactions.filter(t => !isCreditCardTransaction(t));
      // const creditCardExpenses = expenseTransactions.filter(t => isCreditCardTransaction(t));
      // const totalCreditCardExpenses = creditCardExpenses
      //   .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      // For v1 release, transfers are not handled (credit cards hidden)
      // All expenses are cash expenses
      const currentBalance = totalIncome - totalCashExpenses;
      
      // Calculate ALL-TIME totals for enhanced Money Manager
      const allTimeIncomeTransactions = (transactions || []).filter(t => t.type === 'income');
      const allTimeExpenseTransactions = (transactions || []).filter(t => t.type === 'expense');
      
      const allTimeIncomeTotal = allTimeIncomeTransactions
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      const allTimeExpenseTotal = allTimeExpenseTransactions
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      // Calculate previous months savings (all-time - selected month)
      const previousMonthSavingsAmount = (allTimeIncomeTotal - allTimeExpenseTotal) - (totalIncome - totalCashExpenses);
      
      // Enhanced calculations
      const enhancedIncomeAmount = totalIncome + previousMonthSavingsAmount;
      const enhancedBalanceAmount = enhancedIncomeAmount - totalCashExpenses;
      
      
      setCurrentBalance(enhancedBalanceAmount);
      setTotalIncome(enhancedIncomeAmount);
      setTotalExpense(totalCashExpenses);
      
      // Set enhanced Money Manager data
      setAllTimeIncome(allTimeIncomeTotal);
      setAllTimeExpense(allTimeExpenseTotal);
      setPreviousMonthSavings(previousMonthSavingsAmount);
      setEnhancedIncome(enhancedIncomeAmount);
      
      // Calculate spending categories for current month (top 3)
      const categorySpending = new Map();
      let totalSpending = 0;
      
      expenseTransactions.forEach(transaction => {
        const category = transaction.category || 'Others';
        const amount = parseFloat(transaction.amount || 0);
        
        if (categorySpending.has(category)) {
          categorySpending.set(category, categorySpending.get(category) + amount);
        } else {
          categorySpending.set(category, amount);
        }
        totalSpending += amount;
      });
      
      // Convert to array and sort by amount (descending), take top 3
      const categoriesArray = Array.from(categorySpending.entries())
        .map(([category, amount]) => ({
          category,
          amount,
          percentage: totalSpending > 0 ? (amount / totalSpending) * 100 : 0
        }))
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3); // Show only top 3 categories
      
      setSpendingCategories(categoriesArray);
      setTotalMonthlySpending(totalSpending);
      
      // Load active loans data
      try {
        const loans = await LoanService.getLoans();
        const activeLoansList = loans.filter(loan => loan.status === 'active');
        
        // Calculate loan summary
        const totalBalance = activeLoansList.reduce((sum, loan) => sum + (loan.remainingBalance || 0), 0);
        const totalPayment = activeLoansList.reduce((sum, loan) => sum + (loan.monthlyPayment || 0), 0);
        
        // Find next payment date (simplified - just show current month)
        const currentDate = new Date();
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
        const nextPaymentDateStr = nextMonth.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          year: 'numeric'
        });
        
        setActiveLoans(activeLoansList);
        setTotalOutstandingBalance(totalBalance);
        setTotalMonthlyPayment(totalPayment);
        setNextPaymentDate(nextPaymentDateStr);
      } catch (error) {
        console.error('❌ HomeScreen: Error loading loans:', error);
        setActiveLoans([]);
        setTotalOutstandingBalance(0);
        setTotalMonthlyPayment(0);
        setNextPaymentDate(null);
      }
      
      // Credit card expenses hidden for v1 release
      // setTotalCreditCardExpenses(totalCreditCardExpenses);
      
      // Update cache timestamp
      setLastDataLoad(now);
      setIsDataStale(false);
      setLoading(false);
      setIsLoading(false);
      
      // Clear the timeout since we loaded successfully
      clearTimeout(loadingTimeout);
    } catch (error) {
      console.error('❌ HomeScreen: Error loading transaction data:', error);
      setLoading(false);
      setIsLoading(false);
      
      // Clear the timeout in error case too
      clearTimeout(loadingTimeout);
    } finally {
      // Always clear the global loading flag
      setIsLoadingData(false);
    }
  }, []); // Remove dependencies to prevent re-creation

  const loadStats = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // Check if stats are fresh and not forcing refresh
    if (!forceRefresh && stats && (now - lastDataLoad) < CACHE_DURATION) {
      return;
    }
    
    // Prevent multiple concurrent calls
    if (isLoadingData) {
      return;
    }
    
    // Set a safety timeout to clear loading after 10 seconds
    const loadingTimeout = setTimeout(() => {
      console.log('⚠️ Stats loading timeout - clearing loading state');
      setIsLoading(false);
    }, 10000);
    
    try {
      // Only set loading if not already loading
      if (!isLoading) {
        setIsLoading(true);
      }
      // Load accounts data
      const accounts = await AccountService.getAccounts();
      
      // Load transactions data
      const transactions = await TransactionService.getTransactions();
      
      // Calculate real stats from cloud data
      const totalIncome = (transactions || [])
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        
      const expenseTransactions = (transactions || []).filter(t => t.type === 'expense');
      
      // Use the same credit card identification logic as in loadTransactionData
      const isCreditCardTransaction = (transaction: any) => {
        // Use the reliable accountType from backend instead of unreliable heuristics
        const accountType = transaction.accountType;
        
        // Check if this is a credit card bill payment transfer
        // These should be treated as cash expenses, not credit card expenses
        const isCreditCardBillPayment = transaction.description && 
          (transaction.description.toLowerCase().includes('credit card') || 
           transaction.description.toLowerCase().includes('bill payment') ||
           transaction.description.toLowerCase().includes('card payment'));
        
        if (isCreditCardBillPayment) {
          return false; // Treat as cash expense
        }
        
        // Use reliable account type information from backend
        return accountType === 'credit_card';
      };
      
      const cashExpenses = expenseTransactions.filter(t => !isCreditCardTransaction(t));
      const totalExpenses = cashExpenses
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
      
      // Calculate monthly average (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const monthlyTransactions = (transactions || []).filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= thirtyDaysAgo;
      });
      
      const monthlyExpenses = monthlyTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        
      const monthlyAverage = monthlyExpenses / 30; // Daily average
      
      // Get top categories
      const categoryTotals: { [key: string]: number } = {};
      (transactions || [])
        .filter(t => t.type === 'expense')
        .forEach(t => {
          const category = t.category || 'Other';
          categoryTotals[category] = (categoryTotals[category] || 0) + parseFloat(t.amount || 0);
        });
      
      const topCategories = Object.entries(categoryTotals)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([category, amount]) => ({ category, amount }));
      
      const realStats = {
        totalExpenses,
        totalIncome,
        monthlyAverage: Math.round(monthlyAverage * 100) / 100, // Round to 2 decimal places
        topCategories
      };
      
      setStats(realStats);
      setIsLoading(false);
      
      // Clear the timeout since we loaded successfully
      clearTimeout(loadingTimeout);
    } catch (error) {
      console.error('❌ HomeScreen: Error loading stats:', error);
      // Set default stats on error
      setStats({
        totalExpenses: 0,
        totalIncome: 0,
        monthlyAverage: 0,
        topCategories: []
      });
      setIsLoading(false);
      
      // Clear the timeout in error case too
      clearTimeout(loadingTimeout);
    }
  }, []); // Remove dependencies to prevent re-creation

  useEffect(() => {
    // Force refresh when app initializes - only run once
    if (!appInitialized) {
      const timer = setTimeout(() => {
        setAppInitialized(true);
        setIsDataStale(true); // Force refresh
        loadStats(true); // Force refresh stats
        loadTransactionData(true); // Force refresh transactions
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [appInitialized]); // Add appInitialized as dependency

  // Auto-register for push notifications when user is logged in
  useEffect(() => {
    if (user) {
      registerForPushNotifications().then((token) => {
        if (token) {
          // Push notification token registered successfully
        }
      }).catch((error) => {
        console.error('❌ HomeScreen: Error registering for push notifications:', error);
      });
    }
  }, [user, registerForPushNotifications]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (loadDataTimeoutRef.current) {
        clearTimeout(loadDataTimeoutRef.current);
      }
    };
  }, []);

  // Load and persist Money Manager click counter
  useEffect(() => {
    const loadClickCounter = async () => {
      try {
        const savedCount = await AsyncStorage.getItem('moneyManagerClicks');
        if (savedCount !== null) {
          const count = parseInt(savedCount, 10);
          setMoneyManagerClicks(count);
          console.log(`📊 Money Manager clicks: ${count}`);
        }
      } catch (error) {
        console.error('❌ Error loading Money Manager click counter:', error);
      }
    };
    loadClickCounter();
  }, []);

  // Banner auto-scroll functionality
  useEffect(() => {
    // Only set up interval if we have banners
    if (banners.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % banners.length;
        if (bannerFlatListRef.current) {
          try {
            bannerFlatListRef.current.scrollToIndex({ index: nextIndex, animated: true });
          } catch (e) {
            // ignore out of range if list not ready
          }
        }
        return nextIndex;
      });
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  // Smart Insights auto-scroll functionality
  useEffect(() => {
    const insights = generateSmartInsights();
    // Only set up interval if we have multiple insights
    if (insights.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentInsightIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % insights.length;
        if (insightsScrollViewRef.current) {
          try {
            const cardWidth = width - (theme.spacing.md * 2) + theme.spacing.md; // Card width + margin
            insightsScrollViewRef.current.scrollTo({
              x: nextIndex * cardWidth,
              animated: true
            });
          } catch (e) {
            // ignore scroll errors
          }
        }
        return nextIndex;
      });
    }, 4000); // 4 seconds for insights (slightly faster than banners)

    return () => clearInterval(interval);
  }, [totalExpense, totalIncome, recentTransactions.length]); // Re-run when insights data changes

  // Reload data when screen comes into focus (after adding a transaction)
  useFocusEffect(
    React.useCallback(() => {
      
      // Clear any existing timeout
      if (loadDataTimeoutRef.current) {
        clearTimeout(loadDataTimeoutRef.current);
      }
      
      // Debounce the data loading
      loadDataTimeoutRef.current = setTimeout(() => {
        const now = Date.now();
        
        // Always force refresh when screen comes into focus
        // This ensures new transactions are immediately visible
        setIsDataStale(true);
        setAppInitialized(true);
        loadStats(true); // Force refresh stats
        loadTransactionData(true); // Force refresh transactions
      }, DEBOUNCE_DELAY);
      
      // Cleanup function
      return () => {
        if (loadDataTimeoutRef.current) {
          clearTimeout(loadDataTimeoutRef.current);
        }
      };
    }, [loadStats, loadTransactionData]) // Include dependencies to ensure callback updates
  );


  const onRefresh = async () => {
    setRefreshing(true);
    setIsDataStale(true); // Mark data as stale to force refresh
    await Promise.all([
      loadStats(true), // Force refresh stats
      loadTransactionData(true), // Force refresh transactions
    ]);
    setRefreshing(false);
  };


  // Generate smart insights based on user's financial data
  const generateSmartInsights = () => {
    const insights = [];
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Insight 1: Spending trend analysis
    if (totalExpense > 0) {
      const dailyAverage = totalExpense / currentDate.getDate();
      if (dailyAverage > 500) {
        insights.push({
          type: 'Spending Alert',
          icon: 'trending-up',
          message: `You're spending ₹${Math.round(dailyAverage)} daily on average. Consider reviewing your expenses.`,
          color: '#FF6B35',
          action: 'view_transactions',
          actionText: 'View Details'
        });
      } else if (dailyAverage < 200) {
        insights.push({
          type: 'Great Job!',
          icon: 'checkmark-circle',
          message: `Excellent! You're spending only ₹${Math.round(dailyAverage)} daily. Keep it up!`,
          color: '#4CAF50',
          action: 'view_transactions',
          actionText: 'View Details'
        });
      }
    }

    // Insight 2: Savings analysis
    if (totalIncome > 0 && totalExpense > 0) {
      const savingsRate = ((totalIncome - totalExpense) / totalIncome) * 100;
      if (savingsRate > 20) {
        insights.push({
          type: 'Savings Champion',
          icon: 'trophy',
          message: `Amazing! You're saving ${savingsRate.toFixed(1)}% of your income this month.`,
          color: '#2196F3',
          action: 'view_goals',
          actionText: 'Set Goals'
        });
      } else if (savingsRate < 10 && savingsRate > 0) {
        insights.push({
          type: 'Savings Tip',
          icon: 'bulb',
          message: `You're saving ${savingsRate.toFixed(1)}% this month. Try to aim for 20%!`,
          color: '#FF9800',
          action: 'view_goals',
          actionText: 'Set Goals'
        });
      } else if (savingsRate <= 0) {
        insights.push({
          type: 'Budget Alert',
          icon: 'warning',
          message: `You're spending more than you earn. Let's create a budget to get back on track.`,
          color: '#F44336',
          action: 'view_budget',
          actionText: 'Create Budget'
        });
      }
    }

    // Insight 3: Transaction frequency
    if (recentTransactions.length > 0) {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const recentCount = recentTransactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= yesterday;
      }).length;

      if (recentCount === 0) {
        insights.push({
          type: 'Reminder',
          icon: 'time',
          message: "Don't forget to log your expenses today to keep track of your spending!",
          color: '#9C27B0',
          action: 'add_transaction',
          actionText: 'Add Transaction'
        });
      } else if (recentCount >= 5) {
        insights.push({
          type: 'Active User',
          icon: 'flash',
          message: `You've logged ${recentCount} transactions recently. Great job staying organized!`,
          color: '#00BCD4',
          action: null,
          actionText: null
        });
      }
    }

    // Insight 4: Monthly progress
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysPassed = currentDate.getDate();
    const monthProgress = (daysPassed / daysInMonth) * 100;
    
    if (monthProgress > 50) {
      const remainingDays = daysInMonth - daysPassed;
      insights.push({
        type: 'Month Progress',
        icon: 'calendar',
        message: `${remainingDays} days left this month. Time to review your budget!`,
        color: '#607D8B',
        action: 'view_budget',
        actionText: 'Review Budget'
      });
    }

    // Insight 5: Financial tip (single tip)
    const tips = [
      {
        type: 'Pro Tip',
        icon: 'star',
        message: "Track small expenses too - they add up quickly!",
        color: '#795548',
        action: null,
        actionText: null
      }
    ];
    
    // Add a random tip if we have space
    if (insights.length < 3) {
      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      insights.push(randomTip);
    }

    // Return maximum 3 insights
    return insights.slice(0, 3);
  };

  // Handle insight action button clicks
  const handleInsightAction = (action: string) => {
    switch (action) {
      case 'view_transactions':
        (navigation as any).navigate('AllTransaction');
        break;
      case 'view_goals':
        (navigation as any).navigate('SavingsGoals');
        break;
      case 'view_budget':
        (navigation as any).navigate('BudgetPlanning');
        break;
      case 'add_transaction':
        (navigation as any).navigate('AddTransaction');
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
    },
    
    // Header Styles
    headerContainer: {
      paddingHorizontal: theme.spacing.md,
      paddingBottom: theme.spacing.md,
      // Removed border and shadow for cleaner look
    },
    headerContent: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerLeft: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerRight: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    menuButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.md,
    },
    greetingContainer: {
      flex: 1,
      paddingLeft: theme.spacing.xs,
    },
    greetingText: {
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 4,
    },
    subtitleText: {
      fontSize: 12,
      fontWeight: '400',
      opacity: 0.8,
    },
    notificationButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      // Removed background circle and shadow
    },
    notificationBadge: {
      position: 'absolute',
      top: 2,
      right: 2,
      backgroundColor: '#FF3B30',
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 2,
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    notificationBadgeText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: 'bold',
      lineHeight: 12,
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: 0, // No top padding to eliminate space
      paddingBottom: 150, // Add padding for tab bar and floating button
    },
    featuredCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      marginTop: theme.spacing.sm, // Reduced space above card
      marginBottom: theme.spacing.lg - 6, // Reduced by 6px (24px -> 18px)
      borderWidth: 1,
      borderColor: '#E0E0E0',
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    featuredCardContent: {
      flex: 1,
    },
    featuredCardTitle: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
      marginBottom: theme.spacing.xs,
    },
    featuredCardAmount: {
      fontSize: theme.fontSize.xl * 1.2,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: theme.spacing.xs,
    },
    featuredCardSubtitle: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.primary,
      fontWeight: '500',
    },
    featuredCardIcon: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: theme.colors.primary + '15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    featuredCardIconText: {
      fontSize: 24,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      paddingHorizontal: theme.spacing.md,
    },
    leftSection: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    rightChevronContainer: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    cardSpacer: {
      height: 20,
    },
    cardContent: {
      width: '100%',
    },
    cardSubtitle: {
      fontSize: theme.fontSize.sm - 2,
      color: '#007AFF',
      marginTop: 4,
      textAlign: 'center',
      fontWeight: 'bold',
    },
    cardAmount: {
      fontSize: theme.fontSize.lg - 3,
      color: theme.colors.text,
      textAlign: 'center',
      fontWeight: 'bold',
      marginTop: 4,
    },
    cardDescription: {
      fontSize: 10,
      fontWeight: '500',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      fontStyle: 'italic',
      marginTop: 4,
      marginBottom: 8,
    },
    cardRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 8,
      paddingHorizontal: theme.spacing.lg,
    },
    cardLeftSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardRightSection: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    cardLeftColumn: {
      flex: 1,
      alignItems: 'flex-start',
    },
    cardRightColumn: {
      flex: 1,
      alignItems: 'flex-end',
    },
    cardLeftText: {
      fontSize: theme.fontSize.sm - 2,
      color: theme.colors.text,
      fontWeight: 'bold',
    },
    cardRightText: {
      fontSize: theme.fontSize.sm - 2,
      color: theme.colors.text,
      fontWeight: 'bold',
    },
    cardLeftAmount: {
      fontSize: theme.fontSize.md - 3,
      color: theme.colors.text,
      fontWeight: 'bold',
      marginTop: -2,
    },
    cardRightAmount: {
      fontSize: theme.fontSize.md - 3,
      color: theme.colors.text,
      fontWeight: 'bold',
      marginTop: -2,
    },
    cardRightSubtext: {
      fontSize: 9,
      fontWeight: '400',
      color: theme.colors.textSecondary,
      textAlign: 'right',
      marginTop: 2,
      fontStyle: 'italic',
    },
    cardBottomSpacer: {
      height: 8,
    },
    cardIcon: {
      marginRight: theme.spacing.sm,
    },
    cardTitle: {
      fontSize: theme.fontSize.sm - 2,
      fontWeight: 'bold',
      color: '#666666',
    },
    cardChevron: {
      marginLeft: 4,
    },
    cardDate: {
      fontSize: theme.fontSize.sm - 2,
      color: theme.colors.textSecondary,
      fontWeight: 'bold',
      marginLeft: 4,
    },


    // Banner Carousel Styles
    // Quick Action Buttons
    quickActionContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.lg,
    },
    quickActionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 12,
      paddingHorizontal: 12,
      marginHorizontal: theme.spacing.xs,
      borderRadius: 20,
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
    },
    quickActionText: {
      fontSize: 12,
      fontWeight: '600',
      color: '#FFFFFF',
      marginLeft: theme.spacing.xs,
      textAlign: 'center',
    },

    bannerContainer: {
      marginBottom: theme.spacing.lg,
      marginHorizontal: -theme.spacing.md, // Negative margin to extend to screen edges
    },
    bannerFlatList: {
      width: '100%',
    },
    bannerFlatListContent: {
      paddingHorizontal: 0,
    },
    bannerCard: {
      width: width,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bannerInner: {
      width: width - (theme.spacing.md * 2),
      marginHorizontal: theme.spacing.md,
      borderRadius: 16,
      padding: theme.spacing.md,
      height: Math.round((width - (theme.spacing.md * 2)) / 3), // 3:1 aspect ratio height to match images
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#000000',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.2,
      shadowRadius: 12,
      elevation: 8,
    },
    bannerImage: {
      width: width - (theme.spacing.md * 2),
      height: Math.round((width - (theme.spacing.md * 2)) / 3), // 3:1 aspect ratio
      borderRadius: 16,
      backgroundColor: '#FFFFFF',
      borderWidth: 1,
      borderColor: '#000000',
    },
    bannerContent: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.sm,
    },
    bannerIcon: {
      marginBottom: theme.spacing.xs,
    },
    bannerTitle: {
      fontSize: theme.fontSize.md,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
      marginBottom: 4,
    },
    bannerSubtitle: {
      fontSize: theme.fontSize.sm,
      color: '#FFFFFF',
      textAlign: 'center',
      opacity: 0.9,
    },
    dotContainer: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: theme.spacing.md,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: '#CCCCCC',
      marginHorizontal: 4,
    },
    activeDot: {
      width: 20,
      backgroundColor: '#007AFF',
    },
    appQuoteContainer: {
      alignItems: 'center',
      marginTop: theme.spacing.lg,
      marginBottom: theme.spacing.xs,
      paddingHorizontal: theme.spacing.md,
      width: '100%',
    },
    appQuote: {
      fontSize: 24,
      color: '#999999', // Lighter shade
      textAlign: 'center',
      fontStyle: 'italic',
      fontWeight: '500',
      lineHeight: 28,
      marginBottom: theme.spacing.sm,
    },
    appName: {
      fontSize: theme.fontSize.xl,
      color: '#1A365D',
      textAlign: 'center',
      fontWeight: '700',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    madeWithLoveContainer: {
      alignItems: 'center',
      marginTop: theme.spacing.lg,
      marginBottom: 0,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.md,
      width: '100%',
    },
    madeWithLoveText: {
      fontSize: 12,
      color: '#333333', // Darker for better visibility
      textAlign: 'center',
      fontStyle: 'italic',
      fontWeight: '500',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    madeWithLoveSubtext: {
      fontSize: 10,
      color: '#666666',
      textAlign: 'center',
      fontStyle: 'italic',
      fontWeight: '400',
      opacity: 0.8,
    },

    floatingCardsContainer: {
      marginBottom: theme.spacing.sm,
      marginHorizontal: -theme.spacing.md, // Negative margin to extend to screen edges
    },
    floatingCardsTitle: {
      fontSize: theme.fontSize.lg - 2,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: theme.spacing.md,
      marginHorizontal: theme.spacing.md,
    },
    floatingCardsList: {
      paddingHorizontal: theme.spacing.md,
    },
    floatingCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: theme.borderRadius.lg,
      width: 160,
      height: 120,
      marginRight: theme.spacing.sm,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    floatingCardContent: {
      flex: 1,
      padding: theme.spacing.md,
      paddingBottom: 4,
    },
    floatingCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    floatingCardHeaderLeft: {
      alignItems: 'center',
    },
    floatingCardHeaderRight: {
      flex: 1,
      alignItems: 'flex-end',
      marginLeft: theme.spacing.xs,
      justifyContent: 'center',
    },
    floatingCardBody: {
      flex: 1,
      justifyContent: 'space-between',
      alignItems: 'stretch',
    },
    floatingCardIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: 'center',
      alignItems: 'center',
    },
    floatingCardTitle: {
      fontSize: theme.fontSize.xs - 2,
      fontWeight: '500',
      color: theme.colors.text,
      textAlign: 'right',
    },
    floatingCardCategorySection: {
      marginBottom: theme.spacing.xs,
      marginLeft: theme.spacing.lg, // Further increased left margin for more spacing
      paddingRight: theme.spacing.xs, // Add right padding for spacing
    },
    floatingCardAmountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.xs,
    },
    floatingCardArrow: {
      marginLeft: 4,
      fontWeight: 'bold',
    },
    floatingCardAmountSection: {
      alignItems: 'flex-end',
    },
    floatingCardCategory: {
      fontSize: theme.fontSize.xs - 2,
      fontWeight: 'bold',
      color: '#000000',
      textAlign: 'right',
    },
    floatingCardAmount: {
      fontSize: theme.fontSize.md - 4,
      fontWeight: '600',
      color: theme.colors.text,
      textAlign: 'right',
    },
    floatingCardDivider: {
      height: 1,
      backgroundColor: '#E0E0E0',
      marginVertical: 2,
    },
    floatingCardDate: {
      fontSize: theme.fontSize.xs - 4,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 4,
    },
    viewAllCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: theme.borderRadius.lg,
      width: 160,
      height: 120,
      marginRight: theme.spacing.md,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    viewAllCardContent: {
      flex: 1,
      padding: theme.spacing.md,
      paddingBottom: theme.spacing.sm,
    },
    viewAllCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    viewAllCardHeaderLeft: {
      alignItems: 'center',
    },
    viewAllCardHeaderRight: {
      flex: 1,
      alignItems: 'flex-end',
      marginLeft: theme.spacing.xs,
      justifyContent: 'center',
    },
    viewAllCardIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#007AFF15',
      justifyContent: 'center',
      alignItems: 'center',
    },
    viewAllCardTitle: {
      fontSize: theme.fontSize.xs - 2,
      fontWeight: '500',
      color: theme.colors.text,
      textAlign: 'right',
    },
    viewAllCardBody: {
      flex: 0.8,
      justifyContent: 'space-between',
      alignItems: 'stretch',
    },
    viewAllCardSpacer: {
      flex: 1,
    },
    viewAllCardBottom: {
      alignItems: 'stretch',
    },
    viewAllCardBottomSpacer: {
      height: 8,
    },
    viewAllCardHistory: {
      fontSize: theme.fontSize.xs - 2,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginBottom: 8,
    },
    viewAllCardDivider: {
      height: 1,
      backgroundColor: '#E0E0E0',
      marginVertical: theme.spacing.xs,
    },
    viewAllCardAction: {
      fontSize: theme.fontSize.xs - 2,
      color: theme.colors.textSecondary,
      textAlign: 'center',
    },
    loadingContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
    },
    emptyContainer: {
      padding: theme.spacing.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyText: {
      fontSize: theme.fontSize.lg,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: theme.spacing.md,
      textAlign: 'center',
    },
    emptySubtext: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
      marginTop: theme.spacing.xs,
      textAlign: 'center',
    },
    floatingActionButton: {
      position: 'absolute',
      right: 20,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: '#007AFF',
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },

    adContainer: {
      alignItems: 'center',
      paddingVertical: 4,
      marginBottom: theme.spacing.sm,
      backgroundColor: 'transparent',
    },

    // Smart Insights Styles - Card View (matching Money Manager)
    smartInsightsCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    insightsCardContent: {
      padding: 0, // No padding since card has its own padding
    },
    insightsHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#F5F5F5',
    },
    insightsIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#FFF4E6',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.sm,
    },
    insightsTitleContainer: {
      flex: 1,
    },
    insightsTitleText: {
      fontSize: theme.fontSize.lg - 3,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 0,
    },
    insightsSubtitleText: {
      fontSize: theme.fontSize.sm - 1,
      color: theme.colors.textSecondary,
      fontWeight: '400',
      marginTop: 0,
    },
    insightsChevron: {
      padding: 4,
    },
    insightListItem: {
      marginBottom: theme.spacing.sm,
    },
    insightItemContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.xs,
    },
    insightItemIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.sm,
    },
    insightItemTextContainer: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    insightItemType: {
      fontSize: theme.fontSize.xs - 3,
      fontWeight: '700',
      color: theme.colors.text,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 2,
    },
    insightItemMessage: {
      fontSize: theme.fontSize.sm - 1,
      color: theme.colors.text,
      lineHeight: 17,
      fontWeight: '400',
    },
    insightItemAction: {
      justifyContent: 'center',
      alignItems: 'center',
      width: 24,
      height: 24,
      borderRadius: 12,
    },

    // Spending Categories Styles - Card View (matching Money Manager)
    spendingCategoriesCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    spendingCategoriesContent: {
      padding: 0, // No padding since card has its own padding
    },
    spendingCategoriesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#F5F5F5',
    },
    spendingCategoriesIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#E8F5E8',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.sm,
    },
    spendingCategoriesTitleContainer: {
      flex: 1,
    },
    spendingCategoriesTitleText: {
      fontSize: theme.fontSize.lg - 3,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 0,
    },
    spendingCategoriesSubtitleText: {
      fontSize: theme.fontSize.sm - 1,
      color: theme.colors.textSecondary,
      fontWeight: '400',
      marginTop: 0,
    },
    spendingCategoriesChevron: {
      padding: 4,
    },
    spendingCategoryItem: {
      marginBottom: theme.spacing.md,
    },
    spendingCategoryContent: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.xs,
    },
    spendingCategoryIcon: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.sm,
      backgroundColor: '#F8F9FA',
    },
    spendingCategoryEmoji: {
      fontSize: 17,
    },
    spendingCategoryTextContainer: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    spendingCategoryName: {
      fontSize: theme.fontSize.sm - 1,
      fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 2,
    },
    spendingCategoryAmount: {
      fontSize: theme.fontSize.sm - 1,
      fontWeight: '600',
      color: theme.colors.text,
    },
    spendingCategoryPercentageContainer: {
      backgroundColor: '#E3F2FD',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
    },
    spendingCategoryPercentage: {
      fontSize: theme.fontSize.xs - 3,
      fontWeight: '600',
      color: '#1976D2',
    },

    // Active Loans Styles - Redesigned Card View
    activeLoansCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.lg,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    activeLoansContent: {
      padding: 0,
    },
    activeLoansHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: theme.spacing.lg,
      paddingBottom: theme.spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: '#F5F5F5',
    },
    activeLoansIconContainer: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#F0F8FF',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.sm,
    },
    activeLoansTitleContainer: {
      flex: 1,
    },
    activeLoansTitleText: {
      fontSize: theme.fontSize.lg - 2,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 0,
    },
    activeLoansSubtitleText: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.textSecondary,
      fontWeight: '400',
      marginTop: 0,
    },
    activeLoansChevron: {
      padding: 4,
    },
    loanStatsContainer: {
      flexDirection: 'row',
      gap: theme.spacing.md,
    },
    loanStatCard: {
      flex: 1,
      backgroundColor: '#F8F9FA',
      borderRadius: 12,
      padding: theme.spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: '#E5E7EB',
    },
    loanStatIcon: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: theme.spacing.sm,
    },
    loanStatContent: {
      flex: 1,
    },
    loanStatLabel: {
      fontSize: theme.fontSize.xs - 2,
      color: theme.colors.textSecondary,
      fontWeight: '500',
      marginBottom: 2,
    },
    loanStatValue: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.text,
      fontWeight: '600',
    },
  });

  // Header Component
  const HomeHeader: React.FC<{ user?: any; theme: any; insets: any }> = ({ user, theme, insets }) => {
    const { unreadCount } = useNotifications();
    // Different padding for Android vs iOS
    const headerPaddingTop = Platform.OS === 'android' ? insets.top + 5 : insets.top + 10;
    
    return (
      <View style={[styles.headerContainer, { paddingTop: headerPaddingTop, backgroundColor: theme.colors.background }]}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={openDrawer}
            >
              <Ionicons name="menu" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <View style={styles.greetingContainer}>
              <Text style={[styles.greetingText, { color: theme.colors.text }]} allowFontScaling={false}>
                {getGreeting(user?.name || user?.email)}
              </Text>
              <Text style={[styles.subtitleText, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
                {getTimeBasedSubtitle()}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => {
                (navigation as any).navigate('Notifications');
              }}
            >
              <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.notificationBadgeText} allowFontScaling={false}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText} allowFontScaling={false}>Loading...</Text>
        </View>
      </View>
    );
  }

  // Show offline screen when offline
  if (isOfflineMode) {
    return (
      <OfflineScreen 
        onRetry={onRefresh}
        title="Oops! Your internet took a coffee break ☕"
        message="Don't worry, your financial data is safe in the cloud! Tap the button below to reconnect and see your transactions."
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 0 }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Header with Safe Area - Now Scrollable */}
        <HomeHeader user={user} theme={theme} insets={insets} />
        
        <TouchableOpacity 
          style={styles.featuredCard}
          onPress={async () => {
            try {
              // Read current count from AsyncStorage
              const savedCount = await AsyncStorage.getItem('moneyManagerClicks');
              const currentCount = savedCount !== null ? parseInt(savedCount, 10) : 5;
              
              const newCount = currentCount - 1;
              await AsyncStorage.setItem('moneyManagerClicks', newCount.toString());
              setMoneyManagerClicks(newCount);
              
              console.log(`📊 Money Manager clicks remaining: ${newCount}`);
              
              if (newCount <= 0) {
                // Show real AdMob interstitial directly
                console.log('📱 Showing Money Manager interstitial ad');
                try {
                  await AppOpenAdService.showInterstitial();
                  console.log('✅ Money Manager interstitial shown');
                // Reset counter to 5 for next round
                await AsyncStorage.setItem('moneyManagerClicks', '5');
                  // Navigate after ad closes
                  setTimeout(() => {
                    navigation.navigate('SpentInMonth' as never);
                  }, 1000);
                } catch (error) {
                  console.error('❌ Money Manager interstitial failed:', error);
                  // Reset counter to 5 for next round
                  await AsyncStorage.setItem('moneyManagerClicks', '5');
                  // Navigate anyway if ad fails
                  navigation.navigate('SpentInMonth' as never);
                }
              } else {
                // Navigate immediately
                navigation.navigate('SpentInMonth' as never);
              }
            } catch (error) {
              console.error('❌ Error handling Money Manager click:', error);
              navigation.navigate('SpentInMonth' as never);
            }
          }}
        >
          <View style={styles.cardHeader}>
            <View style={styles.leftSection}>
                          <Ionicons name="stats-chart" size={12} color="#666666" style={styles.cardIcon} />
            <Text style={styles.cardTitle} allowFontScaling={false}>Money Manager</Text>
            <Ionicons name="chevron-forward" size={12} color="#007AFF" style={styles.cardChevron} />
            <Text style={[styles.cardDate, { color: '#007AFF' }]} allowFontScaling={false}>{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</Text>
            </View>
            <View style={styles.rightChevronContainer}>
              <Ionicons name="chevron-forward" size={12} color="#007AFF" />
            </View>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardSpacer} />
            <Text style={styles.cardSubtitle} allowFontScaling={false}>Current Balance</Text>
            <Text style={styles.cardAmount} allowFontScaling={false}>
              {loading ? '--' : formatCurrency(currentBalance)}
            </Text>
            <Text style={styles.cardDescription} allowFontScaling={false}>
              Including previous months savings
            </Text>
            <View style={styles.cardRow}>
              <View style={styles.cardLeftSection}>
                <Ionicons name="arrow-up" size={12} color={theme.colors.text} style={[styles.cardIcon, { transform: [{ rotate: '45deg' }] }]} />
                <Text style={styles.cardLeftText} allowFontScaling={false}>Expense</Text>
              </View>
              <View style={styles.cardRightSection}>
                <Ionicons name="arrow-down" size={12} color={theme.colors.text} style={[styles.cardIcon, { transform: [{ rotate: '45deg' }] }]} />
                <Text style={styles.cardRightText} allowFontScaling={false}>Income</Text>
              </View>
            </View>
            <View style={styles.cardRow}>
              <View style={styles.cardLeftColumn}>
                <Text style={styles.cardLeftAmount} allowFontScaling={false}>
                  {loading ? '--' : formatCurrency(totalExpense)}
                </Text>
              </View>
              <View style={styles.cardRightColumn}>
                <Text style={styles.cardRightAmount} allowFontScaling={false}>
                  {loading ? '--' : formatCurrency(totalIncome)}
                </Text>
                <Text style={styles.cardRightSubtext} allowFontScaling={false}>
                  ({formatCurrency(totalIncome - previousMonthSavings < 0 ? 0 : totalIncome - previousMonthSavings)} this month + {formatCurrency(previousMonthSavings)} previous savings)
                </Text>
              </View>
            </View>
            {/* Credit Card Expenses Row - Hidden for v1 release */}
            {/* {totalCreditCardExpenses > 0 && (
              <>
                <View style={[styles.cardRow, { justifyContent: 'center', flexDirection: 'column', alignItems: 'center' }]}>
                  <View style={styles.cardLeftSection}>
                    <Ionicons name="arrow-up" size={13} color={theme.colors.text} style={[styles.cardIcon, { transform: [{ rotate: '45deg' }] }]} />
                    <Text style={styles.cardLeftText} allowFontScaling={false}>Credit Expense</Text>
                  </View>
                  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={[styles.cardLeftAmount, { textAlign: 'center', marginTop: 4 }]} allowFontScaling={false}>
                      {loading ? '--' : formatCurrency(totalCreditCardExpenses)}
                    </Text>
                    <Text style={{ fontSize: 10, color: 'red', textAlign: 'center', marginTop: 2 }} allowFontScaling={false}>
                      (Credit Card Utilized)
                    </Text>
                  </View>
                </View>
              </>
            )} */}
            <View style={styles.cardBottomSpacer} />
          </View>
        </TouchableOpacity>

        {/* Sync Status Indicator */}


        {!loading && recentTransactions.length > 0 && (
          <View style={styles.floatingCardsContainer}>
            <Text style={styles.floatingCardsTitle} allowFontScaling={false}>Recent Transactions</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.floatingCardsList}
            >
              {recentTransactions.slice(0, 5).map((transaction, index) => {
                return (
                  <TouchableOpacity 
                    key={transaction.id || `transaction-${index}`} 
                    style={styles.floatingCard}
                    onPress={() => (navigation as any).navigate('TransactionDetail', { transactionId: transaction.id })}
                  >
                  <View style={styles.floatingCardContent}>
                    <View style={styles.floatingCardHeader}>
                      <View style={styles.floatingCardHeaderLeft}>
                        <View style={[styles.floatingCardIcon, { backgroundColor: transaction.categorycolor || transaction.color || '#6B7280' }]}>
                          <Ionicons name={transaction.categoryicon || transaction.icon || 'receipt'} size={18} color="#FFFFFF" />
                        </View>
                      </View>
                      <View style={styles.floatingCardHeaderRight}>
                        <Text style={styles.floatingCardTitle} numberOfLines={1} allowFontScaling={false}>
                          {transaction.description || transaction.title || 'Transaction'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.floatingCardBody}>
                      <View style={styles.floatingCardCategorySection}>
                        <Text style={styles.floatingCardCategory} numberOfLines={1} allowFontScaling={false}>
                          {transaction.category}
                        </Text>
                      </View>
                      <View style={styles.floatingCardAmountRow}>
                        <Ionicons 
                          name={transaction.type === 'expense' ? 'arrow-up' : 'arrow-down'} 
                          size={16} 
                          color="#000000" 
                          style={[styles.floatingCardArrow, { transform: [{ rotate: '45deg' }] }]}
                        />
                        <Text style={[styles.floatingCardAmount, { color: transaction.type === 'expense' ? '#FF3B30' : '#34C759' }]} numberOfLines={1} allowFontScaling={false}>
                          ₹{transaction.amount}
                        </Text>
                      </View>
                      <View style={styles.floatingCardDivider} />
                      <Text style={styles.floatingCardDate} numberOfLines={1} allowFontScaling={false}>
                        {formatTransactionDate(transaction.date)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
                );
              })}
              {recentTransactions.length > 5 && (
                <TouchableOpacity 
                  style={styles.viewAllCard}
                  onPress={() => navigation.navigate('AllTransaction' as never)}
                >
                  <View style={styles.viewAllCardContent}>
                    <View style={styles.viewAllCardHeader}>
                      <View style={styles.viewAllCardHeaderLeft}>
                        <View style={styles.viewAllCardIcon}>
                          <Ionicons name="document-text" size={18} color="#007AFF" />
                        </View>
                      </View>
                      <View style={styles.viewAllCardHeaderRight}>
                        <Text style={styles.viewAllCardTitle} numberOfLines={2} allowFontScaling={false}>
                          View All{'\n'}Transactions
                        </Text>
                      </View>
                    </View>
                    <View style={styles.viewAllCardBody}>
                      <View style={styles.viewAllCardSpacer} />
                    </View>
                    <View style={styles.viewAllCardBottom}>
                      <View style={styles.viewAllCardBottomSpacer} />
                      <Text style={styles.viewAllCardHistory} numberOfLines={1} allowFontScaling={false}>
                        View your full history
                      </Text>
                      <View style={styles.viewAllCardDivider} />
                      <Text style={styles.viewAllCardAction} numberOfLines={1} allowFontScaling={false}>
                        → Tap to View
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        )}

        {/* AdMob Banner Ad - Middle */}
        <View style={styles.adContainer}>
          <BannerAdComponent />
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.quickActionContainer}>
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => {
              // Navigate to Savings Goals screen
              (navigation as any).navigate('SavingsGoals');
            }}
          >
            <Ionicons name="wallet-outline" size={18} color="#FFFFFF" />
            <Text style={styles.quickActionText} allowFontScaling={false}>Savings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: '#2196F3' }]}
            onPress={() => {
              // Navigate to Budget Planning screen
              (navigation as any).navigate('BudgetPlanning');
            }}
          >
            <Ionicons name="pie-chart-outline" size={18} color="#FFFFFF" />
            <Text style={styles.quickActionText} allowFontScaling={false}>Budget</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: '#FF9800' }]}
            onPress={() => {
              // Navigate to Reminders screen
              (navigation as any).navigate('Reminders');
            }}
          >
            <Ionicons name="alarm-outline" size={18} color="#FFFFFF" />
            <Text style={styles.quickActionText} allowFontScaling={false}>Remind</Text>
          </TouchableOpacity>
        </View>


        {/* Carousel Banner Section */}
        {banners.length > 0 && (
          <View style={styles.bannerContainer}>
            <FlatList
              ref={bannerFlatListRef}
              data={banners}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bannerFlatListContent}
              style={styles.bannerFlatList}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.x / width);
                setCurrentBannerIndex(index);
              }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => {
                    if (item.target_url || item.targetUrl) {
                      try { Linking.openURL(item.target_url || item.targetUrl); } catch {}
                    }
                  }}
                >
                  <View style={styles.bannerCard}>
                    <View style={[styles.bannerInner, { backgroundColor: '#FFFFFF', padding: item.imageUrl ? 0 : styles.bannerInner.padding }]}>
                      {item.imageUrl ? (
                        <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: '100%', borderRadius: 16 }} resizeMode="cover" />
                      ) : (
                        <View style={[styles.bannerContent, { height: '100%' }]}>
                          <Ionicons name={(item.icon as any) || 'pricetag-outline'} size={24} color={item.textColor || '#333333'} style={styles.bannerIcon} />
                          <Text style={[styles.bannerTitle, { color: item.textColor || '#333333' }]} numberOfLines={2} allowFontScaling={false}>
                            {item.title}
                          </Text>
                          {item.subtitle ? (
                            <Text style={[styles.bannerSubtitle, { color: item.textColor || '#666666' }]} numberOfLines={1} allowFontScaling={false}>
                              {item.subtitle}
                            </Text>
                          ) : null}
                        </View>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.id}
            />
            {/* Dot Indicators */}
            <View style={styles.dotContainer}>
              {banners.map((banner, index) => (
                <View
                  key={banner.id || `banner-${index}`}
                  style={[
                    styles.dot,
                    index === currentBannerIndex && styles.activeDot
                  ]}
                />
              ))}
            </View>
          </View>
        )}

         {/* Smart Insights Section - Card View */}
         {!loading && (
           <View style={styles.smartInsightsCard}>
            <View style={styles.insightsCardContent}>
              {/* Header with icon and title */}
              <View style={styles.insightsHeader}>
                <View style={styles.insightsIconContainer}>
                  <Ionicons name="bulb" size={19} color="#FF9500" />
                </View>
                <View style={styles.insightsTitleContainer}>
                  <Text style={styles.insightsTitleText} allowFontScaling={false}>Smart Insights</Text>
                  <Text style={styles.insightsSubtitleText} allowFontScaling={false}>
                    Personalized financial tips
                  </Text>
                </View>
                <View style={styles.insightsChevron}>
                  <Ionicons name="chevron-forward" size={15} color="#FF9500" />
                </View>
              </View>
               
               {generateSmartInsights().map((insight, index) => (
                 <TouchableOpacity 
                   key={index} 
                   style={styles.insightListItem}
                   onPress={() => insight.action && handleInsightAction(insight.action)}
                   activeOpacity={0.8}
                 >
                   <View style={styles.insightItemContent}>
                     <View style={[styles.insightItemIcon, { backgroundColor: insight.color }]}>
                       <Ionicons name={insight.icon} size={17} color="#FFFFFF" />
                     </View>
                     <View style={styles.insightItemTextContainer}>
                       <Text style={styles.insightItemType} allowFontScaling={false}>{insight.type}</Text>
                       <Text style={styles.insightItemMessage} allowFontScaling={false} numberOfLines={2}>
                         {insight.message}
                       </Text>
                     </View>
                     {insight.action && (
                       <View style={styles.insightItemAction}>
                         <Ionicons name="chevron-forward" size={15} color={insight.color} />
                       </View>
                     )}
                   </View>
                 </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* AdMob Banner Ad - Top */}
          <View style={styles.adContainer}>
            <BannerAdComponent />
          </View>

        {/* Top Spending Categories */}
        {!loading && spendingCategories.length > 0 && (
          <TouchableOpacity 
            style={styles.spendingCategoriesCard}
            onPress={() => navigation.navigate('BudgetPlanning' as never)}
            activeOpacity={0.7}
          >
            <View style={styles.spendingCategoriesContent}>
              {/* Header with icon and title */}
              <View style={styles.spendingCategoriesHeader}>
                <View style={styles.spendingCategoriesIconContainer}>
                  <Ionicons name="pie-chart" size={19} color="#34C759" />
                </View>
                <View style={styles.spendingCategoriesTitleContainer}>
                  <Text style={styles.spendingCategoriesTitleText} allowFontScaling={false}>Top Spending Categories</Text>
                  <Text style={styles.spendingCategoriesSubtitleText} allowFontScaling={false}>
                    This month's highest expenses
                  </Text>
                </View>
                <View style={styles.spendingCategoriesChevron}>
                  <Ionicons name="chevron-forward" size={15} color="#34C759" />
                </View>
              </View>
              
              {/* Categories List */}
              {spendingCategories.map((category, index) => (
                <View key={index} style={styles.spendingCategoryItem}>
                  <View style={styles.spendingCategoryContent}>
                    <View style={styles.spendingCategoryIcon}>
                      <Text style={styles.spendingCategoryEmoji} allowFontScaling={false}>
                        {getCategoryIcon(category.category)}
                      </Text>
                    </View>
                    <View style={styles.spendingCategoryTextContainer}>
                      <Text style={styles.spendingCategoryName} allowFontScaling={false}>
                        {category.category}
                      </Text>
                      <Text style={styles.spendingCategoryAmount} allowFontScaling={false}>
                        {formatCurrency(category.amount)}
                      </Text>
                    </View>
                    <View style={styles.spendingCategoryPercentageContainer}>
                      <Text style={styles.spendingCategoryPercentage} allowFontScaling={false}>
                        {category.percentage.toFixed(0)}%
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        )}

        {/* Active Loans Summary */}
        {!loading && activeLoans.length > 0 && (
          <View style={styles.activeLoansCard}>
            <View style={styles.activeLoansContent}>
              {/* Header with icon and title */}
              <View style={styles.activeLoansHeader}>
                <View style={styles.activeLoansIconContainer}>
                  <Ionicons name="card" size={20} color="#007AFF" />
                </View>
                <View style={styles.activeLoansTitleContainer}>
                  <Text style={styles.activeLoansTitleText} allowFontScaling={false}>Active Loans</Text>
                  <Text style={styles.activeLoansSubtitleText} allowFontScaling={false}>
                    {activeLoans.length} loan{activeLoans.length > 1 ? 's' : ''} • Next payment: {nextPaymentDate}
                  </Text>
                </View>
                <TouchableOpacity 
                  onPress={() => navigation.navigate('Loans' as never)}
                  style={styles.activeLoansChevron}
                >
                  <Ionicons name="chevron-forward" size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>
              
              {/* Loan Stats in a more compact layout */}
              <View style={styles.loanStatsContainer}>
                <View style={styles.loanStatCard}>
                  <View style={styles.loanStatIcon}>
                    <Ionicons name="wallet" size={16} color="#34C759" />
                  </View>
                  <View style={styles.loanStatContent}>
                    <Text style={styles.loanStatLabel} allowFontScaling={false}>Outstanding</Text>
                    <Text style={styles.loanStatValue} allowFontScaling={false}>
                      {formatCurrency(totalOutstandingBalance)}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.loanStatCard}>
                  <View style={styles.loanStatIcon}>
                    <Ionicons name="calendar" size={16} color="#FF9500" />
                  </View>
                  <View style={styles.loanStatContent}>
                    <Text style={styles.loanStatLabel} allowFontScaling={false}>Monthly</Text>
                    <Text style={styles.loanStatValue} allowFontScaling={false}>
                      {formatCurrency(totalMonthlyPayment)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* App Quote and Name */}
        <View style={styles.appQuoteContainer}>
          <Text style={styles.appQuote} allowFontScaling={false}>
            "Every rupee counts, every decision matters."
          </Text>
        </View>

        {/* Made with Love in INDIA */}
        <View style={styles.madeWithLoveContainer}>
          <Text style={styles.madeWithLoveText} allowFontScaling={false}>
            Made with ❤️ in INDIA
          </Text>
          <Text style={styles.madeWithLoveSubtext} allowFontScaling={false}>
            MyPaisa Finance Manager
          </Text>
        </View>

      </ScrollView>


      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.floatingActionButton, { bottom: Math.max(insets.bottom + 70, 90) }]}
        onPress={() => {
          // Navigate directly to AddTransaction screen
          (navigation as any).navigate('AddTransaction');
        }}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Money Manager Real Interstitial Ad - REMOVED - now shows directly */}

    </View>
  );
};

export default HomeScreen; 