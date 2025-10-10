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

import TransactionService from '../services/transactionService';
import AccountService from '../services/AccountService';
import DailyReminderService from '../services/DailyReminderService';
import NotificationNavigationService from '../services/NotificationNavigationService';
import OfflineBanner from '../components/OfflineBanner';
import OfflineScreen from '../components/OfflineScreen';
import { BannerAd, showInterstitialAd } from '../components/AdMobComponents';
import { Ionicons } from '@expo/vector-icons';
import { API_BASE_URL } from '../config/api.config';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';

const { width } = Dimensions.get('window');

// Helper function to get greeting
const getGreeting = (userName?: string) => {
  return userName ? `Hi ${userName}` : 'Hi User';
};

const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute();
  const { scrollY } = useScroll();
  const { isOfflineMode } = useNetwork();
  
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
  // Credit card expenses hidden for v1 release
  // const [totalCreditCardExpenses, setTotalCreditCardExpenses] = useState(0);

  // Carousel banner state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerFlatListRef = useRef<FlatList>(null);
  const [banners, setBanners] = useState<any[]>([]);
  
  // Cache and debouncing state
  const [lastDataLoad, setLastDataLoad] = useState<number>(0);
  const [isDataStale, setIsDataStale] = useState(true);
  const [appInitialized, setAppInitialized] = useState(false);
  const loadDataTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const CACHE_DURATION = 30000; // 30 seconds cache
  const DEBOUNCE_DELAY = 1000; // 1 second debounce
  
  
  const loadAds = async () => {
    try {
      console.log('🔍 HomeScreen: Loading banners...');
      // Load banners from the public API endpoint
      const response = await fetch(`${API_BASE_URL}/banners/public`);
      console.log('🔍 HomeScreen: Banner response status:', response.status);
      if (response.ok) {
        const bannerResponse = await response.json();
        console.log('🔍 HomeScreen: Banner response data:', bannerResponse);
        if (bannerResponse.success && bannerResponse.data) {
          // Transform banner data to include full image URLs
          const transformedBanners = bannerResponse.data.map((banner: any) => ({
            ...banner,
            imageUrl: banner.image_url 
              ? `${API_BASE_URL.replace('/api', '')}${banner.image_url}`
              : null
          }));
          console.log('🔍 HomeScreen: Transformed banners:', transformedBanners);
          setBanners(transformedBanners);
          setCurrentBannerIndex(0);
          console.log('✅ HomeScreen: Banners loaded successfully');
        } else {
          console.log('❌ HomeScreen: Invalid banner response format');
          throw new Error('Invalid banner response format');
        }
        } else {
          console.log('❌ HomeScreen: Banner response not ok:', response.status);
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
      console.log('🔄 HomeScreen: Refresh flag detected, forcing immediate data reload...');
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
    if (loading && !forceRefresh) {
      return;
    }
    
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
      
      // Filter transactions for CURRENT MONTH only (Money Manager shows current month data)
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      
      const currentMonthTransactions = (transactions || []).filter(t => {
        const txnDate = new Date(t.date);
        return txnDate.getFullYear() === currentYear && txnDate.getMonth() === currentMonth;
      });
      
      console.log(`🔍 HomeScreen: Filtering for current month (${currentYear}-${currentMonth + 1}):`, {
        totalTransactions: transactions?.length || 0,
        currentMonthTransactions: currentMonthTransactions.length,
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
      
      // Debug logging for transactions (v1 - no credit cards)
      console.log('🔍 HomeScreen: Transaction categorization:', {
        totalExpenseTransactions: expenseTransactions.length,
        totalCashExpenses,
        // Credit card expenses hidden for v1 release
      });
      
      // For v1 release, transfers are not handled (credit cards hidden)
      // All expenses are cash expenses
      const currentBalance = totalIncome - totalCashExpenses;
      
      // Debug logging for money manager calculations (v1 - no credit cards)
      console.log('🔍 HomeScreen: Money Manager Calculations:', {
        totalIncome,
        totalCashExpenses,
        currentBalance,
        // Credit card functionality hidden for v1 release
      });
      
      setCurrentBalance(currentBalance);
      setTotalIncome(totalIncome);
      setTotalExpense(totalCashExpenses);
      // Credit card expenses hidden for v1 release
      // setTotalCreditCardExpenses(totalCreditCardExpenses);
      
      // Update cache timestamp
      setLastDataLoad(now);
      setIsDataStale(false);
      setLoading(false);
      setIsLoading(false);
    } catch (error) {
      console.error('❌ HomeScreen: Error loading transaction data:', error);
      setLoading(false);
      setIsLoading(false);
    }
  }, []); // Remove dependencies to prevent re-creation

  const loadStats = useCallback(async (forceRefresh = false) => {
    const now = Date.now();
    
    // Check if stats are fresh and not forcing refresh
    if (!forceRefresh && stats && (now - lastDataLoad) < CACHE_DURATION) {
      return;
    }
    
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
        loadAds();
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

  // Reload data when screen comes into focus (after adding a transaction)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 HomeScreen: Screen focused - checking if refresh needed...');
      
      // Clear any existing timeout
      if (loadDataTimeoutRef.current) {
        clearTimeout(loadDataTimeoutRef.current);
      }
      
      // Debounce the data loading
      loadDataTimeoutRef.current = setTimeout(() => {
        const now = Date.now();
        
        // Always force refresh when screen comes into focus
        // This ensures new transactions are immediately visible
        console.log('🔄 HomeScreen: Forcing data refresh on focus...');
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
      loadAds()
    ]);
    setRefreshing(false);
  };

  // Test function for salary reminder
  const testSalaryReminder = async () => {
    try {
      console.log('🧪 Testing salary reminder...');
      
      // Test immediate notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "New Month, New Budget",
          body: "Salary received? Add it now to plan your expenses.",
          data: { 
            type: 'monthly_salary_reminder',
            reminderType: 'salary',
            action: 'add_income'
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 3, // Show after 3 seconds
        },
      });
      
      console.log('✅ Salary reminder test notification scheduled for 3 seconds');
      alert('Salary reminder test notification will appear in 3 seconds!');
    } catch (error) {
      console.error('❌ Error testing salary reminder:', error);
      alert('Error testing salary reminder: ' + error.message);
    }
  };

  // Test function for custom notifications
  const testCustomNotification = async () => {
    try {
      console.log('🧪 Testing custom notification...');
      
      await NotificationNavigationService.getInstance().simulateCustomNotification();
      console.log('✅ Custom notification test triggered');
    } catch (error) {
      console.error('❌ Error testing custom notification:', error);
    }
  };

  // Direct navigation test
  const testDirectNavigation = () => {
    try {
      console.log('🧪 Testing direct navigation to NotificationDetail...');
      
      const testNotification = {
        id: 'direct-test-' + Date.now(),
        title: '🧪 Direct Navigation Test',
        body: 'This is a direct navigation test',
        type: 'update',
        content: `# Direct Navigation Test

This is a test to verify that direct navigation to the NotificationDetail screen works properly.

## Test Features:
- Direct navigation without notification
- Content display
- Back navigation
- Screen rendering

If you can see this content, the navigation system is working correctly!`,
        author: 'Test Team',
        actionButton: {
          text: 'Test Action',
          action: 'test_action'
        },
        tags: ['test', 'navigation', 'direct']
      };

      (navigation as any).navigate('NotificationDetail', {
        notificationId: testNotification.id,
        notification: testNotification
      });
      
      console.log('✅ Direct navigation test triggered');
    } catch (error) {
      console.error('❌ Error testing direct navigation:', error);
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
      paddingBottom: 100, // Add padding for tab bar and floating button
    },
    featuredCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      marginTop: theme.spacing.sm, // Reduced space above card
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
      fontSize: theme.fontSize.sm - 1,
      color: '#007AFF',
      marginTop: 4,
      textAlign: 'center',
      fontWeight: 'bold',
    },
    cardAmount: {
      fontSize: theme.fontSize.lg - 2,
      color: theme.colors.text,
      textAlign: 'center',
      fontWeight: 'bold',
      marginTop: 4,
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
      fontSize: theme.fontSize.sm - 1,
      color: theme.colors.text,
      fontWeight: 'bold',
    },
    cardRightText: {
      fontSize: theme.fontSize.sm - 1,
      color: theme.colors.text,
      fontWeight: 'bold',
    },
    cardLeftAmount: {
      fontSize: theme.fontSize.md - 2,
      color: theme.colors.text,
      fontWeight: 'bold',
      marginTop: -2,
    },
    cardRightAmount: {
      fontSize: theme.fontSize.md - 2,
      color: theme.colors.text,
      fontWeight: 'bold',
      marginTop: -2,
    },
    cardBottomSpacer: {
      height: 8,
    },
    cardIcon: {
      marginRight: theme.spacing.sm,
    },
    cardTitle: {
      fontSize: theme.fontSize.sm - 1,
      fontWeight: 'bold',
      color: '#666666',
    },
    cardChevron: {
      marginLeft: 4,
    },
    cardDate: {
      fontSize: theme.fontSize.sm - 1,
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
      fontSize: 14,
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
      paddingHorizontal: theme.spacing.lg,
    },
    appQuote: {
      fontSize: 36,
      color: '#999999', // Lighter shade
      textAlign: 'left',
      fontStyle: 'italic',
      fontWeight: '500',
      lineHeight: 40,
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
      marginBottom: theme.spacing.lg,
      paddingVertical: theme.spacing.md,
    },
    madeWithLoveText: {
      fontSize: theme.fontSize.lg,
      color: '#333333', // Darker for better visibility
      textAlign: 'center',
      fontStyle: 'italic',
      fontWeight: '500',
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    madeWithLoveSubtext: {
      fontSize: theme.fontSize.sm,
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
    salaryTestButton: {
      position: 'absolute',
      right: 20,
      width: 80,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#FF6B35',
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 4,
    },
    salaryTestButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 4,
    },

    adContainer: {
      alignItems: 'center',
      paddingVertical: 4,
      marginBottom: theme.spacing.sm,
      backgroundColor: 'transparent',
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
              onPress={() => {
                // Open drawer menu
                (navigation as any).openDrawer();
              }}
            >
              <Ionicons name="menu" size={24} color={theme.colors.text} />
            </TouchableOpacity>
            <View style={styles.greetingContainer}>
              <Text style={[styles.greetingText, { color: theme.colors.text }]} allowFontScaling={false}>
                {getGreeting(user?.name || user?.email)}
              </Text>
              <Text style={[styles.subtitleText, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
                Let's manage your finances together
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.notificationButton}
              onPress={() => {
                (navigation as any).navigate('MainApp', { screen: 'Notifications' });
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
          onPress={() => navigation.navigate('SpentInMonth' as never)}
        >
          <View style={styles.cardHeader}>
            <View style={styles.leftSection}>
                          <Ionicons name="stats-chart" size={13} color="#666666" style={styles.cardIcon} />
            <Text style={styles.cardTitle} allowFontScaling={false}>Money Manager</Text>
            <Ionicons name="chevron-forward" size={13} color="#007AFF" style={styles.cardChevron} />
            <Text style={[styles.cardDate, { color: '#007AFF' }]} allowFontScaling={false}>{new Date().toLocaleDateString('en-US', { month: 'long', year: '2-digit' })}</Text>
            </View>
            <View style={styles.rightChevronContainer}>
              <Ionicons name="chevron-forward" size={13} color="#007AFF" />
            </View>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardSpacer} />
            <Text style={styles.cardSubtitle} allowFontScaling={false}>Current Balance</Text>
            <Text style={styles.cardAmount} allowFontScaling={false}>
              {loading ? '--' : `₹${currentBalance.toLocaleString()}`}
            </Text>
            <View style={styles.cardRow}>
              <View style={styles.cardLeftSection}>
                <Ionicons name="arrow-up" size={13} color={theme.colors.text} style={[styles.cardIcon, { transform: [{ rotate: '45deg' }] }]} />
                <Text style={styles.cardLeftText} allowFontScaling={false}>Expense</Text>
              </View>
              <View style={styles.cardRightSection}>
                <Ionicons name="arrow-down" size={13} color={theme.colors.text} style={[styles.cardIcon, { transform: [{ rotate: '45deg' }] }]} />
                <Text style={styles.cardRightText} allowFontScaling={false}>Income</Text>
              </View>
            </View>
            <View style={styles.cardRow}>
              <View style={styles.cardLeftColumn}>
                <Text style={styles.cardLeftAmount} allowFontScaling={false}>
                  {loading ? '--' : `₹${totalExpense.toLocaleString()}`}
                </Text>
              </View>
              <View style={styles.cardRightColumn}>
                <Text style={styles.cardRightAmount} allowFontScaling={false}>
                  {loading ? '--' : `₹${totalIncome.toLocaleString()}`}
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
                      {loading ? '--' : `₹${totalCreditCardExpenses.toLocaleString()}`}
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


        {/* Offline Test Panel - Remove this in production */}


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

        {/* AdMob Banner Ad */}
        <View style={styles.adContainer}>
          <BannerAd 
            size="smartBannerPortrait"
            position="inline"
            onAdLoaded={() => {}}
            onAdFailed={(error: any) => {}}
          />
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.quickActionContainer}>
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => {
              // Navigate to Savings Goals screen
              (navigation as any).navigate('MainApp', { screen: 'SavingsGoals' });
            }}
          >
            <Ionicons name="wallet-outline" size={20} color="#FFFFFF" />
            <Text style={styles.quickActionText} allowFontScaling={false}>Savings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: '#2196F3' }]}
            onPress={() => {
              // Navigate to Budget Planning screen
              (navigation as any).navigate('MainApp', { screen: 'BudgetPlanning' });
            }}
          >
            <Ionicons name="pie-chart-outline" size={20} color="#FFFFFF" />
            <Text style={styles.quickActionText} allowFontScaling={false}>Budget</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: '#FF9800' }]}
            onPress={() => {
              // Navigate to Reminders screen
              (navigation as any).navigate('MainApp', { screen: 'Reminders' });
            }}
          >
            <Ionicons name="alarm-outline" size={20} color="#FFFFFF" />
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

        {/* App Quote and Name */}
        <View style={styles.appQuoteContainer}>
          <Text style={styles.appQuote}>
            "Every rupee counts, every decision matters."
          </Text>
        </View>

        {/* Made with Love in INDIA */}
        <View style={styles.madeWithLoveContainer}>
          <Text style={styles.madeWithLoveText}>
            Made with ❤️ in INDIA
          </Text>
          <Text style={styles.madeWithLoveSubtext}>
            MyPaisa Finance Manager
          </Text>
        </View>

        {/* Test Button for Salary Reminder */}
        <TouchableOpacity 
          style={[styles.salaryTestButton, { bottom: Math.max(insets.bottom + 140, 160) }]}
          onPress={testSalaryReminder}
        >
          <Ionicons name="cash-outline" size={20} color="#FFFFFF" />
          <Text style={styles.salaryTestButtonText} allowFontScaling={false}>Test Salary</Text>
        </TouchableOpacity>

        {/* Test Button for Custom Notifications */}
        <TouchableOpacity 
          style={[styles.salaryTestButton, { bottom: Math.max(insets.bottom + 200, 220), right: 20 }]}
          onPress={testCustomNotification}
        >
          <Ionicons name="notifications-outline" size={20} color="#FFFFFF" />
          <Text style={styles.salaryTestButtonText} allowFontScaling={false}>Test Custom</Text>
        </TouchableOpacity>

        {/* Direct Navigation Test Button */}
        <TouchableOpacity 
          style={[styles.salaryTestButton, { bottom: Math.max(insets.bottom + 260, 280), right: 20 }]}
          onPress={testDirectNavigation}
        >
          <Ionicons name="navigate-outline" size={20} color="#FFFFFF" />
          <Text style={styles.salaryTestButtonText} allowFontScaling={false}>Direct Nav</Text>
        </TouchableOpacity>

        {/* Notification Detail Button */}
        <TouchableOpacity 
          style={[styles.salaryTestButton, { bottom: Math.max(insets.bottom + 320, 340), right: 20 }]}
          onPress={() => {
            // Navigate to NotificationDetail screen
            (navigation as any).navigate('MainApp', { 
              screen: 'NotificationDetail',
              params: {
                notificationId: 'sample-notification-1',
                notification: {
                  id: 'sample-notification-1',
                  title: 'Welcome to Expense Tracker!',
                  content: 'This is a sample notification detail screen. You can view detailed information about notifications here. Click the button below to test the link functionality.',
                  type: 'announcement',
                  publishedAt: new Date().toISOString(),
                  author: 'Expense Tracker Team',
                  actionButton: {
                    text: 'Visit Website',
                    url: 'https://www.google.com',
                    action: 'open_url'
                  }
                }
              }
            });
          }}
        >
          <Ionicons name="document-text-outline" size={20} color="#FFFFFF" />
          <Text style={styles.salaryTestButtonText} allowFontScaling={false}>Notifications</Text>
        </TouchableOpacity>

      </ScrollView>


      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.floatingActionButton, { bottom: Math.max(insets.bottom + 70, 90) }]}
        onPress={() => {
          // Navigate to AddTransaction screen in MainStackNavigator
          (navigation as any).navigate('MainApp', { screen: 'AddTransaction' });
        }}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>


    </View>
  );
};

export default HomeScreen; 