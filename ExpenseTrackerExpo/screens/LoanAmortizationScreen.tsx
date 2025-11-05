import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScroll } from '../context/ScrollContext';
import { LoanService, StoredLoan } from '../services/LoanService';
import { Ionicons } from '@expo/vector-icons';
import { BannerAdComponent } from '../components/AdMobComponents';
import { currency } from '../utils/currencyFormatter';

const { width } = Dimensions.get('window');

interface AmortizationRow {
  paymentNumber: number;
  paymentDate: string;
  beginningBalance: number;
  monthlyPayment: number;
  principalPaid: number;
  interestPaid: number;
  endingBalance: number;
  totalPaid: number;
}

const LoanAmortizationScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const { scrollY } = useScroll();
  const loanId: string | undefined = route.params?.loanId;

  const [loan, setLoan] = useState<StoredLoan | null>(null);
  const [amortizationSchedule, setAmortizationSchedule] = useState<AmortizationRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  
  const styles = createStyles(theme);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const all = await LoanService.getLoans();
        const found = all.find(l => l.id === loanId) || null;
        setLoan(found);
      } catch (error) {
        console.error('Error loading loan:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [loanId]);





  // Generate amortization schedule
  useMemo(() => {
    if (!loan) return;

    const schedule: AmortizationRow[] = [];
    const principal = Number(loan.principal || 0);
    const annualRate = Number(loan.interestRate || 0);
    const monthlyRate = (annualRate / 12) / 100;
    const totalPayments = Number(loan.tenureMonths || Math.round((loan.term || 0) * 12));
    const monthlyPayment = Number(loan.monthlyPayment || 0);
    const startDate = new Date(loan.emiStartDate || loan.nextPaymentDate || new Date());

    let remainingBalance = principal;
    let totalPaid = 0;

    for (let i = 1; i <= totalPayments; i++) {
      const interestPaid = remainingBalance * monthlyRate;
      const principalPaid = monthlyPayment - interestPaid;
      const endingBalance = remainingBalance - principalPaid;
      
      totalPaid += monthlyPayment;

      const paymentDate = new Date(startDate);
      paymentDate.setMonth(startDate.getMonth() + i - 1);

      schedule.push({
        paymentNumber: i,
        paymentDate: paymentDate.toISOString(),
        beginningBalance: Math.round(remainingBalance),
        monthlyPayment: Math.round(monthlyPayment),
        principalPaid: Math.round(principalPaid),
        interestPaid: Math.round(interestPaid),
        endingBalance: Math.round(Math.max(0, endingBalance)),
        totalPaid: Math.round(totalPaid)
      });

      remainingBalance = endingBalance;
    }

    setAmortizationSchedule(schedule);
  }, [loan]);

  // Using centralized currency formatter - currency function imported from utils
  const dateFmt = (iso?: string) => {
    if (!iso) return '--';
    try {
      const d = new Date(iso);
      const day = d.getDate();
      const month = d.toLocaleDateString('en-IN', { month: 'short' });
      const year = d.getFullYear().toString().slice(-2);
      return `${day} ${month} '${year}`;
    } catch { return '--'; }
  };

  if (!loan) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={styles.loadingText} allowFontScaling={false}>Loading...</Text>
      </View>
    );
  }

  const totalInterest = amortizationSchedule.reduce((sum, row) => sum + row.interestPaid, 0);
  const totalPrincipal = Number(loan.principal || 0);
  const totalAmount = totalPrincipal + totalInterest;

  // Header Component
  const ScreenHeader: React.FC<{ theme: any; insets: any; loan: StoredLoan }> = ({ theme, insets, loan }) => {
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
              Amortization Schedule
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              {loan.name}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={() => {
                // TODO: Implement share functionality
                console.log('Share amortization schedule');
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="share-outline" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Safe Area */}
      <ScreenHeader theme={theme} insets={insets} loan={loan} />
      {/* Loading Overlay for Initial Load */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText} allowFontScaling={false}>Loading amortization details...</Text>
          </View>
        </View>
      )}
      <ScrollView 
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={16}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle} allowFontScaling={false}>📊 Loan Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel} allowFontScaling={false}>Principal Amount:</Text>
            <Text style={styles.summaryValue} allowFontScaling={false}>{currency(totalPrincipal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel} allowFontScaling={false}>Total Interest:</Text>
            <Text style={styles.summaryValue} allowFontScaling={false}>{currency(totalInterest)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel} allowFontScaling={false}>Total Amount:</Text>
            <Text style={styles.summaryValue} allowFontScaling={false}>{currency(totalAmount)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel} allowFontScaling={false}>Monthly Payment:</Text>
            <Text style={styles.summaryValue} allowFontScaling={false}>{currency(loan.monthlyPayment)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel} allowFontScaling={false}>Interest Rate:</Text>
            <Text style={styles.summaryValue} allowFontScaling={false}>{Number(loan.interestRate).toFixed(2)}%</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel} allowFontScaling={false}>Loan Term:</Text>
            <Text style={styles.summaryValue} allowFontScaling={false}>{loan.tenureMonths || Math.round((loan.term || 0) * 12)} months</Text>
          </View>
                     <View style={styles.summaryRow}>
             <Text style={styles.summaryLabel} allowFontScaling={false}>Start EMI Date:</Text>
             <Text style={styles.summaryValue} allowFontScaling={false}>{dateFmt(loan.emiStartDate || loan.nextPaymentDate)}</Text>
           </View>
         </View>

         {/* Banner Ad below Loan Summary Card */}
         <View style={styles.adContainer}>
           <BannerAdComponent />
         </View>
         
         

         {/* Amortization Schedule Table */}
         <Text style={styles.tableTitle} allowFontScaling={false}>📅 Payment Schedule</Text>
         

         
         <View style={styles.tableContainer}>
           {/* Horizontal Scrollable Table with Header and Rows Together */}
           <ScrollView 
             horizontal 
             showsHorizontalScrollIndicator={true}
             contentContainerStyle={styles.tableScrollContent}
           >
             {/* Table Header */}
             <View style={styles.tableHeader}>
               <View style={styles.headerRow}>
                 <Text style={styles.headerText} allowFontScaling={false}>#</Text>
                 <Text style={styles.headerText} allowFontScaling={false}>Date</Text>
                 <Text style={styles.headerText} allowFontScaling={false}>Opening Balance</Text>
                 <Text style={styles.headerText} allowFontScaling={false}>Payment</Text>
                 <Text style={styles.headerText} allowFontScaling={false}>Principal</Text>
                 <Text style={styles.headerText} allowFontScaling={false}>Interest</Text>
                 <Text style={styles.headerText} allowFontScaling={false}>Pre/Part Payment</Text>
                 <Text style={styles.headerText} allowFontScaling={false}>Balance</Text>
               </View>
             </View>

             {/* Table Rows - Stacked Vertically */}
             {amortizationSchedule.map((row, index) => {
               const isCompleted = new Date(row.paymentDate) < new Date();
               const isNextEMI = !isCompleted && index === amortizationSchedule.findIndex(r => new Date(r.paymentDate) >= new Date());
               return (
                 <View key={row.paymentNumber} style={[
                   styles.tableRow,
                   isCompleted ? styles.completedRow : 
                   isNextEMI ? styles.nextEMIRow : 
                   (index % 2 === 0 ? styles.evenRow : styles.oddRow)
                 ]}>
                   <View style={styles.cellContainer}>
                     <Text style={styles.cellNumberText} allowFontScaling={false}>#{row.paymentNumber}</Text>
                   </View>
                   <View style={styles.cellContainer}>
                     <Text style={styles.cellDateText} allowFontScaling={false}>{dateFmt(row.paymentDate)}</Text>
                   </View>
                   <View style={styles.cellContainer}>
                     <Text style={styles.cellBalanceText} allowFontScaling={false}>{currency(row.beginningBalance)}</Text>
                   </View>
                   <View style={styles.cellContainer}>
                     <Text style={styles.cellAmountText} allowFontScaling={false}>{currency(row.monthlyPayment)}</Text>
                   </View>
                   <View style={styles.cellContainer}>
                     <Text style={styles.cellPrincipalText} allowFontScaling={false}>{currency(row.principalPaid)}</Text>
                   </View>
                   <View style={styles.cellContainer}>
                     <Text style={styles.cellInterestText} allowFontScaling={false}>{currency(row.interestPaid)}</Text>
                   </View>
                   <View style={styles.cellContainer}>
                     <Text style={styles.cellExtraText} allowFontScaling={false}>₹0</Text>
                   </View>
                   <View style={styles.cellContainer}>
                     <Text style={styles.cellBalanceText} allowFontScaling={false}>{currency(row.endingBalance)}</Text>
                   </View>
                 </View>
               );
             })}
           </ScrollView>
         </View>

         {/* Banner Ad at the end of the screen */}
         <View style={styles.adContainer}>
           <BannerAdComponent />
         </View>
      </ScrollView>
    </View>
  );
};

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  adContainer: {
    alignItems: 'center',
    paddingVertical: 4,
    marginTop: 16,
    marginBottom: 16,
    backgroundColor: 'transparent',
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
  shareButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingText: {
    fontSize: 16,
    color: theme.colors.text,
  },

  // Summary Card Styles
  summaryCard: {
    backgroundColor: '#667eea',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Table Styles
  tableTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 24,
    marginTop: 16,
    textAlign: 'center',
    letterSpacing: 0.5,
  },

  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  tableScrollContent: {
    minWidth: 720, // 8 columns × 90px = 720px total width
    flexDirection: 'column', // Stack rows vertically
  },
  tableHeader: {
    backgroundColor: '#667eea',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginBottom: 8,
    shadowColor: '#667eea',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center', // Center items vertically in the row
    justifyContent: 'center', // Center items horizontally in the row
  },
  headerText: {
    width: 90, // Further reduced column width for tighter spacing
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 0.3,
    paddingHorizontal: 0,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 1,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    minHeight: 45,
    alignItems: 'center',
  },
  evenRow: {
    backgroundColor: '#F8FAFC',
  },
  oddRow: {
    backgroundColor: '#FFFFFF',
  },
  completedRow: {
    backgroundColor: '#F0F9FF', // Light blue background for completed payments
    borderLeftWidth: 3,
    borderLeftColor: '#0EA5E9', // Blue accent border
  },
  nextEMIRow: {
    backgroundColor: '#FEF3C7', // Light yellow background for next EMI
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B', // Amber accent border
  },
  cellContainer: {
    width: 90, // Match header width for alignment
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 0,
  },
  cellNumberText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#667eea',
    textAlign: 'center',
  },
  cellDateText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    textAlign: 'center',
  },
  cellAmountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
    textAlign: 'center',
  },
  cellPrincipalText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
    textAlign: 'center',
  },
  cellInterestText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EA580C',
    textAlign: 'center',
  },
  cellExtraText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7C3AED',
    textAlign: 'center',
  },
  cellBalanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E40AF',
    textAlign: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },

});

export default LoanAmortizationScreen;
