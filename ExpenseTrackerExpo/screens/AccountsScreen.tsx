import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useScroll } from '../context/ScrollContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import AccountService from '../services/AccountService';
import BankCard from '../components/BankCard';
import CashWallet from '../components/CashWallet';
import SpendingAnalytics from '../components/SpendingAnalytics';
import RecentActivity from '../components/RecentActivity';
import TransactionService from '../services/transactionService';




interface Account {
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

const AccountsScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { scrollY } = useScroll();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [spendingData, setSpendingData] = useState<any>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const buttonScale = useRef(new Animated.Value(1)).current;


  useEffect(() => {
    loadAccounts();

    
    
    

  }, []);



  useFocusEffect(
    React.useCallback(() => {
      loadAccounts();
    }, [])
  );

  const mapStoredToAccount = (stored: StoredAccount): Account => ({
    id: stored.id,
    name: stored.name,
    bankName: stored.bankName,
    accountHolderName: stored.accountHolderName,
    type: stored.type,
    balance: stored.balance,
    currency: stored.currency,
    icon: stored.icon,
    color: stored.color,
    accountType: stored.accountType,
    accountNumber: stored.accountNumber,
    status: stored.status,
    lastUpdated: stored.lastUpdated,
  });

  const loadAccounts = async () => {
    try {
      console.log('📱 Starting account loading...');
      
      // Get all accounts including the wallet
      const stored = await AccountService.getAccounts();
      const persisted = stored.map(mapStoredToAccount);
      setAccounts(persisted);

      const total = persisted.reduce((sum, account) => sum + account.balance, 0);
      setTotalBalance(total);
      
      console.log('📱 Accounts loaded:', persisted.length, 'accounts, total balance:', total);
    } catch (error) {
      console.log('Error loading accounts:', error);
      // Even if there's an error, try to ensure wallet exists
      try {
        console.log('📱 Trying fallback account loading...');
        await AccountService.ensureDefaultWallet();
        const stored = await AccountService.getAccounts();
        const persisted = stored.map(mapStoredToAccount);
        setAccounts(persisted);
        const total = persisted.reduce((sum: number, account: any) => sum + account.balance, 0);
        setTotalBalance(total);
        console.log('📱 Fallback loading successful:', persisted.length, 'accounts');
      } catch (fallbackError) {
        console.log('Fallback account loading also failed:', fallbackError);
        // Last resort: show empty state
        setAccounts([]);
        setTotalBalance(0);
      }
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    try {
      console.log('📱 Manual refresh triggered');
      await loadAccounts();
      console.log('📱 Manual refresh completed');
    } catch (error) {
      console.log('📱 Manual refresh failed:', error);
    } finally {
      setIsRefreshing(false);
    }
  };





  const formatCurrency = (amount: number) => {
    const isNegative = amount < 0;
    const absoluteAmount = Math.abs(amount);
    return `${isNegative ? '-' : ''}₹${absoluteAmount.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })}`;
  };

  const handleButtonPressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handleButtonPressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  // Calculate account type totals
  const getAccountTypeTotals = () => {
    const cashTotal = accounts
      .filter(account => account.type === 'cash')
      .reduce((sum, account) => sum + account.balance, 0);
    
    const bankTotal = accounts
      .filter(account => account.type === 'bank')
      .reduce((sum, account) => sum + account.balance, 0);

    return { cashTotal, bankTotal };
  };

  const { cashTotal, bankTotal } = getAccountTypeTotals();

  // Get current time formatted
  const getCurrentTime = () => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
    return `Today, ${timeString}`;
  };

  // Format last updated time
  const formatLastUpdated = (lastUpdated?: string) => {
    if (!lastUpdated) return 'Just now';
    return lastUpdated;
  };

  // Calculate percentages for cash and banks
  const getPercentages = () => {
    if (totalBalance === 0) return { cashPercent: 0, bankPercent: 0 };
    
    const cashPercent = Math.round((cashTotal / totalBalance) * 100);
    const bankPercent = Math.round((bankTotal / totalBalance) * 100);
    
    return { cashPercent, bankPercent };
  };

  const { cashPercent, bankPercent } = getPercentages();

  // Load transactions and calculate spending data
  useEffect(() => {
    if (accounts.length > 0) {
      loadTransactions();
    }
  }, [accounts]);

  const loadTransactions = async () => {
    try {
      const allTransactions = await TransactionService.getTransactions();
      
      // Get recent transactions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentTransactions = allTransactions.filter(transaction => 
        new Date(transaction.date) >= thirtyDaysAgo
      );
      
      setTransactions(recentTransactions);
      calculateSpendingData(recentTransactions);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setTransactions([]);
      setSpendingData(null);
    }
  };

  const calculateSpendingData = (transactions: Transaction[]) => {
    const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0);
    const categoryBreakdown: { [key: string]: number } = {};
    
    // Group by category
    transactions.forEach(t => {
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
      topCategories
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

  // Header Component
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
              Accounts
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              Manage your accounts
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={() => {
                navigation.navigate('AddAccount' as never);
              }}
            >
              <Ionicons name="add" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const styles = createStyles(theme, insets);

  return (
    <View style={styles.container}>
      {/* Header with Safe Area */}
      <ScreenHeader theme={theme} insets={insets} />
      
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={[styles.scrollContent, { paddingTop: 0 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Total Balance Card */}
        <LinearGradient
          colors={['#1E3A8A', '#3B82F6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.totalBalanceCard}
        >
          <View style={styles.totalBalanceHeader}>
            <Text style={styles.totalBalanceIcon} allowFontScaling={false}>💰</Text>
            <Text style={styles.totalBalanceTitle} allowFontScaling={false}>TOTAL BALANCE</Text>
          </View>
          
          <Text style={styles.totalBalanceAmount} allowFontScaling={false}>
            {formatCurrency(totalBalance)}
          </Text>
          <Text style={styles.totalBalanceLabel} allowFontScaling={false}>Available Funds</Text>
          
          {/* Account Types Breakdown */}
          <View style={styles.accountTypesBreakdown}>
            <View style={styles.statItem}>
              <Text style={styles.statValue} allowFontScaling={false}>{formatCurrency(cashTotal)}</Text>
              <Text style={styles.statLabel} allowFontScaling={false}>Cash</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue} allowFontScaling={false}>{formatCurrency(bankTotal)}</Text>
              <Text style={styles.statLabel} allowFontScaling={false}>Banks</Text>
            </View>
          </View>
        </LinearGradient>





        {/* Your Bank Accounts Heading */}
        <View style={styles.sectionHeading}>
          <Text style={styles.sectionHeadingText} allowFontScaling={false}>Your Bank Accounts</Text>
        </View>

        {/* Bank Card Preview */}
        <View style={styles.bankCardContainer}>
          {(() => {
            const bankAccounts = accounts.filter(account => account.type === 'bank');
            if (bankAccounts.length > 0) {
              return (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  pagingEnabled
                  decelerationRate="fast"
                  snapToInterval={Dimensions.get('window').width - 48} // Card width + margins
                  snapToAlignment="start"
                  contentContainerStyle={styles.bankCardsScrollContent}
                  style={styles.bankCardsScrollView}
                >
                  {bankAccounts.map((account, index) => (
                    <View key={account.id} style={styles.bankCardWrapper}>
                      <TouchableOpacity 
                        onPress={() => {
                          (navigation as any).navigate('BankAccountDetail', { account });
                        }}
                        activeOpacity={0.8}
                      >
                        <BankCard 
                          accountNumber={account.accountNumber || 'XXXX XXXX XXXX XXXX'}
                          accountHolderName={account.accountHolderName || 'Account Holder'}
                          accountType={account.accountType || 'Bank Account'}
                          bankName={account.bankName || account.name}
                          balance={account.balance}
                          currency={account.currency || '₹'}
                          cardColor={account.color}
                          accountNickname={account.name}
                        />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              );
            } else {
              return (
                <View style={styles.emptyStateContainer}>
                  <View style={styles.emptyStateIcon}>
                    <Ionicons name="add-circle-outline" size={56} color={theme.colors.primary} />
                  </View>
                  <Text style={styles.emptyStateTitle} allowFontScaling={false}>No Bank Accounts Yet</Text>
                  <Text style={styles.emptyStateSubtitle} allowFontScaling={false}>Start by adding your first bank account to track your finances</Text>
                  <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
                    <TouchableOpacity 
                      style={styles.addAccountButton}
                      onPress={() => (navigation as any).navigate('AddAccount')}
                      onPressIn={handleButtonPressIn}
                      onPressOut={handleButtonPressOut}
                      activeOpacity={1}
                    >
                      <Ionicons name="add" size={18} color="#FFFFFF" />
                      <Text style={styles.addAccountButtonText} allowFontScaling={false}>Add Bank Account</Text>
                    </TouchableOpacity>
                  </Animated.View>
                </View>
              );
            }
          })()}
        </View>

        {/* Cash Wallet Component */}
        <View style={styles.cashWalletContainer}>
          <CashWallet 
            balance={cashTotal}
            lastUpdated={getCurrentTime()}
            onPress={() => {
              // Navigate to cash wallet details or add cash screen
              // Cash wallet pressed
            }}
          />
        </View>

        {/* Spending Analytics Component */}
        <View style={styles.analyticsContainer}>
          <SpendingAnalytics spendingData={spendingData} />
        </View>

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

        {/* Smart Insights Card - Moved to bottom */}
        <LinearGradient
          colors={['#1e3c72', '#2a5298']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.insightCard}
        >
          <View style={styles.insightHeader}>
            <View style={styles.insightIconContainer}>
              <Ionicons name="analytics" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.insightHeaderText}>
              <Text style={styles.insightTitle} allowFontScaling={false}>Smart Insights</Text>
              <Text style={styles.insightSubtitle} allowFontScaling={false}>AI-powered financial analysis</Text>
            </View>
          </View>
          
          <View style={styles.insightMetrics}>
            <View style={styles.metricBox}>
              <Text style={styles.metricValue} allowFontScaling={false}>{cashPercent}%</Text>
              <Text style={styles.metricLabel} allowFontScaling={false}>Cash Holdings</Text>
              <View style={[styles.metricBar, { width: `${cashPercent}%` }]} />
            </View>
            
            <View style={styles.metricBox}>
              <Text style={styles.metricValue} allowFontScaling={false}>{bankPercent}%</Text>
              <Text style={styles.metricLabel} allowFontScaling={false}>Bank Savings</Text>
              <View style={[styles.metricBar, { width: `${bankPercent}%`, backgroundColor: '#4ECDC4' }]} />
            </View>
          </View>
          
          <View style={styles.insightRecommendation}>
            <View style={styles.recommendationHeader}>
              <Ionicons name="bulb" size={16} color="#FFD700" />
              <Text style={styles.recommendationTitle} allowFontScaling={false}>Recommendation</Text>
            </View>
            <Text style={styles.recommendationText} allowFontScaling={false}>
              {cashPercent > 15 
                ? "Consider investing excess cash for better returns" 
                : "Great balance! Maintain this allocation for optimal growth"}
            </Text>
          </View>
        </LinearGradient>

      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any, insets: any) => StyleSheet.create({
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
  addButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  totalBalanceCard: {
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

  totalBalanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  totalBalanceIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  totalBalanceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  totalBalanceLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  accountTypesBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 10,
  },

  bankAccountsCard: {
    backgroundColor: '#6C5CE7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  bankAccountsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  bankAccountsIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  bankAccountsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  bankAccountsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 16,
  },
  bankAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  bankAccountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bankLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  bankAccountInfo: {
    flex: 1,
  },
  bankNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  bankName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  bankInstitutionText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 2,
  },
  accountNumber: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  accountNumberBold: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  bankAccountDetails: {
    flex: 1,
  },
  bankAccountType: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 4,
  },
  bankStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  lastUpdatedText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
  bankAccountDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginLeft: 60,
    marginVertical: 8,
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderWidth: 0,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  addAccountButtonIcon: {
    marginRight: 2,
  },
  addAccountButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  insightCard: {
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
    overflow: 'hidden',
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  insightIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  insightHeaderText: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  insightSubtitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '400',
  },
  insightMetrics: {
    marginBottom: 20,
  },
  metricBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  metricBar: {
    height: 4,
    backgroundColor: '#FF6B6B',
    borderRadius: 2,
    alignSelf: 'flex-start',
    minWidth: 20,
  },
  insightRecommendation: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFD700',
    marginLeft: 6,
  },
  recommendationText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  totalBalanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
     accountsCount: {
     fontSize: 14,
     color: '#FFFFFF',
     opacity: 0.7,
   },
  sectionHeading: {
    marginTop: 20,
    marginBottom: 20, // Increased from 10 to 20 to create more gap
    paddingHorizontal: 16,
  },
  sectionHeadingText: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    letterSpacing: 0.5,
  },
  bankCardContainer: {
    marginBottom: 20, // Increased from 10 to 20 to move bank cards down
    alignItems: 'flex-start', // Align to left edge like Total Balance card
    justifyContent: 'flex-start', // Start from left
  },
  bankCardsScrollView: {
    marginHorizontal: -16, // Offset parent padding
  },
  bankCardsScrollContent: {
    paddingLeft: 16, // Add left padding for proper spacing
    paddingRight: 16,
    alignItems: 'flex-start', // Align cards to left edge like Total Balance card
  },
  bankCardWrapper: {
    width: Dimensions.get('window').width - 48, // Screen width minus margins
    marginRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    backgroundColor: theme.colors.surface,
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 10,
  },
  emptyStateIcon: {
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  analyticsContainer: {
    marginHorizontal: -16, // Offset parent padding to make cards full width
  },
  activityContainer: {
    // Let RecentActivity component handle its own spacing
  },
  cashWalletContainer: {
    marginHorizontal: -16, // Offset parent padding to make card full width (same as analyticsContainer)
    marginTop: 10, // Reduced gap between bank accounts and cash wallet
    marginBottom: 10, // Reduced gap between cash wallet and spending analytics
  },



});

export default AccountsScreen;
