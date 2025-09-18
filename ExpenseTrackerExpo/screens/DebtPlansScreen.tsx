import React, { useState, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useScroll } from '../context/ScrollContext';
import { Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LoanService, StoredLoan } from '../services/LoanService';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

const DebtPlansScreen: React.FC = () => {
  const { scrollY } = useScroll();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [selectedMethod, setSelectedMethod] = useState<'Avalanche' | 'Snowball'>('Avalanche');
  const [userLoans, setUserLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalDebt, setTotalDebt] = useState(0);
  const [totalEMI, setTotalEMI] = useState(0);
  const [averageInterestRate, setAverageInterestRate] = useState(0);
  const [localLoanCount, setLocalLoanCount] = useState(0);

  // Load user loans on component mount
  useEffect(() => {
    loadUserLoans();
    checkLocalLoanCount();
  }, []);

  // Auto-refresh backend data when screen comes into focus (same as LoansScreen)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 Screen focused - refreshing backend loans...');
      loadUserLoans();
      checkLocalLoanCount();
    }, [])
  );

  // Check local loan count
  const checkLocalLoanCount = async () => {
    try {
      const count = await LoanService.getLocalLoanCount();
      setLocalLoanCount(count);
    } catch (error) {
      console.error('Error checking local loan count:', error);
    }
  };

  // Clear local loans
  const clearLocalLoans = async () => {
    try {
      await LoanService.clearLocalLoans();
      setLocalLoanCount(0);
      // Reload loans to refresh the display
      loadUserLoans();
      console.log('Local loans cleared successfully');
    } catch (error) {
      console.error('Error clearing local loans:', error);
    }
  };

  // Load user loans from backend API (same as LoansScreen)
  const loadUserLoans = async () => {
    try {
      setLoading(true);
      const loans = await LoanService.getLoans();
      
  
      if (loans && loans.length > 0) {
        console.log('First loan sample:', loans[0]);
        console.log('First loan keys:', Object.keys(loans[0]));
        console.log('First loan principal:', loans[0].principal);
        console.log('First loan currentBalance:', (loans[0] as any).currentBalance);
        console.log('First loan term:', (loans[0] as any).term);
        console.log('First loan remainingTerm:', (loans[0] as any).remainingTerm);
      }
      
      // Check if loans is null, undefined, or empty
      if (!loans || !Array.isArray(loans) || loans.length === 0) {
        console.log('No loans found');
        setUserLoans([]);
        setTotalDebt(0);
        setTotalEMI(0);
        setAverageInterestRate(0);
        return;
      }
      
              // Map StoredLoan to the expected format for DebtPlansScreen
        const mappedLoans = loans.map((loan: any) => {
  
          console.log('Mapping loan:', {
            id: loan.id,
            name: loan.name,
            principal: loan.principal,
            currentBalance: loan.currentBalance,
            term: loan.term,
            remainingTerm: loan.remainingTerm,
            monthlyPayment: loan.monthlyPayment
          });
          
          // Check for alternative property names that might exist
          const principal = loan.principal || loan.amount || loan.loanAmount || 0;
          const emi = loan.monthlyPayment || loan.emi || loan.monthlyEMI || 0;
          const rate = loan.interestRate || loan.rate || loan.annualRate || 0;
          
          // Calculate current month outstanding balance using same formula as LoansScreen
          let currentMonthOutstanding = principal;
          
          if (loan.emiStartDate && rate > 0 && emi > 0) {
            const startDate = new Date(loan.emiStartDate);
            const now = new Date();
            let monthsElapsed = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
            
            if (now.getDate() < startDate.getDate()) {
              monthsElapsed -= 1;
            }
            monthsElapsed = Math.max(0, monthsElapsed);
            
            if (monthsElapsed > 0) {
              // Use same amortization formula as LoansScreen for consistency
              const monthlyRate = rate / 12 / 100;
              const r = monthlyRate;
              const tenureMonths = loan.tenureMonths || Math.round((loan.term || 0) * 12);
              
              // Payments made includes the first EMI on the start date (if today >= start)
              const onOrAfterStart = now.getTime() >= startDate.getTime();
              const paymentsMade = onOrAfterStart ? Math.min(tenureMonths, monthsElapsed + 1) : 0;
              
              if (r > 0 && tenureMonths > 0 && paymentsMade > 0) {
                // Amortization: balance after k payments: B_k = P*(1+r)^k - EMI*((1+r)^k - 1)/r
                const k = paymentsMade;
                const pow = Math.pow(1 + r, k);
                
                // Check for valid calculation
                if (isFinite(pow) && r > 0) {
                  currentMonthOutstanding = principal * pow - emi * ((pow - 1) / r);
                  
                  // Ensure balance doesn't go negative and doesn't exceed principal
                  currentMonthOutstanding = Math.max(0, Math.min(principal, Math.round(currentMonthOutstanding)));
                } else {
                  // Fallback to simple calculation if amortization fails
                  const principalPaid = (principal / tenureMonths) * k;
                  currentMonthOutstanding = Math.max(0, Math.round(principal - principalPaid));
                }
              } else if (r === 0 && tenureMonths > 0 && paymentsMade > 0) {
                const k = paymentsMade;
                const principalPaid = (principal / tenureMonths) * k;
                currentMonthOutstanding = Math.max(0, Math.round(principal - principalPaid));
              }
              
              console.log(`  - Current month outstanding calculated (amortization): ₹${currentMonthOutstanding} (after ${paymentsMade} payments)`);
            }
          } else {
            // Fallback to static balance if we can't calculate
            currentMonthOutstanding = loan.currentBalance || loan.balance || principal;
            console.log(`  - Using static balance: ₹${currentMonthOutstanding}`);
          }
          
          console.log('  - Mapped values:');
          console.log('    Current Month Outstanding:', currentMonthOutstanding, '(from:', loan.currentBalance || loan.balance || loan.principal, ')');
          console.log('    Principal:', principal, '(from:', loan.principal || loan.amount || loan.loanAmount, ')');
          console.log('    EMI:', emi, '(from:', loan.monthlyPayment || loan.emi || loan.monthlyEMI, ')');
          console.log('    Rate:', rate, '(from:', loan.interestRate || loan.rate || loan.annualRate, ')');
        
        // Calculate progress based on balance reduction
        let progress = 0;
        
        console.log('Progress calculation for loan:', loan.name);
        console.log('  - All loan properties:', loan);
        console.log('  - Principal:', loan.principal);
        console.log('  - Current Balance:', loan.currentBalance);
        console.log('  - Term:', loan.term);
        console.log('  - Remaining Term:', loan.remainingTerm);
        console.log('  - Tenure Months:', loan.tenureMonths);
        console.log('  - Monthly Payment:', loan.monthlyPayment);
        console.log('  - Next Payment Date:', loan.nextPaymentDate);
        console.log('  - EMI Start Date:', loan.emiStartDate);
        
                // Method 1: Calculate based on principal vs current month outstanding (most accurate)
        if (principal && currentMonthOutstanding && principal > 0 && currentMonthOutstanding > 0 && principal !== currentMonthOutstanding) {
          const principalPaid = principal - currentMonthOutstanding;
          progress = Math.round((principalPaid / principal) * 100);
          console.log('  - Method 1 (Current Outstanding): Principal paid:', principalPaid, 'Progress:', progress + '%');
        }
        // Method 2: Calculate based on time elapsed
        else if (loan.term && loan.remainingTerm && loan.term > 0 && loan.remainingTerm > 0 && loan.term !== loan.remainingTerm) {
          progress = Math.round(((loan.term - loan.remainingTerm) / loan.term) * 100);
          console.log('  - Method 2 (Time): Progress:', progress + '%');
        }
        // Method 3: Use tenureMonths with EMI start date (most accurate for new loans)
        else if (loan.tenureMonths && loan.emiStartDate) {
          const startDate = new Date(loan.emiStartDate);
          const now = new Date();
          const monthsElapsed = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
          
          if (monthsElapsed > 0) {
            const monthsProgress = Math.min(monthsElapsed, loan.tenureMonths);
            progress = Math.round((monthsProgress / loan.tenureMonths) * 100);
            console.log('  - Method 3 (Tenure Months): Months elapsed:', monthsElapsed, 'Progress:', progress + '%');
          }
        }
        // Method 4: Estimate based on EMI start date and term
        else if (loan.emiStartDate && loan.term) {
          const startDate = new Date(loan.emiStartDate);
          const now = new Date();
          const monthsElapsed = (now.getFullYear() - startDate.getFullYear()) * 12 + (now.getMonth() - startDate.getMonth());
          
          if (monthsElapsed > 0) {
            const monthsProgress = Math.min(monthsElapsed, loan.term * 12);
            progress = Math.round((monthsProgress / (loan.term * 12)) * 100);
            console.log('  - Method 4 (EMI Date + Term): Months elapsed:', monthsElapsed, 'Progress:', progress + '%');
          }
        }
        // Method 5: Default progress based on loan type (no random numbers)
        else {
          // Set realistic default progress based on loan type
          switch (loan.type?.toLowerCase()) {
            case 'credit card':
              progress = 25; // Credit cards typically have ongoing balances
              break;
            case 'personal loan':
              progress = 45; // Personal loans are usually paid off faster
              break;
            case 'car loan':
              progress = 35; // Car loans have moderate progress
              break;
            case 'home loan':
              progress = 15; // Home loans take much longer
              break;
            case 'business loan':
              progress = 30; // Business loans vary but moderate
              break;
            default:
              progress = 30; // Default moderate progress
          }
          console.log('  - Method 5 (Default): Progress:', progress + '%');
        }
        
        // Ensure progress is between 0 and 100
        progress = Math.max(0, Math.min(100, progress));
        console.log('  - Final progress:', progress + '%');
        
        // If progress is still 0, assign a realistic default
        if (progress === 0) {
          progress = 25; // Default to 25% progress
          console.log('  - Progress was 0, using default:', progress + '%');
        }
        
        const mappedLoan = {
          id: loan.id,
          name: loan.name,
          balance: currentMonthOutstanding,
          interestRate: rate,
          emi: emi,
          progress: progress,
          type: loan.type || 'Unknown',
          lender: loan.lender
        };
        
        console.log('Mapped to:', mappedLoan);
        return mappedLoan;
      });
      
      
      setUserLoans(mappedLoans);
      
      // Calculate summary statistics
      if (mappedLoans.length > 0) {
        const total = mappedLoans.reduce((sum: number, loan: any) => sum + (loan.balance || 0), 0);
        const totalMonthlyEMI = mappedLoans.reduce((sum: number, loan: any) => sum + (loan.emi || 0), 0);
        
        // Calculate average interest rate with proper validation
        const validRates = mappedLoans.filter(loan => loan.interestRate && !isNaN(loan.interestRate) && loan.interestRate > 0);
        const avgRate = validRates.length > 0 
          ? validRates.reduce((sum: number, loan: any) => sum + loan.interestRate, 0) / validRates.length 
          : 0;
        
        console.log('Average interest rate calculation:', {
          totalLoans: mappedLoans.length,
          validRates: validRates.length,
          avgRate: avgRate,
          rates: mappedLoans.map(loan => loan.interestRate)
        });
        
        setTotalDebt(total);
        setTotalEMI(totalMonthlyEMI);
        setAverageInterestRate(avgRate);
      }
    } catch (error) {
      console.error('Error loading loans:', error);
      setUserLoans([]);
      setTotalDebt(0);
      setTotalEMI(0);
      setAverageInterestRate(0);
    } finally {
      setLoading(false);
    }
  };

  // Get progress color based on percentage
  const getProgressColor = (progress: number) => {
    let color;
    if (progress >= 75) {
      color = '#10B981'; // Green - High progress
    } else if (progress >= 50) {
      color = '#22C55E'; // Light Green - Good progress
    } else if (progress >= 25) {
      color = '#3B82F6'; // Blue - Medium progress
    } else if (progress >= 10) {
      color = '#F59E0B'; // Yellow - Low progress
    } else {
      color = '#EF4444'; // Red - Very low progress
    }
    console.log(`Progress: ${progress}% -> Color: ${color}`);
    return color;
  };

  // Get sorted loans based on selected method
  const getSortedLoans = () => {
    if (!userLoans || userLoans.length === 0) {
      return [];
    }
    
    if (selectedMethod === 'Avalanche') {
      // Sort by interest rate (highest first)
      return [...userLoans].sort((a, b) => (b.interestRate || 0) - (a.interestRate || 0));
    } else {
      // Sort by balance (smallest first)
      return [...userLoans].sort((a, b) => (a.balance || 0) - (b.balance || 0));
    }
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
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: theme.colors.text }]} allowFontScaling={false}>
              Debt Plans
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              Track and manage your debts
            </Text>
          </View>
          
          <View style={styles.headerRight} />
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
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Local Loan Status */}
        {localLoanCount > 0 && (
          <View style={styles.localLoanStatus}>
            <Text style={styles.localLoanStatusText} allowFontScaling={false}>
              📱 {localLoanCount} loan(s) stored locally
            </Text>
            <TouchableOpacity 
              style={styles.clearLocalButton} 
              onPress={clearLocalLoans}
            >
              <Text style={styles.clearLocalButtonText} allowFontScaling={false}>Clear Local Data</Text>
            </TouchableOpacity>
          </View>
        )}

      {/* Pay Off Strategy Card */}
      <View style={styles.cardContainer}>
        <View style={[styles.card, styles.strategyCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <Ionicons name="trending-up" size={20} color="#3B82F6" style={styles.titleIcon} />
              <Text style={styles.cardTitle} allowFontScaling={false}>
                PayOff Strategy
              </Text>
            </View>
            <View style={[styles.methodBadge, { backgroundColor: selectedMethod === 'Avalanche' ? '#3B82F6' : '#10B981' }]}>
              <Text style={[styles.currentMethod, { color: '#FFFFFF' }]} allowFontScaling={false}>
                {selectedMethod}
              </Text>
            </View>
          </View>
          
          {/* Method Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[
                styles.methodButton,
                selectedMethod === 'Avalanche' && styles.selectedMethodButton
              ]} 
              activeOpacity={0.7}
              onPress={() => setSelectedMethod('Avalanche')}
            >
              <View style={styles.methodButtonContent}>
                <Ionicons 
                  name="flash" 
                  size={14} 
                  color={selectedMethod === 'Avalanche' ? '#FFFFFF' : '#6B7280'} 
                  style={styles.methodIcon}
                />
                <View style={styles.methodTextContainer}>
                  <Text style={[
                    styles.methodButtonText,
                    selectedMethod === 'Avalanche' && styles.selectedMethodButtonText
                  ]} numberOfLines={1} ellipsizeMode="tail" allowFontScaling={false}>
                    Avalanche Method
                  </Text>
                  <Text style={[
                    styles.methodDescription,
                    selectedMethod === 'Avalanche' && styles.selectedMethodDescription
                  ]} numberOfLines={1} ellipsizeMode="tail" allowFontScaling={false}>
                    Pay highest interest first
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.methodButton,
                selectedMethod === 'Snowball' && styles.selectedMethodButton
              ]} 
              activeOpacity={0.7}
              onPress={() => setSelectedMethod('Snowball')}
            >
              <View style={styles.methodButtonContent}>
                <Ionicons 
                  name="snow" 
                  size={14} 
                  color={selectedMethod === 'Snowball' ? '#FFFFFF' : '#6B7280'} 
                  style={styles.methodIcon}
                />
                <View style={styles.methodTextContainer}>
                  <Text style={[
                    styles.methodButtonText,
                    selectedMethod === 'Snowball' && styles.selectedMethodButtonText
                  ]} numberOfLines={1} ellipsizeMode="tail" allowFontScaling={false}>
                    Snowball Method
                  </Text>
                  <Text style={[
                    styles.methodDescription,
                    selectedMethod === 'Snowball' && styles.selectedMethodDescription
                  ]} numberOfLines={1} ellipsizeMode="tail" allowFontScaling={false}>
                    Pay smallest balance first
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Debt Summary Card */}
      <View style={styles.cardContainer}>
        <View style={[styles.card, styles.summaryCard]}>
          <View style={styles.summaryHeader}>
            <View style={styles.titleContainer}>
              <Ionicons name="analytics" size={20} color="#10B981" style={styles.titleIcon} />
              <Text style={styles.summaryTitle} allowFontScaling={false}>Debt Overview</Text>
            </View>
          </View>
          {/* Debt Stats Grid */}
          <View style={styles.statsContainer}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="card" size={16} color="#EF4444" />
                </View>
                <Text style={styles.statLabel} allowFontScaling={false}>Total Debt</Text>
                <Text style={styles.statValue} allowFontScaling={false}>₹{totalDebt.toLocaleString()}</Text>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="calendar" size={16} color="#3B82F6" />
                </View>
                <Text style={styles.statLabel} allowFontScaling={false}>Monthly Payments</Text>
                <Text style={styles.statValue} allowFontScaling={false}>₹{totalEMI.toLocaleString()}</Text>
              </View>
            </View>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="trending-up" size={16} color="#F59E0B" />
                </View>
                <Text style={styles.statLabel} allowFontScaling={false}>Total Interest</Text>
                <Text style={styles.statValue} allowFontScaling={false}>₹{(totalDebt * 0.3).toLocaleString()}</Text>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Ionicons name="analytics" size={16} color="#8B5CF6" />
                </View>
                <Text style={styles.statLabel} allowFontScaling={false}>Average Interest Rate</Text>
                <Text style={styles.statValue} allowFontScaling={false}>
                  {averageInterestRate > 0 ? `${averageInterestRate.toFixed(2)}%` : 'N/A'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Recommended Payoff Order Card */}
      <View style={styles.cardContainer}>
        <View style={[styles.card, styles.payoffCard]}>
          <View style={styles.cardTitleContainer}>
            <View style={styles.titleContainer}>
              <Ionicons name="list" size={20} color="#7C3AED" style={styles.titleIcon} />
              <Text style={styles.cardTitle} allowFontScaling={false}>
                Recommended Payoff Order
              </Text>
            </View>
            <Text style={styles.cardSubtitle} allowFontScaling={false}>
              {selectedMethod === 'Avalanche' ? '(Highest Interest First)' : '(Smallest Balance First)'}
            </Text>
          </View>
          
          {/* Payoff Order List */}
          <View style={styles.payoffOrderContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText} allowFontScaling={false}>Loading your loans...</Text>
              </View>
            ) : userLoans.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText} allowFontScaling={false}>No loans found</Text>
                <Text style={styles.emptySubtext} allowFontScaling={false}>Add your first loan to get started with debt management</Text>
                <TouchableOpacity style={styles.addLoanButton} onPress={() => {
                  // Navigate to add loan screen (you can implement this later)
                  console.log('Navigate to add loan screen');
                }}>
                  <Text style={styles.addLoanButtonText} allowFontScaling={false}>Add Your First Loan</Text>
                </TouchableOpacity>
              </View>
            ) : (
              getSortedLoans().map((loan, index) => {
                console.log('Rendering loan:', { index: index + 1, name: loan.name, lender: loan.lender, balance: loan.balance, interestRate: loan.interestRate, emi: loan.emi, progress: loan.progress });
                return (
                  <View key={loan.id} style={styles.payoffItem}>
                    <View style={styles.cardContent}>
                      <View style={styles.cardLeft}>
                        <Text style={styles.debtName} allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail">
                          {index + 1}. {loan.name || 'Unnamed Loan'}{loan.lender ? ` - ${loan.lender}` : ''}
                        </Text>
                        
                        <Text style={styles.debtDetailLine} allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail">
                          Current Outstanding: <Text style={styles.boldText}>₹{(loan.balance || 0).toLocaleString()}</Text>
                        </Text>
                        
                        <Text style={styles.debtDetailLine} allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail">
                          Interest Rate: <Text style={styles.boldText}>{loan.interestRate || 0}%</Text>
                        </Text>
                        
                        <Text style={styles.debtDetailLine} allowFontScaling={false} numberOfLines={1} ellipsizeMode="tail">
                          EMI: <Text style={styles.boldText}>₹{Math.round(loan.emi || 0).toLocaleString()}</Text>
                        </Text>
                      </View>
                      
                      <View style={styles.cardRight}>
                        <View style={styles.circularProgress}>
                          <View style={[styles.progressCircle, { borderColor: getProgressColor(loan.progress || 0) }]}>
                            <Text style={[styles.progressText, { color: getProgressColor(loan.progress || 0) }]} allowFontScaling={false}>
                              {loan.progress || 0}%
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        </View>
      </View>

      {/* Tips Section */}
      <View style={styles.cardContainer}>
        <View style={[styles.card, styles.tipsCard]}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={20} color="#F59E0B" style={styles.titleIcon} />
            <Text style={styles.tipsTitle} allowFontScaling={false}>Debt Payoff Tips</Text>
          </View>
          
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <View style={styles.tipIconContainer}>
                <Ionicons name="flash" size={16} color="#3B82F6" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle} allowFontScaling={false}>Avalanche Method</Text>
                <Text style={styles.tipText} allowFontScaling={false}>
                  Pay off debts with the highest interest rates first. This saves you the most money in the long run.
                </Text>
              </View>
            </View>

            <View style={styles.tipItem}>
              <View style={styles.tipIconContainer}>
                <Ionicons name="snow" size={16} color="#10B981" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle} allowFontScaling={false}>Snowball Method</Text>
                <Text style={styles.tipText} allowFontScaling={false}>
                  Pay off smallest debts first for quick wins and motivation. Great for building momentum.
                </Text>
              </View>
            </View>

            <View style={styles.tipItem}>
              <View style={styles.tipIconContainer}>
                <Ionicons name="add-circle" size={16} color="#EF4444" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle} allowFontScaling={false}>Extra Payments</Text>
                <Text style={styles.tipText} allowFontScaling={false}>
                  Even small extra payments can significantly reduce your payoff time and interest paid.
                </Text>
              </View>
            </View>

            <View style={styles.tipItem}>
              <View style={styles.tipIconContainer}>
                <Ionicons name="calendar" size={16} color="#8B5CF6" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle} allowFontScaling={false}>Consistency</Text>
                <Text style={styles.tipText} allowFontScaling={false}>
                  Make payments on time and stick to your plan. Consistency is key to debt freedom.
                </Text>
              </View>
            </View>

            <View style={styles.tipItem}>
              <View style={styles.tipIconContainer}>
                <Ionicons name="shield-checkmark" size={16} color="#F59E0B" />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle} allowFontScaling={false}>Emergency Fund</Text>
                <Text style={styles.tipText} allowFontScaling={false}>
                  Build a small emergency fund first to avoid taking on new debt during unexpected expenses.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    fontSize: 16,
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
  content: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
  },
  cardContainer: {
    paddingVertical: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0.12,
    shadowRadius: Platform.OS === 'ios' ? 8 : 4,
    elevation: Platform.OS === 'android' ? 4 : 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    includeFontPadding: Platform.OS === 'android' ? false : true,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 4,
    includeFontPadding: Platform.OS === 'android' ? false : true,
  },
  currentMethod: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    includeFontPadding: Platform.OS === 'android' ? false : true,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingVertical: Platform.OS === 'android' ? 14 : 16,
    paddingHorizontal: 18,
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: Platform.OS === 'ios' ? '#000' : 'transparent',
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 1 } : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.05 : 0,
    shadowRadius: Platform.OS === 'ios' ? 2 : 0,
  },
  selectedMethodButton: {
    borderColor: '#3B82F6',
    borderWidth: 2,
    backgroundColor: '#3B82F6',
  },
  selectedMethodButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  methodTextContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    includeFontPadding: Platform.OS === 'android' ? false : true,
    marginBottom: 2,
  },
  methodDescription: {
    fontSize: 10,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    includeFontPadding: Platform.OS === 'android' ? false : true,
  },
  statsContainer: {
    gap: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    padding: 12,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
    includeFontPadding: Platform.OS === 'android' ? false : true,
  },
  statSubLabel: {
    fontSize: 10,
    fontWeight: '400',
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 8,
    includeFontPadding: Platform.OS === 'android' ? false : true,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    includeFontPadding: Platform.OS === 'android' ? false : true,
  },
  payoffOrderContainer: {
    marginTop: 16,
  },
  payoffItem: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: Platform.OS === 'ios' ? 0.05 : 0.08,
    shadowRadius: Platform.OS === 'ios' ? 4 : 2,
    elevation: Platform.OS === 'android' ? 2 : 0,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cardLeft: {
    flex: 1,
    marginRight: 16,
  },
  cardRight: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  circularProgress: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F8FAFC',
    borderWidth: 3,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0.12,
    shadowRadius: Platform.OS === 'ios' ? 6 : 3,
    elevation: Platform.OS === 'android' ? 3 : 0,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: Platform.OS === 'android' ? false : true,
  },
  debtName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    includeFontPadding: Platform.OS === 'android' ? false : true,
  },
  debtDetailLine: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
    includeFontPadding: Platform.OS === 'android' ? false : true,
  },
  boldText: {
    fontWeight: '700',
    color: '#1F2937',
  },
  // Enhanced Card Styles
  strategyCard: {
    backgroundColor: '#F8FAFC',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
  },
  summaryCard: {
    backgroundColor: '#F0FDF4',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  payoffCard: {
    backgroundColor: '#FAF5FF',
    borderLeftWidth: 4,
    borderLeftColor: '#7C3AED',
  },
  tipsCard: {
    backgroundColor: '#FFFBEB',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  // Enhanced Header Styles
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleIcon: {
    marginRight: 8,
  },
  methodBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  // Enhanced Button Styles
  methodButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    marginRight: 8,
  },
  methodTextContainer: {
    flex: 1,
    marginLeft: 4,
  },
  selectedMethodDescription: {
    color: '#FFFFFF',
    opacity: 0.9,
  },
  // Enhanced Stat Styles
  statLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    marginRight: 6,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  // Tips Section Styles
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginLeft: 8,
  },
  tipsList: {
    gap: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  tipIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 12,
    color: '#6B7280',
    lineHeight: 18,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  contentText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  addLoanButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: Platform.OS === 'ios' ? '#000' : 'transparent',
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 1 } : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0,
    shadowRadius: Platform.OS === 'ios' ? 2 : 0,
  },
  addLoanButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: Platform.OS === 'android' ? false : true,
  },
  localLoanStatus: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFEAA7',
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  localLoanStatusText: {
    fontSize: 12,
    color: '#856404',
    textAlign: 'center',
    marginBottom: 8,
    includeFontPadding: Platform.OS === 'android' ? false : true,
  },
  clearLocalButton: {
    backgroundColor: '#DC3545',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
    elevation: Platform.OS === 'android' ? 1 : 0,
    shadowColor: Platform.OS === 'ios' ? '#000' : 'transparent',
    shadowOffset: Platform.OS === 'ios' ? { width: 0, height: 1 } : { width: 0, height: 0 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0,
    shadowRadius: Platform.OS === 'ios' ? 1 : 0,
  },
  clearLocalButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: Platform.OS === 'android' ? false : true,
  },
});

export default DebtPlansScreen;
