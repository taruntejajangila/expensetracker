import React, { useState, useEffect } from 'react';
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
  
  // Calculate progress based on income vs spent
  const progress = monthlyIncome > 0 ? (spentAmount / monthlyIncome) * 100 : 0;
  const radius = 80;
  const strokeWidth = 12;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Load transaction data
  const loadTransactionData = async () => {
    try {
      setLoading(true);
      
      // Load recent transactions
      console.log('🔍 SpentInMonthScreen: Loading recent transactions...');
      const recentTransactionData = await TransactionService.getRecentTransactions(10);
      console.log('🔍 SpentInMonthScreen: Recent transactions loaded:', recentTransactionData.length);
      console.log('🔍 SpentInMonthScreen: Sample recent transaction:', recentTransactionData[0]);
      setRecentTransactions(recentTransactionData);
      
      // Get current month and year
      const currentDate = new Date();
      const currentMonth = currentDate.getMonth();
      const currentYear = currentDate.getFullYear();
      
      // Load transactions for current month only
      const monthlyTransactions = await TransactionService.getTransactionsByMonth(currentYear, currentMonth);
      
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
      const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const currentDay = today.getDate();
      const daysRemaining = lastDayOfMonth - currentDay + 1; // +1 to include today
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
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading transaction data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactionData();
  }, []);

  // Reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadTransactionData();
    }, [])
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
      fontSize: theme.fontSize.lg,
      fontWeight: '700',
      textAlign: 'center',
    },
    headerSubtitle: {
      fontSize: theme.fontSize.xs,
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
    },
    progressCircle: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    progressText: {
      fontSize: 24,
      fontWeight: 'bold',
      color: theme.colors.text,
      marginBottom: 4,
    },
    progressSubtext: {
      fontSize: 14,
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
      fontSize: 12,
      color: theme.colors.textSecondary,
      marginBottom: 4,
    },
    detailValue: {
      fontSize: 16,
      fontWeight: 'bold',
      color: theme.colors.text,
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
       fontSize: 18,
       fontWeight: 'bold',
       color: theme.colors.text,
       marginBottom: theme.spacing.xs,
     },
     cardSubtitle: {
       fontSize: 14,
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
       fontSize: 18,
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
       fontSize: 14,
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
       fontSize: 14,
       fontWeight: '600',
       color: theme.colors.text,
       marginBottom: 2,
     },
     transactionCategory: {
       fontSize: 12,
       color: theme.colors.textSecondary,
     },
     transactionAmount: {
       fontSize: 14,
       fontWeight: 'bold',
     },
     transactionRight: {
       alignItems: 'flex-end',
     },
     transactionDate: {
       fontSize: 11,
       color: theme.colors.textSecondary,
       marginTop: 2,
     },
           viewAllButton: {
        alignItems: 'center',
        paddingVertical: theme.spacing.sm,
        marginTop: 0,
      },
           viewAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#007AFF',
      },
      loadingContainer: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
      },
      loadingText: {
        fontSize: 16,
        color: '#999',
      },
      emptyContainer: {
        padding: 32,
        alignItems: 'center',
        justifyContent: 'center',
      },
      emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: theme.colors.text,
        marginTop: 16,
        textAlign: 'center',
      },
      emptySubtext: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginTop: 8,
        textAlign: 'center',
      },
  });

  // Header Component
  const ScreenHeader: React.FC<{ user?: any; theme: any; insets: any }> = ({ user, theme, insets }) => {
    // Different padding for Android vs iOS
    const headerPaddingTop = Platform.OS === 'android' ? insets.top + 5 : insets.top + 10;
    const currentDate = new Date();
    const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    
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
              {monthYear}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              Monthly spending overview
            </Text>
          </View>
          
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
       <ScreenHeader user={user} theme={theme} insets={insets} />
       
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
            {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </Text>
        </Text>

        {/* Circular Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressCircle}>
            <Svg width={radius * 2 + strokeWidth} height={radius * 2 + strokeWidth}>
              {/* Background circle (blue for remaining) */}
              <Circle
                cx={radius + strokeWidth / 2}
                cy={radius + strokeWidth / 2}
                r={radius}
                stroke="#007AFF"
                strokeWidth={strokeWidth}
                fill="transparent"
              />
              {/* Progress circle (red for spent) */}
              <Circle
                cx={radius + strokeWidth / 2}
                cy={radius + strokeWidth / 2}
                r={radius}
                stroke="#FF3B30"
                strokeWidth={strokeWidth}
                fill="transparent"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${radius + strokeWidth / 2} ${radius + strokeWidth / 2})`}
              />
            </Svg>
                         <View style={{ 
               position: 'absolute', 
               alignItems: 'center',
               justifyContent: 'center',
               width: '100%',
               height: '100%'
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
                   {loading ? '--' : `₹${spentAmount.toLocaleString()}`}
                 </Text>
                 <Text style={styles.progressSubtext} allowFontScaling={false}>Spent</Text>
               </View>
             </View>
          </View>
          
          <View style={styles.progressDetails}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel} allowFontScaling={false}>Income</Text>
              <Text style={[styles.detailValue, { color: '#34C759' }]} allowFontScaling={false}>
                {loading ? '--' : `₹${monthlyIncome.toLocaleString()}`}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel} allowFontScaling={false}>Remaining</Text>
              <Text style={[styles.detailValue, { color: '#007AFF' }]} allowFontScaling={false}>
                {loading ? '--' : `₹${remainingBalance.toLocaleString()}`}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel} allowFontScaling={false}>Safe to Spend</Text>
              <Text style={[styles.detailValue, { color: '#FF9500' }]} allowFontScaling={false}>
                {loading ? '--' : `₹${Math.floor(safeToSpendPerDay).toLocaleString()}/day`}
              </Text>
            </View>
          </View>
         </View>
         
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
         
                   {/* Empty content area - ready for future data */}
          
          {/* Extra spacing to ensure last item is visible */}
          <View style={{ height: 50 }} />
         
       </ScrollView>
    </View>
  );
};

export default SpentInMonthScreen;


