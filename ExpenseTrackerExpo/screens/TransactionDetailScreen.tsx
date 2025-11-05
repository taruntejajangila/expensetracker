import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  RefreshControl,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp, useFocusEffect, CommonActions } from '@react-navigation/native';
import TransactionService, { Transaction } from '../services/transactionService';
import { BannerAdComponent } from '../components/AdMobComponents';

type TransactionDetailRouteProp = RouteProp<{
  TransactionDetail: { transactionId: string };
}, 'TransactionDetail'>;

// Helper function to get correct icon name for Ionicons
const getCorrectIconName = (iconName: string, categoryName?: string): string => {
  // If no icon name, try to get icon based on category
  if (!iconName || iconName === 'undefined' || iconName === 'null') {
    const categoryIconMap: { [key: string]: string } = {
      // Income Categories (matching database names)
      'Salary': 'cash-outline',
      'Freelance': 'briefcase-outline',
      'Investment': 'trending-up-outline',
      'Other Income': 'add-circle-outline',
      
      // Expense Categories (matching database names)
      'Food & Dining': 'restaurant-outline',
      'Transportation': 'car-outline',
      'Shopping': 'bag-outline',
      'Entertainment': 'film-outline',
      'Bills & Utilities': 'document-text-outline',
      'Healthcare': 'heart-outline',
      'Education': 'book-outline',
      'Travel': 'airplane-outline',
      
      // Legacy mappings for backward compatibility
      'Groceries': 'cart-outline',
      'Dining Out/Food Delivery': 'restaurant-outline',
      'Utilities': 'flash-outline',
      'Rent': 'home-outline',
      'Travel/Vacation': 'airplane-outline',
      'Loan/Debt Payments': 'card-outline',
      'Health': 'medical-outline',
      'Savings & Investment': 'trending-up-outline',
      'Family & Child': 'people-outline',
      'Investments': 'trending-up-outline',
      
      // Transfer Categories
      'Transfer': 'swap-vertical-outline',
      'Account Transfer': 'card-outline',
      'Money Transfer': 'send-outline',
    };
    
    return categoryIconMap[categoryName || ''] || 'receipt-outline';
  }
  
  const iconMap: { [key: string]: string } = {
    // Common mappings
    'cash': 'cash-outline',
    'laptop': 'laptop-outline',
    'trending-up': 'trending-up-outline',
    'restaurant': 'restaurant-outline',
    'car': 'car-outline',
    'bag': 'bag-outline',
    'film': 'film-outline',
    'receipt': 'receipt-outline',
    'medical': 'medical-outline',
    'school': 'school-outline',
    'home': 'home-outline',
    'briefcase': 'briefcase-outline',
    'gift': 'gift-outline',
    'plus-circle': 'add-circle-outline',
    'cart': 'cart-outline',
    'flash': 'flash-outline',
    'airplane': 'airplane-outline',
    'card': 'card-outline',
    'people': 'people-outline',
    'ellipsis-horizontal': 'ellipsis-horizontal-outline',
  };
  
  return iconMap[iconName] || iconName || 'receipt-outline';
};

// Helper function to format date with time
const formatDateWithTime = (dateString: string | Date): string => {
  // Handle undefined or null
  if (!dateString) {
    return 'Invalid Date';
  }
  
  // Parse date from ISO string with timezone info
  // Backend sends: "2025-10-27T09:51:47.123Z" which includes timezone
  let date: Date;
  if (typeof dateString === 'string') {
    // Use new Date() which correctly handles ISO strings with timezone
    date = new Date(dateString);
  } else {
    date = dateString;
  }
  
  // Validate date
  if (isNaN(date.getTime())) {
    return 'Invalid Date';
  }
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec'];
  
  const dayName = days[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear().toString().slice(-2);
  
  // Format time
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const timeString = `${hours}:${minutes} ${ampm}`;
  
  // Add ordinal suffix to day
  const getOrdinalSuffix = (day: number): string => {
    if (day >= 11 && day <= 13) {
      return day + 'th';
    }
    switch (day % 10) {
      case 1: return day + 'st';
      case 2: return day + 'nd';
      case 3: return day + 'rd';
      default: return day + 'th';
    }
  };
  
  // Return date WITH time
  return `${dayName}, ${getOrdinalSuffix(day)} ${month} '${year}, ${timeString}`;
};

// Helper function to get bank logo
const getBankLogo = (bankName: string): any => {
  if (!bankName) return null;
  const normalizedName = bankName.toLowerCase().trim();
  const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const containsWord = (haystack: string, needle: string) => {
    const re = new RegExp(`(^|\\b)${escapeRegex(needle)}(\\b|$)`);
    return re.test(haystack);
  };
  
  // Bank slug mapping based on directory structure
  const bankSlugMap: { [key: string]: string } = {
    'hdfc': 'hdfc',
    'icici': 'icic', 
    'sbi': 'sbin',
    'state bank of india': 'sbin',
    'state bank': 'sbin',
    'axis': 'utib',
    'kotak': 'kkbk',
    'pnb': 'punb',
    'bank of baroda': 'barb',
    'canara': 'cnrb',
    'union bank': 'ubin',
    'indian bank': 'idib',
    'central bank': 'cbin',
    'bank of india': 'bkid',
    'maharashtra': 'mahb',
    'punjab and sind': 'psib',
    'indian overseas': 'ioba',
    'jammu and kashmir': 'jaka',
    'karnataka': 'karb',
    'karur vysya': 'kvbl',
    'south indian': 'sibl',
    'tamilnad mercantile': 'tmbl',
    'uco': 'ucba',
    'yes bank': 'yesb',
    'rbl': 'ratn',
    'indusind': 'indb',
    'idfc': 'idfb',
    'idbi': 'ibkl',
    'federal': 'fdrl',
    'dcb': 'dcbl',
    'csb': 'csbk',
    'dhanalakshmi': 'dlxb',
    'city union': 'ciub',
    'bandhan': 'bdbl',
    'au small finance': 'aubl',
    'ujjivan': 'ujvn',
    'nainital': 'ntbl',
    'airtel payments': 'airp',
    'jio payments': 'jiop',
    'paytm payments': 'pytm',
    'standard chartered': 'scbl'
  };

  // Get all bank keys
  const bankKeys = Object.keys(bankSlugMap);
  
  // Priority 1: Exact match (case-insensitive)
  const exactMatch = bankKeys.find(key => 
    normalizedName === key.toLowerCase()
  );
  if (exactMatch) {
    const bankSlug = bankSlugMap[exactMatch];
    return getLogoBySlug(bankSlug);
  }
  
  // Priority 2: Full name contains key as word (sorted by length for more specific matches)
  const sortedKeys = bankKeys.sort((a, b) => b.length - a.length);
  const fullMatch = sortedKeys.find(key =>
    containsWord(normalizedName, key.toLowerCase()) ||
    containsWord(key.toLowerCase(), normalizedName)
  );
  if (fullMatch) {
    const bankSlug = bankSlugMap[fullMatch];
    return getLogoBySlug(bankSlug);
  }
  
  // Priority 3: Explicit acronym map
  const acronymSlugMap: { [key: string]: string } = {
    'hdfc': 'hdfc','sbi':'sbin','axis':'utib','icici':'icic','kotak':'kkbk','pnb':'punb','bob':'barb','uco':'ucba','rbl':'ratn','idfc':'idfb','idbi':'ibkl','federal':'fdrl','dcb':'dcbl','csb':'csbk','bandhan':'bdbl','au':'aubl','jio':'jiop','paytm':'pytm','standard chartered':'scbl'
  };
  const acroKeys = Object.keys(acronymSlugMap).sort((a,b)=> b.length-a.length);
  const acro = acroKeys.find(k => containsWord(normalizedName, k));
  if (acro) {
    const bankSlug = acronymSlugMap[acro];
    return getLogoBySlug(bankSlug);
  }
  
  return null;
};

// Helper function to get logo by slug
const getLogoBySlug = (bankSlug: string): any => {
  if (!bankSlug) return null;

  // Return the corresponding logo - using only folders with non-empty files
  const bankLogoMap: { [key: string]: any } = {
    'hdfc': require('../assets/bank-logos/hdfc/symbol.png'),
    'icic': require('../assets/bank-logos/icic/symbol.png'),
    'sbin': require('../assets/bank-logos/sbin/symbol.png'),
    'utib': require('../assets/bank-logos/utib/symbol.png'),
    'kkbk': require('../assets/bank-logos/kkbk/symbol.png'),
    'punb': require('../assets/bank-logos/punb/symbol.png'),
    'barb': require('../assets/bank-logos/barb/symbol.png'),
    'cnrb': require('../assets/bank-logos/cnrb/symbol.png'),
    'ubin': require('../assets/bank-logos/ubin/symbol.png'),
    'idib': require('../assets/bank-logos/idib/symbol.png'),
    'cbin': require('../assets/bank-logos/cbin/symbol.png'),
    'bkid': require('../assets/bank-logos/bkid/symbol.png'),
    'mahb': require('../assets/bank-logos/mahb/symbol.png'),
    'psib': require('../assets/bank-logos/psib/symbol.png'),
    'ioba': require('../assets/bank-logos/ioba/symbol.png'),
    'jaka': require('../assets/bank-logos/jaka/symbol.png'),
    'karb': require('../assets/bank-logos/karb/symbol.png'),
    'kvbl': require('../assets/bank-logos/kvbl/symbol.png'),
    'sibl': require('../assets/bank-logos/sibl/symbol.png'),
    'tmbl': require('../assets/bank-logos/tmbl/symbol.png'),
    'ucba': require('../assets/bank-logos/ucba/symbol.png'),
    'yesb': require('../assets/bank-logos/yesb/symbol.png'),
    'ratn': require('../assets/bank-logos/ratn/symbol.png'),
    'indb': require('../assets/bank-logos/indb/symbol.png'),
    'idfb': require('../assets/bank-logos/idfb/symbol.png'),
    'ibkl': require('../assets/bank-logos/ibkl/symbol.png'),
    'fdrl': require('../assets/bank-logos/fdrl/symbol.png'),
    'dcbl': require('../assets/bank-logos/dcbl/symbol.png'),
    'csbk': require('../assets/bank-logos/csbk/symbol.png'),
    'dlxb': require('../assets/bank-logos/dlxb/symbol.png'),
    'ciub': require('../assets/bank-logos/ciub/symbol.png'),
    'bdbl': require('../assets/bank-logos/bdbl/symbol.png'),
    'aubl': require('../assets/bank-logos/aubl/symbol.png'),
    'ujvn': require('../assets/bank-logos/ujvn/symbol.png'),
    'ntbl': require('../assets/bank-logos/ntbl/symbol.png'),
    'airp': require('../assets/bank-logos/airp/symbol.png'),
    'jiop': require('../assets/bank-logos/jiop/symbol.png'),
    'pytm': require('../assets/bank-logos/pytm/symbol.png'),
    'scbl': require('../assets/bank-logos/scbl/symbol.png')
  };

  return bankLogoMap[bankSlug] || null;
};

// Helper function to get category image
const getCategoryImage = (categoryName: string, transactionType: 'income' | 'expense' | 'transfer'): any => {
  const imageMap: { [key: string]: any } = {
    // Income Categories (matching database names)
    'Salary': require('../assets/images/categories/income/income_salary_office.png'),
    'Freelance': require('../assets/images/categories/income/income_freelance_laptop.png'),
    'Investment': require('../assets/images/categories/income/income_other_general.png'),
    'Other Income': require('../assets/images/categories/income/income_other_general.png'),
    'Bonus': require('../assets/images/categories/income/income_bonus_trophy.png'),
    'Interest Income': require('../assets/images/categories/income/income_interest_bank.png'),
    'Part Time Income': require('../assets/images/categories/income/income_part_time_clock.png'),
    
    // Expense Categories (matching database names)
    'Food & Dining': require('../assets/images/categories/expense/expense_dining_restaurant.png'),
    'Transportation': require('../assets/images/categories/expense/expense_transportation_car.png'),
    'Shopping': require('../assets/images/categories/expense/expense_shopping_bags.png'),
    'Entertainment': require('../assets/images/categories/expense/expense_entertainment_movies.png'),
    'Bills & Utilities': require('../assets/images/categories/expense/expense_utilities_electricity.png'),
    'Healthcare': require('../assets/images/categories/expense/expense_health_medical.png'),
    'Education': require('../assets/images/categories/expense/expense_education_school.png'),
    'Travel': require('../assets/images/categories/expense/expense_travel_airplane.png'),
    'Subscription': require('../assets/images/categories/expense/expense_subscription_card.png'),
    'Gifts & Donations': require('../assets/images/categories/expense/expense_gifts_donations.png'),
    'Gas/Fuel': require('../assets/images/categories/expense/expense_gas_fuel.png'),
    'EMI/Loan Payment': require('../assets/images/categories/expense/expense_emi_loan_payment.png'),
    
    // Legacy mappings for backward compatibility
    'Groceries': require('../assets/images/categories/expense/expense_groceries_cart.png'),
    'Dining Out/Food Delivery': require('../assets/images/categories/expense/expense_dining_restaurant.png'),
    'Utilities': require('../assets/images/categories/expense/expense_utilities_electricity.png'),
    'Rent': require('../assets/images/categories/expense/expense_rent_house.png'),
    'Travel/Vacation': require('../assets/images/categories/expense/expense_travel_airplane.png'),
    'Loan/Debt Payments': require('../assets/images/categories/expense/expense_loan_credit_card.png'),
    'Health': require('../assets/images/categories/expense/expense_health_medical.png'),
    'Savings & Investment': require('../assets/images/categories/expense/expense_savings_piggy_bank.png'),
    'Family & Child': require('../assets/images/categories/expense/expense_family_children.png'),
    'Investments': require('../assets/images/categories/expense/expense_savings_piggy_bank.png'),
    
    // Transfer Categories
    'Transfer': require('../assets/images/categories/transfer/transfer_balance_arrow.png'),
    'Account Transfer': require('../assets/images/categories/transfer/transfer_balance_arrow.png'),
    'Money Transfer': require('../assets/images/categories/transfer/transfer_balance_arrow.png'),
    'Balance Transfer': require('../assets/images/categories/transfer/transfer_balance_arrow.png'),
  };

  return imageMap[categoryName] || null;
};

const TransactionDetailScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<TransactionDetailRouteProp>();
  const { transactionId } = route.params;

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    (async () => {
      await TransactionService.backfillAccountIds();
      loadTransactionDetail();
    })();
  }, [transactionId]);

  // Reload data when screen comes into focus (after editing)
  useFocusEffect(
    React.useCallback(() => {
      loadTransactionDetail();
    }, [transactionId])
  );

  const loadTransactionDetail = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      const allTransactions = await TransactionService.getTransactions();
      console.log('🔍 TransactionDetailScreen: All transactions:', allTransactions.length);
      console.log('🔍 TransactionDetailScreen: Looking for transactionId:', transactionId);
      
      const foundTransaction = allTransactions.find(t => t.id === transactionId);
      console.log('🔍 TransactionDetailScreen: Found transaction:', foundTransaction);
      
      if (foundTransaction) {
        // Ensure amount is a number
        if (typeof foundTransaction.amount === 'string') {
          foundTransaction.amount = parseFloat(foundTransaction.amount);
        }
        if (typeof foundTransaction.amount !== 'number' || isNaN(foundTransaction.amount)) {
          foundTransaction.amount = 0;
        }
        
        // Ensure date is a Date object
        if (typeof foundTransaction.date === 'string') {
          foundTransaction.date = new Date(foundTransaction.date);
        }
        if (!(foundTransaction.date instanceof Date) || isNaN(foundTransaction.date.getTime())) {
          foundTransaction.date = new Date(); // Fallback to current date
        }
        
        console.log('🔍 TransactionDetailScreen: Processed transaction amount:', foundTransaction.amount);
        console.log('🔍 TransactionDetailScreen: Processed transaction date:', foundTransaction.date);
      }
      
      setTransaction(foundTransaction || null);
      
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading transaction detail:', error);
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const onRefresh = () => {
    loadTransactionDetail(true);
  };

  const handleEdit = () => {
    if (transaction) {
      // Navigate to edit screen (AddTransactionScreen with edit mode)
      // Both TransactionDetail and AddTransaction are in the same Stack Navigator
      (navigation as any).navigate('AddTransaction', {
        transaction,
        isEdit: true
      });
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Transaction',
      'Are you sure you want to delete this transaction? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      if (transaction) {
        await TransactionService.deleteTransaction(transaction.id);
        Alert.alert(
          'Success',
          'Transaction deleted successfully.',
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error deleting transaction:', error);
      Alert.alert('Error', 'Failed to delete transaction. Please try again.');
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getRelativeDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const transactionDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (transactionDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (transactionDate.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else {
      const diffTime = today.getTime() - transactionDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays < 7) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else {
        return formatDate(date);
      }
    }
  };

  // Header Component - Matching other screens
  const ScreenHeader: React.FC<{ theme: any; insets: any }> = ({ theme, insets }) => {
    const headerPaddingTop = Platform.OS === 'android' ? insets.top + 5 : insets.top + 10;
    
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
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]} allowFontScaling={false}>
              Transaction Details
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              View transaction information
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.menuButton}
              onPress={() => setShowMenu(!showMenu)}
            >
              <Ionicons name="ellipsis-vertical" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    content: {
      flex: 1,
      paddingTop: 10,
      paddingHorizontal: 20,
      paddingBottom: 20,
    },
    
    // Header Styles - Matching other screens
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
    },
    headerRight: {
      minWidth: 60,
      alignItems: 'center',
    },
    backButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    menuButton: {
      width: 40,
      height: 40,
      justifyContent: 'center',
      alignItems: 'center',
    },
    dropdownMenu: {
      position: 'absolute',
      top: 90,
      right: 16,
      width: 140,
      borderRadius: 12,
      borderWidth: 1,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 8,
      zIndex: 1000,
    },
    menuItem: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    menuItemText: {
      fontSize: 16,
      fontWeight: '500',
      marginLeft: 12,
    },
    menuDivider: {
      height: 1,
      marginHorizontal: 16,
    },
    menuOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 999,
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
    },
    errorContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    errorText: {
      fontSize: theme.fontSize.lg,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      marginTop: 16,
    },
    
    // Transaction Details
    transactionHeader: {
      alignItems: 'center',
      marginBottom: 30,
      paddingTop: 5,
      paddingBottom: 20,
    },
    categoryIcon: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 16,
    },
    imageContainer: {
      position: 'relative',
      marginBottom: 16,
    },
    imageCard: {
      width: 420,
      height: 80,
      backgroundColor: '#A55B4B',
      borderRadius: 24,
      padding: 16,
      marginBottom: 8,
      alignSelf: 'center',
      borderWidth: 1,
      borderColor: '#FED7AA',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    adContainer: {
      width: 420,
      alignSelf: 'center',
      alignItems: 'center',
      paddingVertical: 4,
      marginBottom: 8,
      backgroundColor: 'transparent',
    },
    notesCard: {
      width: 420,
      minHeight: 120,
      backgroundColor: '#E8988A',
      borderRadius: 24,
      padding: 16,
      marginBottom: 0,
      alignSelf: 'center',
      borderWidth: 1,
      borderColor: '#E5E5E5',
      justifyContent: 'flex-start',
      alignItems: 'flex-start',
    },
    notesHeaderContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 4,
      marginLeft: 8,
    },
    notesHeader: {
      fontSize: theme.fontSize.sm - 2,
      fontWeight: '700',
      color: theme.colors.text,
      marginLeft: 6,
    },
    notesContentContainer: {
      flex: 1,
      paddingHorizontal: 8,
      paddingTop: 8,
      paddingBottom: 8,
      minHeight: 60,
    },
    notesContent: {
      fontSize: theme.fontSize.sm,
      color: theme.colors.text,
      fontWeight: '400',
      lineHeight: 22,
      opacity: 0.8,
      flexWrap: 'wrap',
      textAlign: 'left',
    },
    bankAccountSection: {
      flex: 1,
    },
    bankAccountInfo: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    bankLogo: {
      width: 22,
      height: 22,
      marginRight: 8,
    },
    bankLogoFallback: {
      width: 24,
      height: 24,
      marginRight: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    bankAccountName: {
      fontSize: theme.fontSize.md - 2,
      fontWeight: '600',
      color: '#FFFFFF',
    },
    transferAccountSection: {
      flex: 1,
    },
    transferAccountRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    transferAccountInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
    },
    transferAccountIcon: {
      width: 20,
      height: 20,
      marginRight: 6,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderRadius: 10,
    },
    transferAccountText: {
      fontSize: theme.fontSize.sm,
      fontWeight: '600',
      color: '#FFFFFF',
      flex: 1,
    },
    transferArrow: {
      marginHorizontal: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    transactionTypeSection: {
      alignItems: 'flex-end',
    },
    transactionTypeLabel: {
      fontSize: theme.fontSize.sm - 2,
      fontWeight: '700',
      color: '#FFFFFF',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    categoryImage: {
      width: 420,
      height: 360,
      borderRadius: 36,
      borderWidth: 5,
      borderColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.25,
      shadowRadius: 20,
      elevation: 12,
    },
    imageOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
      borderRadius: 42,
      borderWidth: 6,
      borderColor: '#FFFFFF',
    },
    amountOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: 'center',
      alignItems: 'center',
    },
    transactionTitleOverlay: {
      position: 'absolute',
      top: 24,
      left: 24,
      maxWidth: '60%',
    },
    transactionTitleOverlayText: {
      fontSize: theme.fontSize.md,
      fontWeight: '800',
      color: '#FFFFFF',
      textShadowColor: 'rgba(0, 0, 0, 0.9)',
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 4,
    },
    dateOverlay: {
      position: 'absolute',
      bottom: 16,
      left: 0,
      right: 0,
      alignItems: 'center',
    },
    dateOverlayText: {
      fontSize: theme.fontSize.xs - 4,
      fontWeight: '600',
      color: '#FFFFFF',
      textAlign: 'center',
      textShadowColor: 'rgba(0, 0, 0, 0.8)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
    amountContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    amountIcon: {
      marginRight: 8,
      textShadowColor: 'rgba(0, 0, 0, 0.8)',
      textShadowOffset: { width: 1, height: 1 },
      textShadowRadius: 2,
    },
    amountOverlayText: {
      fontSize: 38,
      fontWeight: '800',
      color: '#FFFFFF',
      textShadowColor: 'rgba(0, 0, 0, 0.8)',
      textShadowOffset: { width: 2, height: 2 },
      textShadowRadius: 4,
    },
    categorySmallImage: {
      width: 32,
      height: 32,
      borderRadius: 6,
      marginRight: 12,
      borderWidth: 2,
      borderColor: '#FFFFFF',
    },
    categorySmallIcon: {
      width: 18,
      height: 18,
      borderRadius: 4,
      marginRight: 8,
      justifyContent: 'center',
      alignItems: 'center',
    },
    transactionButton: {
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
      marginBottom: 16,
      borderWidth: 1,
      borderColor: 'rgba(0, 0, 0, 0.2)',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      position: 'relative',
    },
    categoryButtonFamily: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.3)',
      paddingHorizontal: 2,
      paddingVertical: 2,
      borderRadius: 16,
      marginTop: 15,
      alignSelf: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    transactionButtonIconBackground: {
      width: 32,
      height: 32,
      borderRadius: 16,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#FFFFFF',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.2,
      shadowRadius: 2,
      elevation: 2,
    },
    transactionButtonIcon: {
      // Icon styles if needed
    },
    transactionButtonText: {
      fontSize: theme.fontSize.xs - 2,
      fontWeight: '800',
      color: '#FFFFFF',
      textAlign: 'center',
      marginLeft: 8,
      marginRight: 2,
    },
    transactionTitle: {
      fontSize: theme.fontSize.xl + 2,
      fontWeight: '700',
      color: theme.colors.text,
      marginBottom: 8,
      textAlign: 'center',
    },
    transactionAmount: {
      fontSize: theme.fontSize.xl + 8,
      fontWeight: '800',
      marginBottom: 4,
    },
    transactionType: {
      fontSize: theme.fontSize.sm,
      fontWeight: '500',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },

    // Details Section
    detailsSection: {
      backgroundColor: '#FFFFFF',
      borderRadius: 16,
      padding: 20,
      marginBottom: 20,
      borderWidth: 1,
      borderColor: '#F0F0F0',
    },
    sectionTitle: {
      fontSize: theme.fontSize.lg,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F8F8F8',
    },
    detailRowLast: {
      borderBottomWidth: 0,
    },
    detailLabel: {
      fontSize: theme.fontSize.md,
      color: theme.colors.textSecondary,
      fontWeight: '500',
    },
    detailValue: {
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
      fontWeight: '600',
      flex: 1,
      textAlign: 'right',
    },
    detailSubValue: {
      fontSize: theme.fontSize.xs,
      color: theme.colors.textSecondary,
      fontWeight: '400',
      textAlign: 'right',
      marginTop: 2,
    },
    categoryValue: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      justifyContent: 'flex-end',
    },
    categoryName: {
      fontSize: theme.fontSize.md - 2,
      color: theme.colors.text,
      fontWeight: '600',
      marginLeft: 8,
      textTransform: 'capitalize',
    },
    noteValue: {
      fontSize: theme.fontSize.md,
      color: theme.colors.text,
      fontWeight: '400',
      flex: 1,
      textAlign: 'right',
      fontStyle: 'italic',
    },

    // Action Buttons
    actionButtonsContainer: {
      flexDirection: 'row',
      gap: 12,
      marginTop: -16,
      paddingBottom: 40,
    },
    actionButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 50,
      paddingHorizontal: 20,
      borderRadius: 12,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 3,
      },
      shadowOpacity: 0.2,
      shadowRadius: 6,
      elevation: 4,
    },
    editButton: {
      backgroundColor: '#007AFF',
    },
    deleteButton: {
      backgroundColor: '#FF3B30',
    },
    actionButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginLeft: 6,
    },
  });


  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader theme={theme} insets={insets} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText} allowFontScaling={false}>Loading transaction details...</Text>
        </View>
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.container}>
        <ScreenHeader theme={theme} insets={insets} />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#CCCCCC" />
          <Text style={styles.errorText} allowFontScaling={false}>Transaction not found</Text>
        </View>
      </View>
    );
  }


  // Safety check for transaction amount
  const safeAmount = transaction && typeof transaction.amount === 'number' && !isNaN(transaction.amount) 
    ? transaction.amount 
    : 0;

  return (
    <View style={styles.container}>
      <ScreenHeader theme={theme} insets={insets} />
      
      {/* Dropdown Menu */}
      {showMenu && (
        <View style={[styles.dropdownMenu, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleEdit}
          >
            <Ionicons name="create-outline" size={20} color={theme.colors.text} />
            <Text style={[styles.menuItemText, { color: theme.colors.text }]} allowFontScaling={false}>
              Edit
            </Text>
          </TouchableOpacity>
          
          <View style={[styles.menuDivider, { backgroundColor: theme.colors.border }]} />
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleDelete}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
            <Text style={[styles.menuItemText, { color: '#FF3B30' }]} allowFontScaling={false}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Background overlay to close menu when tapping outside */}
      {showMenu && (
        <TouchableOpacity 
          style={styles.menuOverlay}
          activeOpacity={1}
          onPress={() => setShowMenu(false)}
        />
      )}
      
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Transaction Header */}
        <View style={styles.transactionHeader}>
          {(() => {
            const categoryImage = getCategoryImage(transaction.category, transaction.type);
            return categoryImage ? (
              <View style={styles.imageContainer}>
                <Image 
                  source={categoryImage} 
                  style={styles.categoryImage}
                  resizeMode="cover"
                />
                <View style={styles.imageOverlay} />
                <View style={styles.amountOverlay}>
                  {/* Transaction Title - Top Right */}
                  <View style={styles.transactionTitleOverlay}>
                    <Text style={styles.transactionTitleOverlayText} allowFontScaling={false}>
                      {transaction.title}
                    </Text>
                  </View>

                  <View style={styles.amountContainer}>
                    <Ionicons 
                      name="arrow-up" 
                      size={22} 
                      color="#FFFFFF" 
                      style={[
                        styles.amountIcon,
                        { 
                          transform: [{ 
                            rotate: transaction.type === 'expense' ? '45deg' : '225deg' 
                          }] 
                        }
                      ]}
                    />
                    <Text style={styles.amountOverlayText} allowFontScaling={false}>
                      ₹{safeAmount.toFixed(2)}
                    </Text>
                  </View>
                  
                  {/* Category Button Family */}
                  <View style={styles.categoryButtonFamily}>
                    <View style={styles.transactionButtonIconBackground}>
                      <Ionicons 
                        name={getCorrectIconName(transaction.categoryIcon || transaction.icon, transaction.category) as any} 
                        size={18} 
                        color={transaction.categoryColor || transaction.color || '#6B7280'}
                        style={styles.transactionButtonIcon}
                      />
                    </View>
                    <Text style={styles.transactionButtonText} allowFontScaling={false}>
                      {transaction.category}
                    </Text>
                  </View>

                  {/* Date Display - Bottom Center */}
                  <View style={styles.dateOverlay}>
                    <Text style={styles.dateOverlayText} allowFontScaling={false}>
                      {formatDateWithTime(transaction.date)}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={[styles.categoryIcon, { backgroundColor: transaction.color }]}>
                <Ionicons name={transaction.icon as any} size={40} color="#FFFFFF" />
              </View>
            );
          })()}
          
          {/* Banner Ad above Account Card */}
          <View style={styles.adContainer}>
            <BannerAdComponent />
          </View>
          
          {/* Card below image */}
          <View style={styles.imageCard}>
            {transaction.type === 'transfer' ? (
              /* Transfer Account Section */
              <View style={styles.transferAccountSection}>
                <View style={styles.transferAccountRow}>
                  <View style={styles.transferAccountInfo}>
                    <View style={styles.transferAccountIcon}>
                      <Ionicons name="card-outline" size={16} color="#FFFFFF" />
                    </View>
                    <Text style={styles.transferAccountText} allowFontScaling={false}>
                      {transaction.fromAccount?.bankName || transaction.fromAccount?.name || 'From Account'}
                    </Text>
                  </View>
                  
                  <View style={styles.transferArrow}>
                    <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                  </View>
                  
                  <View style={styles.transferAccountInfo}>
                    <View style={styles.transferAccountIcon}>
                      <Ionicons name="card-outline" size={16} color="#FFFFFF" />
                    </View>
                    <Text style={styles.transferAccountText} allowFontScaling={false}>
                      {transaction.toAccount?.bankName || transaction.toAccount?.name || 'To Account'}
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              /* Regular Account Section */
              <View style={styles.bankAccountSection}>
                <View style={styles.bankAccountInfo}>
                  {getBankLogo(transaction.bankAccountName || 'Bank Account') ? (
                    <Image 
                      source={getBankLogo(transaction.bankAccountName || 'Bank Account')} 
                      style={styles.bankLogo}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.bankLogoFallback}>
                      <Ionicons name="card" size={18} color="#FFFFFF" />
                    </View>
                  )}
                  <Text style={styles.bankAccountName} allowFontScaling={false}>
                    {(() => {
                      const accountName = transaction.bankAccountName || 'Bank Account';
                      const isCashAccount = accountName.toLowerCase().includes('cash') || accountName.toLowerCase().includes('wallet');
                      return isCashAccount 
                        ? accountName 
                        : `${accountName} • ${transaction.bankAccountNumber?.slice(-4) || '****'}`;
                    })()}
                  </Text>
                </View>
              </View>
            )}
            
            <View style={styles.transactionTypeSection}>
              <Text style={styles.transactionTypeLabel} allowFontScaling={false}>
                {transaction.type === 'expense' ? 'Expense' : transaction.type === 'income' ? 'Income' : 'Transfer'}
              </Text>
            </View>
          </View>
          
          {/* Notes Card */}
          <View style={styles.notesCard}>
            <View style={styles.notesHeaderContainer}>
              <Ionicons name="document-text-outline" size={16} color={theme.colors.text} />
              <Text style={styles.notesHeader} allowFontScaling={false}>
                Notes
              </Text>
            </View>
            <View style={styles.notesContentContainer}>
              <Text style={styles.notesContent} allowFontScaling={false}>
                {transaction.note || 'No notes added'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={[styles.actionButton, styles.editButton]} onPress={handleEdit}>
            <Ionicons name="create-outline" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText} allowFontScaling={false}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
            <Ionicons name="trash-outline" size={18} color="#FFFFFF" />
            <Text style={styles.actionButtonText} allowFontScaling={false}>Delete</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default TransactionDetailScreen;
