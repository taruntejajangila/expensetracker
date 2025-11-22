/**
 * HomeScreen with Sample Data for Figma
 * 
 * This file contains the HomeScreen component with realistic sample data
 * Use this to create mockups in Figma or other design tools
 * 
 * Sample Data Includes:
 * - User name and greeting
 * - Financial summary (balance, income, expenses)
 * - Recent transactions (5-10 items)
 * - Spending categories
 * - Active loans
 * - Smart insights
 * - Banners
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  FlatList,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

// Sample Data
const SAMPLE_USER = {
  name: 'Rajesh Kumar',
  email: 'rajesh.kumar@example.com'
};

const SAMPLE_FINANCIAL_DATA = {
  currentBalance: 125000,
  totalIncome: 85000,
  totalExpense: 45000,
  previousMonthSavings: 85000,
  allTimeIncome: 425000,
  allTimeExpense: 300000,
};

const SAMPLE_RECENT_TRANSACTIONS = [
  {
    id: '1',
    description: 'Grocery Shopping',
    category: 'Groceries',
    amount: '2,500',
    type: 'expense',
    date: new Date(),
    categoryicon: 'cart',
    categorycolor: '#4CAF50',
  },
  {
    id: '2',
    description: 'Salary Credit',
    category: 'Salary',
    amount: '75,000',
    type: 'income',
    date: new Date(Date.now() - 86400000),
    categoryicon: 'wallet',
    categorycolor: '#2196F3',
  },
  {
    id: '3',
    description: 'Uber Ride',
    category: 'Transport',
    amount: '350',
    type: 'expense',
    date: new Date(Date.now() - 172800000),
    categoryicon: 'car',
    categorycolor: '#FF9800',
  },
  {
    id: '4',
    description: 'Restaurant Dinner',
    category: 'Food & Dining',
    amount: '1,200',
    type: 'expense',
    date: new Date(Date.now() - 259200000),
    categoryicon: 'restaurant',
    categorycolor: '#E91E63',
  },
  {
    id: '5',
    description: 'Netflix Subscription',
    category: 'Entertainment',
    amount: '799',
    type: 'expense',
    date: new Date(Date.now() - 345600000),
    categoryicon: 'film',
    categorycolor: '#9C27B0',
  },
];

const SAMPLE_SPENDING_CATEGORIES = [
  {
    category: 'Food & Dining',
    amount: 15000,
    percentage: 33.3,
  },
  {
    category: 'Transport',
    amount: 8000,
    percentage: 17.8,
  },
  {
    category: 'Shopping',
    amount: 12000,
    percentage: 26.7,
  },
];

const SAMPLE_ACTIVE_LOANS = [
  {
    id: '1',
    name: 'Home Loan',
    remainingBalance: 2500000,
    monthlyPayment: 35000,
  },
  {
    id: '2',
    name: 'Car Loan',
    remainingBalance: 450000,
    monthlyPayment: 12000,
  },
];

const SAMPLE_SMART_INSIGHTS = [
  {
    type: 'Savings Champion',
    icon: 'trophy',
    message: 'Amazing! You\'re saving 47.1% of your income this month.',
    color: '#2196F3',
    action: 'view_goals',
  },
  {
    type: 'Pro Tip',
    icon: 'star',
    message: 'Track small expenses too - they add up quickly!',
    color: '#795548',
    action: null,
  },
  {
    type: 'Month Progress',
    icon: 'calendar',
    message: '15 days left this month. Time to review your budget!',
    color: '#607D8B',
    action: 'view_budget',
  },
];

const SAMPLE_BANNERS = [
  {
    id: '1',
    title: 'Special Offer',
    subtitle: 'Get 20% off on premium features',
    imageUrl: null,
    textColor: '#333333',
  },
];

// Helper functions
const getGreeting = (userName?: string) => {
  return userName ? `Hi ${userName} 😉` : 'Hi User 😉';
};

const getTimeBasedSubtitle = (): string => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return "Start your day with smart financial planning ☀️";
  } else if (hour >= 12 && hour < 17) {
    return "Keep tracking your expenses 📊";
  } else if (hour >= 17 && hour < 21) {
    return "Review your spending today 🌙";
  } else {
    return "Plan for tomorrow 💤";
  }
};

const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString('en-IN')}`;
};

const formatTransactionDate = (date: Date) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const transactionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  const timeString = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });

  if (transactionDate.getTime() === today.getTime()) {
    return `Today, ${timeString}`;
  } else if (transactionDate.getTime() === yesterday.getTime()) {
    return `Yesterday, ${timeString}`;
  } else {
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    }) + `, ${timeString}`;
  }
};

const getCategoryIcon = (category: string) => {
  const iconMap: { [key: string]: string } = {
    'Food & Dining': '🍕',
    'Food': '🍕',
    'Groceries & Vegetables': '🛒',
    'Groceries': '🛒',
    'Transport': '🚗',
    'Transportation': '🚗',
    'Bills & Utilities': '💡',
    'Shopping': '🛍️',
    'Entertainment': '🎬',
  };
  return iconMap[category] || '📦';
};

// Theme (simplified for Figma)
const theme = {
  colors: {
    background: '#FFFFFF',
    text: '#111827',
    textSecondary: '#6B7280',
    primary: '#007AFF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 24,
  },
  borderRadius: {
    lg: 16,
  },
};

const HomeScreenFigma: React.FC = () => {
  const insets = useSafeAreaInsets();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [currentInsightIndex, setCurrentInsightIndex] = useState(0);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
    },
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
      color: theme.colors.text,
    },
    subtitleText: {
      fontSize: 12,
      fontWeight: '400',
      opacity: 0.8,
      color: theme.colors.textSecondary,
    },
    notificationButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
    },
    scrollContent: {
      paddingHorizontal: theme.spacing.md,
      paddingTop: 0,
      paddingBottom: 150,
    },
    featuredCard: {
      backgroundColor: '#FFFFFF',
      borderRadius: theme.borderRadius.lg,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.md,
      marginTop: theme.spacing.sm,
      marginBottom: theme.spacing.lg - 6,
      borderWidth: 1,
      borderColor: '#E0E0E0',
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
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
      shadowOffset: { width: 0, height: 2 },
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
    floatingCardsContainer: {
      marginBottom: theme.spacing.sm,
      marginHorizontal: -theme.spacing.md,
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
      shadowOffset: { width: 0, height: 2 },
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
      marginLeft: theme.spacing.lg,
      paddingRight: theme.spacing.xs,
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
      shadowOffset: { width: 0, height: 2 },
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
      shadowOffset: { width: 0, height: 2 },
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
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    insightsCardContent: {
      padding: 0,
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
      marginLeft: theme.spacing.xs,
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
      marginLeft: theme.spacing.xs,
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
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    spendingCategoriesContent: {
      padding: 0,
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
      shadowOffset: { width: 0, height: 2 },
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
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
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
      color: '#999999',
      textAlign: 'center',
      fontStyle: 'italic',
      fontWeight: '500',
      lineHeight: 28,
      marginBottom: theme.spacing.sm,
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
      color: '#333333',
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
  });

  const headerPaddingTop = Platform.OS === 'android' ? insets.top + 5 : insets.top + 10;

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 0 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.headerContainer, { paddingTop: headerPaddingTop, backgroundColor: theme.colors.background }]}>
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <TouchableOpacity style={styles.menuButton}>
                <Ionicons name="menu" size={24} color={theme.colors.text} />
              </TouchableOpacity>
              <View style={styles.greetingContainer}>
                <Text style={styles.greetingText}>
                  {getGreeting(SAMPLE_USER.name)}
                </Text>
                <Text style={styles.subtitleText}>
                  {getTimeBasedSubtitle()}
                </Text>
              </View>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity style={styles.notificationButton}>
                <Ionicons name="notifications-outline" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Money Manager Card */}
        <TouchableOpacity style={styles.featuredCard}>
          <View style={styles.cardHeader}>
            <View style={styles.leftSection}>
              <Ionicons name="stats-chart" size={12} color="#666666" style={styles.cardIcon} />
              <Text style={styles.cardTitle}>Money Manager</Text>
              <Ionicons name="chevron-forward" size={12} color="#007AFF" style={styles.cardChevron} />
              <Text style={[styles.cardDate, { color: '#007AFF' }]}>
                {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </Text>
            </View>
            <View style={styles.rightChevronContainer}>
              <Ionicons name="chevron-forward" size={12} color="#007AFF" />
            </View>
          </View>
          <View style={styles.cardContent}>
            <View style={styles.cardSpacer} />
            <Text style={styles.cardSubtitle}>Current Balance</Text>
            <Text style={styles.cardAmount}>
              {formatCurrency(SAMPLE_FINANCIAL_DATA.currentBalance)}
            </Text>
            <Text style={styles.cardDescription}>
              Including previous months savings
            </Text>
            <View style={styles.cardRow}>
              <View style={styles.cardLeftSection}>
                <Ionicons name="arrow-up" size={12} color={theme.colors.text} style={[styles.cardIcon, { transform: [{ rotate: '45deg' }] }]} />
                <Text style={styles.cardLeftText}>Expense</Text>
              </View>
              <View style={styles.cardRightSection}>
                <Ionicons name="arrow-down" size={12} color={theme.colors.text} style={[styles.cardIcon, { transform: [{ rotate: '45deg' }] }]} />
                <Text style={styles.cardRightText}>Income</Text>
              </View>
            </View>
            <View style={styles.cardRow}>
              <View style={styles.cardLeftColumn}>
                <Text style={styles.cardLeftAmount}>
                  {formatCurrency(SAMPLE_FINANCIAL_DATA.totalExpense)}
                </Text>
              </View>
              <View style={styles.cardRightColumn}>
                <Text style={styles.cardRightAmount}>
                  {formatCurrency(SAMPLE_FINANCIAL_DATA.totalIncome)}
                </Text>
                <Text style={styles.cardRightSubtext}>
                  ({formatCurrency(SAMPLE_FINANCIAL_DATA.totalIncome - SAMPLE_FINANCIAL_DATA.previousMonthSavings)} this month + {formatCurrency(SAMPLE_FINANCIAL_DATA.previousMonthSavings)} previous savings)
                </Text>
              </View>
            </View>
            <View style={styles.cardBottomSpacer} />
          </View>
        </TouchableOpacity>

        {/* Recent Transactions */}
        <View style={styles.floatingCardsContainer}>
          <Text style={styles.floatingCardsTitle}>Recent Transactions</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.floatingCardsList}
          >
            {SAMPLE_RECENT_TRANSACTIONS.map((transaction) => (
              <TouchableOpacity 
                key={transaction.id} 
                style={styles.floatingCard}
              >
                <View style={styles.floatingCardContent}>
                  <View style={styles.floatingCardHeader}>
                    <View style={styles.floatingCardHeaderLeft}>
                      <View style={[styles.floatingCardIcon, { backgroundColor: transaction.categorycolor || '#6B7280' }]}>
                        <Ionicons name={transaction.categoryicon as any || 'receipt'} size={18} color="#FFFFFF" />
                      </View>
                    </View>
                    <View style={styles.floatingCardHeaderRight}>
                      <Text style={styles.floatingCardTitle} numberOfLines={1}>
                        {transaction.description}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.floatingCardBody}>
                    <View style={styles.floatingCardCategorySection}>
                      <Text style={styles.floatingCardCategory} numberOfLines={1}>
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
                      <Text style={[styles.floatingCardAmount, { color: transaction.type === 'expense' ? '#FF3B30' : '#34C759' }]} numberOfLines={1}>
                        ₹{transaction.amount}
                      </Text>
                    </View>
                    <View style={styles.floatingCardDivider} />
                    <Text style={styles.floatingCardDate} numberOfLines={1}>
                      {formatTransactionDate(transaction.date)}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.viewAllCard}>
              <View style={styles.viewAllCardContent}>
                <View style={styles.viewAllCardHeader}>
                  <View style={styles.viewAllCardHeaderLeft}>
                    <View style={styles.viewAllCardIcon}>
                      <Ionicons name="document-text" size={18} color="#007AFF" />
                    </View>
                  </View>
                  <View style={styles.viewAllCardHeaderRight}>
                    <Text style={styles.viewAllCardTitle} numberOfLines={2}>
                      View All{'\n'}Transactions
                    </Text>
                  </View>
                </View>
                <View style={styles.viewAllCardBody}>
                  <View style={styles.viewAllCardSpacer} />
                </View>
                <View style={styles.viewAllCardBottom}>
                  <View style={styles.viewAllCardBottomSpacer} />
                  <Text style={styles.viewAllCardHistory} numberOfLines={1}>
                    View your full history
                  </Text>
                  <View style={styles.viewAllCardDivider} />
                  <Text style={styles.viewAllCardAction} numberOfLines={1}>
                    → Tap to View
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Quick Action Buttons */}
        <View style={styles.quickActionContainer}>
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: '#4CAF50' }]}
          >
            <Ionicons name="wallet-outline" size={18} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Savings</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: '#2196F3' }]}
          >
            <Ionicons name="pie-chart-outline" size={18} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Budget</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.quickActionButton, { backgroundColor: '#FF9800' }]}
          >
            <Ionicons name="alarm-outline" size={18} color="#FFFFFF" />
            <Text style={styles.quickActionText}>Remind</Text>
          </TouchableOpacity>
        </View>

        {/* Smart Insights */}
        <View style={styles.smartInsightsCard}>
          <View style={styles.insightsCardContent}>
            <View style={styles.insightsHeader}>
              <View style={styles.insightsIconContainer}>
                <Ionicons name="bulb" size={19} color="#FF9500" />
              </View>
              <View style={styles.insightsTitleContainer}>
                <Text style={styles.insightsTitleText}>Smart Insights</Text>
                <Text style={styles.insightsSubtitleText}>
                  Personalized financial tips
                </Text>
              </View>
            </View>
            {SAMPLE_SMART_INSIGHTS.map((insight, index) => (
              <TouchableOpacity 
                key={index} 
                style={styles.insightListItem}
                activeOpacity={0.8}
              >
                <View style={styles.insightItemContent}>
                  <View style={[styles.insightItemIcon, { backgroundColor: insight.color }]}>
                    <Ionicons name={insight.icon as any} size={17} color="#FFFFFF" />
                  </View>
                  <View style={styles.insightItemTextContainer}>
                    <Text style={styles.insightItemType}>{insight.type}</Text>
                    <Text style={styles.insightItemMessage} numberOfLines={2}>
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

        {/* Spending Categories */}
        <TouchableOpacity style={styles.spendingCategoriesCard} activeOpacity={0.7}>
          <View style={styles.spendingCategoriesContent}>
            <View style={styles.spendingCategoriesHeader}>
              <View style={styles.spendingCategoriesIconContainer}>
                <Ionicons name="pie-chart" size={19} color="#34C759" />
              </View>
              <View style={styles.spendingCategoriesTitleContainer}>
                <Text style={styles.spendingCategoriesTitleText}>Top Spending Categories</Text>
                <Text style={styles.spendingCategoriesSubtitleText}>
                  This month's highest expenses
                </Text>
              </View>
              <View style={styles.spendingCategoriesChevron}>
                <Ionicons name="chevron-forward" size={15} color="#34C759" />
              </View>
            </View>
            {SAMPLE_SPENDING_CATEGORIES.map((category, index) => (
              <View key={index} style={styles.spendingCategoryItem}>
                <View style={styles.spendingCategoryContent}>
                  <View style={styles.spendingCategoryIcon}>
                    <Text style={styles.spendingCategoryEmoji}>
                      {getCategoryIcon(category.category)}
                    </Text>
                  </View>
                  <View style={styles.spendingCategoryTextContainer}>
                    <Text style={styles.spendingCategoryName}>
                      {category.category}
                    </Text>
                    <Text style={styles.spendingCategoryAmount}>
                      {formatCurrency(category.amount)}
                    </Text>
                  </View>
                  <View style={styles.spendingCategoryPercentageContainer}>
                    <Text style={styles.spendingCategoryPercentage}>
                      {category.percentage.toFixed(0)}%
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </TouchableOpacity>

        {/* Active Loans */}
        <TouchableOpacity style={styles.activeLoansCard} activeOpacity={0.7}>
          <View style={styles.activeLoansContent}>
            <View style={styles.activeLoansHeader}>
              <View style={styles.activeLoansIconContainer}>
                <Ionicons name="card" size={20} color="#007AFF" />
              </View>
              <View style={styles.activeLoansTitleContainer}>
                <Text style={styles.activeLoansTitleText}>Active Loans</Text>
                <Text style={styles.activeLoansSubtitleText}>
                  {SAMPLE_ACTIVE_LOANS.length} loan{SAMPLE_ACTIVE_LOANS.length > 1 ? 's' : ''} • Next payment: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>
              <View style={styles.activeLoansChevron}>
                <Ionicons name="chevron-forward" size={16} color="#007AFF" />
              </View>
            </View>
            <View style={styles.loanStatsContainer}>
              <View style={styles.loanStatCard}>
                <View style={styles.loanStatIcon}>
                  <Ionicons name="wallet" size={16} color="#34C759" />
                </View>
                <View style={styles.loanStatContent}>
                  <Text style={styles.loanStatLabel}>Outstanding</Text>
                  <Text style={styles.loanStatValue}>
                    {formatCurrency(SAMPLE_ACTIVE_LOANS.reduce((sum, loan) => sum + loan.remainingBalance, 0))}
                  </Text>
                </View>
              </View>
              <View style={styles.loanStatCard}>
                <View style={styles.loanStatIcon}>
                  <Ionicons name="calendar" size={16} color="#FF9500" />
                </View>
                <View style={styles.loanStatContent}>
                  <Text style={styles.loanStatLabel}>Monthly</Text>
                  <Text style={styles.loanStatValue}>
                    {formatCurrency(SAMPLE_ACTIVE_LOANS.reduce((sum, loan) => sum + loan.monthlyPayment, 0))}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* App Quote */}
        <View style={styles.appQuoteContainer}>
          <Text style={styles.appQuote}>
            "Every rupee counts, every decision matters."
          </Text>
        </View>

        {/* Made with Love */}
        <View style={styles.madeWithLoveContainer}>
          <Text style={styles.madeWithLoveText}>
            Made with ❤️ in INDIA
          </Text>
          <Text style={styles.madeWithLoveSubtext}>
            PaysaGo Finance Manager
          </Text>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.floatingActionButton, { bottom: Math.max(insets.bottom + 70, 90) }]}
      >
        <Ionicons name="add" size={28} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreenFigma;

