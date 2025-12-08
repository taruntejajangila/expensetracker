import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useScroll } from '../context/ScrollContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { LoanService } from '../services/LoanService';
import LoanCard from '../components/LoanCard';
import { BannerAdComponent } from '../components/AdMobComponents';
import AppOpenAdService from '../services/AppOpenAdService';
import { formatCurrency } from '../utils/currencyFormatter';

// 🎬 SCREENSHOT MODE: Set to true to hide banner ads for screenshots
const HIDE_ADS_FOR_SCREENSHOTS = false;

interface Loan {
  id: string;
  name: string;
  type: string;
  principal: number;
  currentBalance: number;
  interestRate: number;
  monthlyPayment: number;
  nextPaymentDate: string;
  term: number;
  remainingTerm: number;
  gradientColors: string[];
  lender?: string;
}

const LoansScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { scrollY } = useScroll();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [totalMonthlyPayment, setTotalMonthlyPayment] = useState(0);
  // Removed mock interstitial modal

  // Removed sample/mock loans; using stored loans only

  useEffect(() => {
    loadLoans();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadLoans();
    }, [])
  );

  const loadLoans = async () => {
    try {
      console.log('🔄 Loading loans from LoanService...');
      // Use LoanService to get loans from backend (with local fallback)
      const all = await LoanService.getLoans();
      console.log('📊 Loans loaded:', all.length);
      if (!all || all.length === 0) {
        console.log('📱 No loans found');
        setLoans([]);
        setTotalBalance(0);
        setTotalMonthlyPayment(0);
        return;
      }

      console.log('🔄 Processing loans for display...');
      // Recompute currentBalance and nextPaymentDate based on time elapsed
      const now = new Date();
      console.log('📅 Current date:', now.toISOString());
      // Create a mutable copy of the array to avoid read-only issues
      const processedLoans = all.map((loan) => {
        try {
          const isInterestOnly = !!(loan as any).isInterestOnly || (loan as any).type === 'Gold Loan' || (loan as any).type === 'Private Money Lending';
          const annualRate = Number(loan.interestRate || 0);
          const r = annualRate / 100 / 12; // annualRate is now percentage, convert to decimal then monthly
          const tenureMonths = Number((loan as any).tenureMonths || Math.round(((loan as any).term || 0) * 12));
          const start = new Date(loan.emiStartDate || loan.nextPaymentDate || new Date());
          // months elapsed from start to now
          let monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
          if (now.getDate() < start.getDate()) {
            monthsElapsed -= 1;
          }
          monthsElapsed = Math.max(0, monthsElapsed);
          // Payments made includes the first EMI on the start date (if today >= start)
          const onOrAfterStart = now.getTime() >= start.getTime();
          const paymentsMade = onOrAfterStart ? Math.min(tenureMonths, monthsElapsed + 1) : 0;
          
          console.log(`🔍 Loan ${loan.name}: Principal=${loan.principal}, InterestRate=${Number(loan.interestRate).toFixed(2)}%, Tenure=${tenureMonths} months, PaymentsMade=${paymentsMade}, MonthsElapsed=${monthsElapsed}`);
          let currentBalance = Number(loan.principal || 0);
          if (isInterestOnly) {
            // Interest-only: principal doesn't reduce automatically
            currentBalance = Number(loan.principal || 0);
          } else if (r > 0 && tenureMonths > 0) {
            // Correct amortization formula for remaining balance
            // B_k = P * [((1+r)^n - (1+r)^k) / ((1+r)^n - 1)]
            const k = paymentsMade;
            const n = tenureMonths;
            const pow_n = Math.pow(1 + r, n);
            const pow_k = Math.pow(1 + r, k);
            
            if (k >= n) {
              // Loan is fully paid off
              currentBalance = 0;
              console.log(`✅ Loan ${loan.name} is fully paid off`);
            } else {
              currentBalance = currentBalance * ((pow_n - pow_k) / (pow_n - 1));
              currentBalance = Math.max(0, Math.round(currentBalance));
              console.log(`💰 Loan ${loan.name} calculated balance: ${currentBalance} (was ${loan.principal})`);
            }
          } else if (r === 0 && tenureMonths > 0) {
            // Zero interest: simple linear reduction
            const k = paymentsMade;
            const principalPaid = (Number(loan.principal || 0) / tenureMonths) * k;
            currentBalance = Math.max(0, Math.round(Number(loan.principal || 0) - principalPaid));
          }
          // compute next payment date based on start and monthsElapsed
          const next = new Date(start);
          // Next payment is after the number of payments already made
          const nextMonth = start.getMonth() + paymentsMade;
          const nextYear = start.getFullYear() + Math.floor(nextMonth / 12);
          next.setFullYear(nextYear);
          next.setMonth(nextMonth % 12);
          return { ...loan, currentBalance, nextPaymentDate: next.toISOString() };
        } catch {
          return loan;
        }
      });
      setLoans(processedLoans as any);
      const balance = processedLoans.reduce((sum: number, loan: any) => sum + (loan.currentBalance || 0), 0);
      const monthly = processedLoans.reduce((sum: number, loan: any) => sum + (loan.monthlyPayment || 0), 0);
      setTotalBalance(balance);
      setTotalMonthlyPayment(monthly);
      console.log('✅ Loans processed successfully. Total balance:', balance, 'Monthly payment:', monthly);
    } catch (error) {
      console.error('❌ Error loading loans:', error);
      setLoans([] as any);
      setTotalBalance(0);
      setTotalMonthlyPayment(0);
    }
  };

   // Using centralized currency formatter - formatCurrency imported from utils

  const getCompletionPercentage = (principal: number, currentBalance: number) => {
    return Math.round(((principal - currentBalance) / principal) * 100);
  };

  const getLoanIcon = (loanType: string) => {
    switch (loanType) {
      case 'home':
        return 'home';
      case 'auto':
        return 'car';
      case 'personal':
        return 'person';
      case 'student':
        return 'school';
      default:
        return 'document';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatDateWithYear = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Check if it's today
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }
    
    // Check if it's tomorrow
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    
    // Check if it's this year
    if (date.getFullYear() === today.getFullYear()) {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateTotalInterestPaid = () => {
    // Calculate total interest paid based on loan progress
    // This is an estimate based on typical loan payment structures
    return loans.reduce((totalInterest, loan) => {
      const principalPaid = loan.principal - loan.currentBalance;
      const paymentsMade = Math.ceil((loan.term - loan.remainingTerm) * 12);
      const totalPaid = paymentsMade * loan.monthlyPayment;
      const interestPaid = Math.max(0, totalPaid - principalPaid);
      return totalInterest + interestPaid;
    }, 0);
  };

  const styles = createStyles(theme, insets);

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
              Loans
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              Manage your loans
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={async () => {
                try {
                  await AppOpenAdService.showInterstitial();
                } catch {}
                (navigation as any).navigate('AddLoan');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Safe Area */}
      <ScreenHeader theme={theme} insets={insets} />

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
        {/* Loans Summary Card */}
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryCard}
        >
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryIcon} allowFontScaling={false}>🏦</Text>
            <Text style={styles.summaryTitle} allowFontScaling={false}>LOANS OVERVIEW</Text>
          </View>
          
          <Text style={styles.totalBalanceAmount} allowFontScaling={false}>
            {formatCurrency(totalBalance)}
          </Text>
          <Text style={styles.totalBalanceLabel} allowFontScaling={false}>Total Outstanding</Text>
          
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue} allowFontScaling={false}>
                {formatCurrency(loans.reduce((sum: number, loan: any) => sum + (loan.principal || 0), 0))}
              </Text>
              <Text style={styles.statLabel} allowFontScaling={false}>Total Borrowed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue} allowFontScaling={false}>{formatCurrency(totalMonthlyPayment)}</Text>
              <Text style={styles.statLabel} allowFontScaling={false}>Monthly Payment</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue} allowFontScaling={false}>
                {formatCurrency(loans.reduce((sum: number, loan: any) => sum + ((loan.principal || 0) - (loan.currentBalance || 0)), 0))}
              </Text>
              <Text style={styles.statLabel} allowFontScaling={false}>Paid Off</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Loans Carousel */}
        <View style={styles.loansSection}>
          <Text style={styles.sectionTitle} allowFontScaling={false}>Your Loans</Text>
          
          {loans.length === 0 ? (
            <View style={styles.emptyContainer}>
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.emptyStateGradient}
              >
                <View style={styles.emptyStateIcon}>
                  <Ionicons name="trending-up" size={64} color="#FFFFFF" />
                </View>
                <Text style={styles.emptyStateTitle} allowFontScaling={false}>No Loans Yet</Text>
                <Text style={styles.emptyStateSubtitle} allowFontScaling={false}>Start your financial journey with smart borrowing</Text>
                <TouchableOpacity 
                  style={styles.addLoanButton}
                  onPress={async () => {
                    try {
                      await AppOpenAdService.showInterstitial();
                    } catch {}
                    (navigation as any).navigate('AddLoan');
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={20} color="#FFFFFF" />
                  <Text style={styles.addLoanButtonText} allowFontScaling={false}>Add Loan</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              pagingEnabled
              decelerationRate="fast"
              snapToInterval={Dimensions.get('window').width - 48}
              snapToAlignment="start"
              contentContainerStyle={styles.loansCarousel}
              style={styles.loansScrollView}
            >
              {loans.map((loan, index) => (
                <TouchableOpacity 
                  key={loan.id}
                  style={styles.loanContainer}
                  onPress={() => {
                    (navigation as any).navigate('LoanAccount', { loanId: loan.id });
                  }}
                  activeOpacity={0.8}
                >
                  <LoanCard
                    loanName={loan.name || 'Loan'}
                    loanType={loan.type || 'Personal Loan'}
                    lender={loan.lender || 'Unknown Lender'}
                    currentBalance={loan.currentBalance || 0}
                    monthlyPayment={loan.monthlyPayment || 0}
                    interestRate={loan.interestRate || 0}
                    nextPaymentDate={loan.nextPaymentDate || new Date().toISOString()}
                    cardColor={loan.gradientColors?.[0] || undefined}
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Banner Ad above Payment Schedule */}
        {!HIDE_ADS_FOR_SCREENSHOTS && (
        <View style={styles.adContainer}>
          <BannerAdComponent />
        </View>
        )}

        {/* Payment Schedule */}
        <View style={styles.scheduleSection}>
          <LinearGradient
            colors={['#2C5530', '#4A7C59']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.scheduleCard}
          >
            <View style={styles.scheduleHeader}>
              <View style={styles.scheduleIconContainer}>
                <Ionicons name="calendar" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.scheduleHeaderText}>
                <Text style={styles.scheduleTitle} allowFontScaling={false}>Payment Schedule</Text>
                <Text style={styles.scheduleSubtitle} allowFontScaling={false}>Upcoming payments this month</Text>
              </View>
            </View>
            
            <View style={styles.paymentsList}>
              {loans
                .sort((a, b) => new Date(a.nextPaymentDate).getTime() - new Date(b.nextPaymentDate).getTime())
                .map((loan, index) => (
                <TouchableOpacity 
                  key={loan.id} 
                  style={styles.paymentItem}
                  onPress={() => {
                    (navigation as any).navigate('LoanAccount', { loanId: loan.id });
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.paymentLeft}>
                    <View style={[styles.paymentIcon, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                      <Ionicons name={getLoanIcon(loan.type) as any} size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.paymentDetails}>
                      <Text style={styles.paymentLoanName} allowFontScaling={false}>{loan.name}</Text>
                      <Text style={styles.paymentDueDate} allowFontScaling={false}>Due {formatDateWithYear(loan.nextPaymentDate)}</Text>
                    </View>
                  </View>
                  <Text style={styles.paymentAmount} allowFontScaling={false}>{formatCurrency(loan.monthlyPayment)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <View style={styles.totalPaymentContainer}>
              <Text style={styles.totalPaymentLabel} allowFontScaling={false}>Total Monthly Payment</Text>
              <Text style={styles.totalPaymentAmount} allowFontScaling={false}>{formatCurrency(totalMonthlyPayment)}</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Loan Insights */}
        <View style={styles.insightsSection}>
          <LinearGradient
            colors={['#1e3c72', '#2a5298']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.insightsCard}
          >
            <View style={styles.insightsHeader}>
              <View style={styles.insightsIconContainer}>
                <Ionicons name="analytics" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.insightsHeaderText}>
                <Text style={styles.insightsTitle} allowFontScaling={false}>Loan Insights</Text>
                <Text style={styles.insightsSubtitle} allowFontScaling={false}>AI-powered debt analysis</Text>
              </View>
            </View>
            
            <View style={styles.insightsMetrics}>
              <View style={styles.metricBox}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricValue} allowFontScaling={false}>
                    {loans.length > 0 ? Math.round((
                      (loans.reduce((sum: number, l: any) => sum + ((l.principal || 0) - (l.currentBalance || 0)), 0)) /
                      Math.max(1, loans.reduce((sum: number, l: any) => sum + (l.principal || 0), 0))
                    ) * 100) : 0}%
                  </Text>
                  <Text style={styles.metricLabel} allowFontScaling={false}>Overall Progress</Text>
                </View>
                <View style={styles.metricBar}>
                  <View style={[
                    styles.metricBarFill, 
                      {
                        width: `${loans.length > 0 ? Math.round((
                          (loans.reduce((sum: number, l: any) => sum + ((l.principal || 0) - (l.currentBalance || 0)), 0)) /
                          Math.max(1, loans.reduce((sum: number, l: any) => sum + (l.principal || 0), 0))
                        ) * 100) : 0}%`,
                        backgroundColor: '#4ECDC4'
                      }
                  ]} />
                </View>
              </View>

              <View style={styles.metricBox}>
                <View style={styles.metricHeader}>
                  <Text style={styles.metricValue} allowFontScaling={false}>
                    {Math.round((totalBalance / totalMonthlyPayment) / 12 * 10) / 10} years
                  </Text>
                  <Text style={styles.metricLabel} allowFontScaling={false}>Avg. Payoff Time</Text>
                </View>
                <View style={styles.metricBar}>
                  <View style={[
                    styles.metricBarFill, 
                    { 
                      width: '65%',
                      backgroundColor: '#FF6B6B'
                    }
                  ]} />
                </View>
              </View>
            </View>

            <View style={styles.insightsRecommendation}>
              <View style={styles.recommendationIcon}>
                <Ionicons name="bulb" size={16} color="#FFD700" />
              </View>
              <View style={styles.recommendationContent}>
                <Text style={styles.recommendationTitle} allowFontScaling={false}>Smart Recommendation</Text>
                <Text style={styles.recommendationText} allowFontScaling={false}>
                  {totalBalance > 300000 
                    ? "Consider refinancing your home mortgage to reduce monthly payments by up to ₹15,000."
                    : totalBalance > 50000
                    ? "Pay an extra ₹7,500/month on your highest interest loan to save ₹2,62,500 in interest."
                    : "You're on track! Consider setting up autopay to never miss a payment."
                  }
                </Text>
              </View>
            </View>

            <View style={styles.insightsSummary}>
              <View style={styles.summaryItem}>
                <Ionicons name="trending-down" size={16} color="#4ECDC4" />
                <Text style={styles.summaryText} allowFontScaling={false}>Interest saved this year: {formatCurrency(2850)}</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="calendar" size={16} color="#FF6B6B" />
                <Text style={styles.summaryText} allowFontScaling={false}>Next milestone: 15% paid off in 3 months</Text>
              </View>
              <View style={styles.summaryItem}>
                <Ionicons name="checkmark-circle" size={16} color="#FFD700" />
                <Text style={styles.summaryText} allowFontScaling={false}>Payment streak: 18 months on time</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Banner Ad at bottom of screen */}
        {!HIDE_ADS_FOR_SCREENSHOTS && (
        <View style={styles.adContainer}>
          <BannerAdComponent />
        </View>
        )}
      </ScrollView>

      {/* Interstitial modal removed; direct interstitial shown on action */}
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
    paddingHorizontal: 16,
    paddingBottom: 16,
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
  summaryCard: {
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
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  summaryIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  totalBalanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
  },
  totalBalanceLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 20,
  },
  summaryStats: {
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
    marginHorizontal: 8,
  },
  loansSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 16,
  },
  loansScrollView: {
    marginHorizontal: -16,
  },
  loansCarousel: {
    paddingLeft: 16,
    paddingRight: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loanContainer: {
    width: Dimensions.get('window').width - 48,
    marginRight: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    marginHorizontal: 16,
  },
  emptyStateGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  emptyStateIcon: {
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 40,
    padding: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  emptyStateSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  addLoanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 32,
    gap: 10,
  },
  addLoanButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  loanCard: {
    borderRadius: 16,
    padding: 20,
    height: 200,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  loanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  loanTypeContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  loanName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  loanDetails: {
    alignItems: 'center',
    marginBottom: 12,
  },
  currentBalance: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  balanceLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  loanProgress: {
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  progressLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  remainingTerm: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  loanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  paymentInfo: {
    alignItems: 'center',
    flex: 1,
  },
  paymentLabel: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 2,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  paymentDate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  monthlyPayment: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  interestRate: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  adContainer: {
    alignItems: 'center',
    paddingVertical: 4,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  scheduleSection: {
    marginBottom: 24,
  },
  scheduleCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  scheduleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  scheduleHeaderText: {
    flex: 1,
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  scheduleSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  paymentsList: {
    marginBottom: 20,
  },
  paymentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  paymentDetails: {
    flex: 1,
  },
  paymentLoanName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  paymentDueDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  paymentAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  totalPaymentContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalPaymentLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  totalPaymentAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  insightsSection: {
    marginBottom: 24,
  },
  insightsCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 15,
  },
  insightsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  insightsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  insightsHeaderText: {
    flex: 1,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  insightsSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  insightsMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricBox: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  metricHeader: {
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  metricBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  metricBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  insightsRecommendation: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
  },
  recommendationIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recommendationContent: {
    flex: 1,
  },
  recommendationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFD700',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 18,
  },
  insightsSummary: {
    gap: 12,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
  },
  summaryText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 12,
    fontWeight: '500',
  },
});

export default LoansScreen;
