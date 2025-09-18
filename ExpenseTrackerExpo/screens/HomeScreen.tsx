import React, { useState, useEffect, useRef } from 'react';
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

import TransactionService from '../services/transactionService';
import AccountService from '../services/AccountService';
import { BannerAd, showInterstitialAd } from '../components/AdMobComponents';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';

const { width } = Dimensions.get('window');

// Helper function to get greeting
const getGreeting = (userName?: string) => {
  return userName ? `Hi ${userName}` : 'Hi User';
};

const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { scrollY } = useScroll();
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

  // Carousel banner state
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const bannerFlatListRef = useRef<FlatList>(null);
  const [banners, setBanners] = useState<any[]>([]);
  
  
  const loadAds = async () => {
    try {
      // Load banners from the public API endpoint
      const response = await fetch('http://192.168.29.14:5001/api/banners/public');
      if (response.ok) {
        const bannerResponse = await response.json();
        if (bannerResponse.success && bannerResponse.data) {
          // Transform banner data to include full image URLs
          const transformedBanners = bannerResponse.data.map((banner: any) => ({
            ...banner,
            imageUrl: banner.image_url 
              ? `http://192.168.29.14:5001${banner.image_url}`
              : null
          }));
          setBanners(transformedBanners);
          setCurrentBannerIndex(0);
        } else {
          throw new Error('Invalid banner response format');
        }
      } else {
        console.log('🔍 HomeScreen: No banners available from API');
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

  // Load transaction data
  const loadTransactionData = async () => {
    try {
      // Only set loading if not already loading
      if (!loading) {
        setLoading(true);
      }
      
      // Debug: Check if TransactionService is defined
      console.log('TransactionService:', TransactionService);
      
      // Load recent transactions
      console.log('About to call getRecentTransactions...');
      const recentTransactionData = await TransactionService.getRecentTransactions(10);
      console.log('getRecentTransactions called successfully');
      console.log('🔍 HomeScreen: Recent transactions data:', recentTransactionData);
      console.log('🔍 HomeScreen: Recent transactions length:', recentTransactionData?.length || 0);
      console.log('🔍 HomeScreen: Transaction IDs:', recentTransactionData?.map(t => ({ id: t.id, title: t.description || t.title })));
      setRecentTransactions(recentTransactionData);
      
      // Load financial summary
      // Create financial summary using available methods
      console.log('About to call getTransactions...');
    const transactions = await TransactionService.getTransactions();
    console.log('getTransactions called successfully');
    const totalIncome = (transactions || [])
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const totalExpenses = (transactions || [])
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
    const currentBalance = totalIncome - totalExpenses;
    
    const financialSummary = {
      currentBalance,
      totalIncome,
      totalExpense: totalExpenses,
      transactionCount: transactions.length
    };
      setCurrentBalance(financialSummary.currentBalance);
      setTotalIncome(financialSummary.totalIncome);
      setTotalExpense(financialSummary.totalExpense);
      
      setLoading(false);
      setIsLoading(false);
      console.log('🔍 HomeScreen: Loading completed, recentTransactions:', recentTransactions);
    } catch (error) {
      console.error('Error loading transaction data:', error);
      setLoading(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Add a small delay to ensure auth token is stored after login
    const timer = setTimeout(() => {
      loadStats();
      loadTransactionData();
      loadAds();
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  // Banner auto-scroll functionality
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentBannerIndex((prevIndex) => {
        if (!banners.length) {
          return 0;
        }
        const nextIndex = (prevIndex + 1) % banners.length;
        if (bannerFlatListRef.current && banners.length > 0) {
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
      // Only reload if not already loading and data is stale
      if (!loading && (!recentTransactions || recentTransactions.length === 0)) {
        console.log('🔍 HomeScreen: Screen focused, reloading data...');
        loadTransactionData();
      } else {
        console.log('🔍 HomeScreen: Screen focused, data already loaded, skipping reload');
      }
    }, [loading, recentTransactions])
  );

  const loadStats = async () => {
    try {
      // Only set loading if not already loading
      if (!isLoading) {
        setIsLoading(true);
      }
      console.log('🔍 HomeScreen: Loading stats from cloud database...');
      
      // Load accounts data
      const accounts = await AccountService.getAccounts();
      console.log('🔍 HomeScreen: Loaded accounts:', accounts.length);
      
      // Load transactions data
      const transactions = await TransactionService.getTransactions();
      console.log('🔍 HomeScreen: Loaded transactions:', transactions.length);
      
      // Calculate real stats from cloud data
      const totalIncome = (transactions || [])
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);
        
      const totalExpenses = (transactions || [])
        .filter(t => t.type === 'expense')
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
      
      console.log('🔍 HomeScreen: Calculated stats:', realStats);
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
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadStats(), loadTransactionData(), loadAds()]);
    setRefreshing(false);
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
      top: 8,
      right: 8,
      backgroundColor: '#FF3B30',
      borderRadius: 10,
      minWidth: 20,
      height: 20,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 4,
    },
    notificationBadgeText: {
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: 'bold',
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
    testAdButton: {
      position: 'absolute',
      right: 20,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FF6B35',
      paddingHorizontal: 16,
      paddingVertical: 12,
      borderRadius: 25,
      shadowColor: '#000000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 5,
    },
    testAdButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '600',
      marginLeft: 8,
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
                navigation.navigate('Notifications' as never);
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
              {recentTransactions.slice(0, 5).map((transaction, index) => (
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
              ))}
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
            onAdLoaded={() => console.log('HomeScreen banner ad loaded')}
            onAdFailed={(error: any) => console.log('HomeScreen banner ad failed:', error)}
          />
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.quickActionContainer}>
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: '#4CAF50' }]}
            onPress={() => {
              // Navigate to Savings screen
              (navigation as any).navigate('MainApp', { screen: 'Savings' });
            }}
          >
            <Ionicons name="wallet-outline" size={20} color="#FFFFFF" />
            <Text style={styles.quickActionText} allowFontScaling={false}>Savings</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: '#2196F3' }]}
            onPress={() => {
              // Navigate to Budget screen
              (navigation as any).navigate('MainApp', { screen: 'Budget' });
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

      </ScrollView>

      {/* Test Ad Button */}
      <TouchableOpacity 
        style={[styles.testAdButton, { bottom: Math.max(insets.bottom + 140, 160) }]}
        onPress={async () => {
          // Show test interstitial ad
          await showInterstitialAd();
        }}
      >
        <Ionicons name="tv-outline" size={20} color="#FFFFFF" />
        <Text style={styles.testAdButtonText} allowFontScaling={false}>Test Ad</Text>
      </TouchableOpacity>

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