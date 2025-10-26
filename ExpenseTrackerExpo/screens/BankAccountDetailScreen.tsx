import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Platform,
} from 'react-native';
import { useRoute, useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Alert, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useScroll } from '../context/ScrollContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AccountService from '../services/AccountService';
import BankCard from '../components/BankCard';
import SpendingAnalytics from '../components/SpendingAnalytics';
import RecentActivity from '../components/RecentActivity';
import TransactionService, { Transaction } from '../services/transactionService';
import { BannerAdComponent } from '../components/AdMobComponents';

interface AccountParam {
  id: string;
  name: string;
  bankName?: string;
  accountHolderName?: string;
  type: 'bank' | 'cash' | 'card' | 'investment';
  balance: number;
  currency: string;
  icon: string;
  color: string;
  accountType?: string;
  accountNumber?: string;
  status?: 'Active' | 'Inactive';
  lastUpdated?: string;
}

interface RouteParams {
  account: AccountParam;
  refresh?: boolean;
}

const BankAccountDetailScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { theme } = useTheme();
  const { scrollY } = useScroll();
  const insets = useSafeAreaInsets();
  const { account, refresh } = route.params as RouteParams;

  // Set up navigation options with access to account data
  useEffect(() => {
    if (account) {
      navigation.setOptions({
        headerRight: () => (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => {
                // Navigate to edit account with account data
                // Navigating to edit account
                (navigation as any).navigate('AddAccount', { 
                  isEdit: true, 
                  account: account 
                });
              }}
              activeOpacity={0.8}
              style={{ paddingHorizontal: 8 }}
            >
              <Ionicons name="create-outline" size={22} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                // Show delete confirmation
                Alert.alert('Delete Account', 'Are you sure you want to delete this account?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => {
                    handleDeleteAccount();
                  }}
                ]);
              }}
              activeOpacity={0.8}
              style={{ paddingHorizontal: 8 }}
            >
              <Ionicons name="trash-outline" size={22} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        )
      });
    }
  }, [navigation, account]);

  // State for transactions and spending data
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [spendingData, setSpendingData] = useState<any>(null);
  const [currentAccount, setCurrentAccount] = useState<AccountParam>(account);

  // Load transactions for this account
  useEffect(() => {
    if (account) {
      loadTransactions();
    }
  }, [account]);

  // Handle immediate refresh when coming from edit screen
  useEffect(() => {
    if (refresh && account) {
      console.log('🔄 BankAccountDetail: Refresh flag detected, reloading data...');
      // Update current account with fresh data
      setCurrentAccount(account);
      // Reload transactions
      loadTransactions();
      // Clear the refresh flag to prevent infinite loops
      (navigation as any).setParams({ refresh: false });
    }
  }, [refresh, account, navigation]);

  // Function to refresh account data from backend
  const refreshAccountData = async () => {
    if (!account?.id) return;
    
    try {
      console.log('🔄 BankAccountDetail: Refreshing account data from backend...');
      const freshAccount = await AccountService.getAccountById(account.id);
      if (freshAccount) {
        setCurrentAccount(freshAccount);
        console.log('✅ BankAccountDetail: Account data refreshed successfully');
      }
    } catch (error) {
      console.error('❌ BankAccountDetail: Error refreshing account data:', error);
    }
  };

  // Auto-refresh when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Bank account detail screen focused - refreshing data...');
      if (account) {
        refreshAccountData(); // Refresh account data from backend
        loadTransactions();
      }
    }, [account])
  );

  const loadTransactions = async () => {
    if (!currentAccount) return;
    
    try {
      const allTransactions = await TransactionService.getTransactions();
      
      // Filter transactions for this specific account
      const accountTransactions = allTransactions.filter(transaction => {
        return transaction.accountId === currentAccount.id;
      });

      if (accountTransactions.length > 0) {
        setTransactions(accountTransactions);
        calculateSpendingData(accountTransactions);
      } else {
        setTransactions([]);
        // Call calculateSpendingData with empty array to show empty state
        calculateSpendingData([]);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
      // Call calculateSpendingData with empty array to show empty state
      calculateSpendingData([]);
    }
  };

  const calculateSpendingData = (transactions: Transaction[]) => {
    // Filter only expense transactions
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    // Always set spending data, even if there are no expense transactions
    if (expenseTransactions.length === 0) {
      setSpendingData({
        totalSpent: 0,
        categoryBreakdown: {},
        topCategories: [],
        isEmpty: true
      });
      return;
    }
    
    const totalSpent = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const categoryBreakdown: { [key: string]: number } = {};
    
    // Group by category
    expenseTransactions.forEach(t => {
      if (categoryBreakdown[t.category]) {
        categoryBreakdown[t.category] += t.amount;
      } else {
        categoryBreakdown[t.category] = t.amount;
      }
    });
    
    // Convert to array and sort by amount
    const topCategories = Object.entries(categoryBreakdown)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: (amount / totalSpent) * 100,
        color: getCategoryColor(category),
        icon: getCategoryIcon(category)
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5); // Top 5 categories
    
    setSpendingData({
      totalSpent,
      categoryBreakdown,
      topCategories,
      isEmpty: false
    });
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      food: '#FF6B6B',
      dining: '#FF6B6B',
      transport: '#4ECDC4',
      shopping: '#45B7D1',
      groceries: '#4ECDC4',
      entertainment: '#96CEB4',
      healthcare: '#FFEAA7',
      education: '#DDA0DD',
      utilities: '#FFD93D',
      housing: '#FF8A80',
      travel: '#BB8FCE',
      insurance: '#85C1E9',
      gifts: '#F8C471',
      other: '#BDC3C7',
      cafe: '#FF6B6B',
      restaurant: '#FF6B6B',
      gas: '#4ECDC4',
      fuel: '#4ECDC4',
      online: '#45B7D1',
      amazon: '#45B7D1',
      uber: '#4ECDC4',
      taxi: '#4ECDC4'
    };
    return colors[category.toLowerCase()] || '#BDC3C7';
  };

  const getCategoryIcon = (category: string): string => {
    const icons: { [key: string]: string } = {
      food: 'restaurant',
      dining: 'restaurant',
      transport: 'car',
      shopping: 'bag',
      groceries: 'basket',
      entertainment: 'game-controller',
      healthcare: 'medical',
      education: 'school',
      utilities: 'flash',
      housing: 'home',
      travel: 'airplane',
      insurance: 'shield',
      gifts: 'gift',
      other: 'ellipsis-horizontal',
      cafe: 'cafe',
      restaurant: 'restaurant',
      gas: 'car',
      fuel: 'car',
      online: 'globe',
      amazon: 'bag',
      uber: 'car',
      taxi: 'car'
    };
    return icons[category.toLowerCase()] || 'ellipsis-horizontal';
  };



  
  const styles = createStyles(theme, insets);

  if (!currentAccount) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}> 
        <Text style={styles.mutedText} allowFontScaling={false}>No account data provided.</Text>
      </View>
    );
  }

  // Header Component
  const ScreenHeader: React.FC<{ theme: any; insets: any; account: AccountParam }> = ({ theme, insets, account }) => {
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
              {account.name || 'Account Details'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              {account.bankName || account.accountType || 'Bank Account'}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => {
                // Navigate to edit account screen
                (navigation as any).navigate('AddAccount', { 
                  isEdit: true, 
                  account: account 
                });
              }}
              activeOpacity={0.8}
              style={styles.headerIconButton}
            >
              <Ionicons name="create-outline" size={22} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                // Show delete confirmation
                Alert.alert(
                  'Delete Account',
                  'Are you sure you want to delete this account?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => {
                      // Handle delete account
                      handleDeleteAccount();
                    }}
                  ]
                );
              }}
              activeOpacity={0.8}
              style={styles.headerIconButton}
            >
              <Ionicons name="trash-outline" size={22} color="#FF3B30" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const handleDeleteAccount = async () => {
    try {
      const result = await AccountService.deleteAccount(account.id);
      
      if (result.success) {
        Alert.alert('Success', 'Account deleted successfully', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      } else {
        Alert.alert('Error', result.message || 'Failed to delete account. Please try again.');
      }
    } catch (error: any) {
      console.error('Error deleting account:', error);
      Alert.alert('Error', error.message || 'Failed to delete account. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Safe Area */}
      <ScreenHeader theme={theme} insets={insets} account={currentAccount} />

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        
        {/* Bank Card Component */}
        <View style={styles.bankCardContainer}>
          <BankCard
            accountNumber={currentAccount.accountNumber}
            accountHolderName={currentAccount.accountHolderName || currentAccount.name}
            accountType={currentAccount.accountType || 'Bank Account'}
            bankName={currentAccount.bankName || currentAccount.name}
            balance={currentAccount.balance}
            currency={currentAccount.currency}
            accountNickname={currentAccount.bankName && currentAccount.name !== currentAccount.bankName ? currentAccount.name : undefined}
          />
        </View>

        {/* Banner Ad below Account Card */}
        <View style={styles.adContainer}>
          <BannerAdComponent />
        </View>

        {/* Spending Analytics Component */}
        {spendingData && (
          <View style={styles.analyticsContainer}>
            <SpendingAnalytics spendingData={spendingData} />
          </View>
        )}

        {/* Banner Ad below Spending Analytics */}
        {spendingData && (
          <View style={styles.adContainer}>
            <BannerAdComponent />
          </View>
        )}

        {/* Recent Activity Component */}
        <View style={styles.activityContainer}>
          <RecentActivity 
            transactions={transactions}
            onViewAllPress={() => {
              // Navigate to all transactions screen
              (navigation as any).navigate('AllTransaction');
            }}
            onTransactionPress={(transaction) => {
              // Navigate to transaction detail screen
              (navigation as any).navigate('TransactionDetail', { transaction });
            }}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
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
  headerIconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  bankCardContainer: {
    marginTop: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  analyticsContainer: {
    marginHorizontal: -20, // Offset parent padding to make card full width
  },
  adContainer: {
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
      activityContainer: {
      // Let RecentActivity component handle its own spacing
    },
  mutedText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },


});

export default BankAccountDetailScreen;


