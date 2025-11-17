import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Alert,
  Animated,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useScroll } from '../context/ScrollContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import WheelDatePicker from '../components/WheelDatePicker';
import { BannerAdComponent } from '../components/AdMobComponents';
import AppOpenAdService from '../services/AppOpenAdService';
import { formatCurrency, formatNumber, formatIndianNumberInput } from '../utils/currencyFormatter';

const { width } = Dimensions.get('window');

interface LoanCalculation {
  principal: number;
  interestRate: number;
  term: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
}

interface AmortizationEntry {
  period: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

const MAX_LOAN_AMOUNT = 1000000000; // ₹1,000,000,000 (1 Billion)
const MAX_INTEREST_RATE = 50; // Maximum 50%

const LoanCalculatorScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { scrollY } = useScroll();
  const navigation = useNavigation();
  
  const [loanAmount, setLoanAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [loanTerm, setLoanTerm] = useState('');
  const [termType, setTermType] = useState<'years' | 'months'>('years');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calculation, setCalculation] = useState<LoanCalculation | null>(null);
  const [amortization, setAmortization] = useState<AmortizationEntry[]>([]);
  const [showAmortization, setShowAmortization] = useState(false);
  const [isCalculating, setIsCalculating] = useState(false);
  // Removed mock interstitial state

  const calculateLoan = () => {
    const amount = parseFloat(loanAmount);
    const rate = parseFloat(interestRate);
    const term = parseFloat(loanTerm);
    
    if (!amount || !rate || !term) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (amount <= 0 || rate < 0 || term <= 0) {
      Alert.alert('Error', 'Please enter valid positive numbers');
      return;
    }

    if (amount > MAX_LOAN_AMOUNT) {
      Alert.alert(
        'Limit Exceeded',
        'We currently support loan calculations up to ₹1,000,000,000 (1 Billion).'
      );
      return;
    }

    if (rate > MAX_INTEREST_RATE) {
      Alert.alert(
        'Limit Exceeded',
        `Interest rate cannot exceed ${MAX_INTEREST_RATE}%.`
      );
      return;
    }

    setIsCalculating(true);

    // Convert to monthly values
    const monthlyRate = rate / 100 / 12;
    const totalMonths = termType === 'years' ? term * 12 : term;

    let monthlyPayment: number;
    let totalPayment: number;
    let totalInterest: number;
      
      if (monthlyRate === 0) {
      // Handle zero interest rate
      monthlyPayment = amount / totalMonths;
      totalPayment = amount;
      totalInterest = 0;
    } else {
      // Standard loan calculation
      monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1);
      
      totalPayment = monthlyPayment * totalMonths;
      totalInterest = totalPayment - amount;
    }

    const result: LoanCalculation = {
      principal: amount,
      interestRate: rate,
      term: termType === 'years' ? term : term / 12,
          monthlyPayment,
          totalPayment,
          totalInterest,
        };

    setCalculation(result);

    // Generate amortization schedule
    generateAmortizationSchedule(amount, monthlyRate, totalMonths, monthlyPayment);
    setShowAmortization(true);

    setIsCalculating(false);
  };

  const generateAmortizationSchedule = (principal: number, monthlyRate: number, totalMonths: number, monthlyPayment: number) => {
    const schedule: AmortizationEntry[] = [];
    let balance = principal;

    for (let i = 1; i <= totalMonths; i++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;

      schedule.push({
        period: i,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance),
      });
    }

    setAmortization(schedule);
  };


  // Using centralized currency formatter - formatCurrency and formatNumber imported from utils

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
              Loan Calculator
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              Calculate your loan payments
            </Text>
          </View>
          
          <View style={styles.headerRight} />
        </View>
      </View>
    );
  };

  const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
      backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
    content: {
      padding: 20,
      paddingBottom: 40,
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
    section: {
      marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
    marginBottom: 20,
    },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
      color: theme.colors.text,
      marginBottom: 8,
    },
  inputHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    marginBottom: 8,
  },
  // New inline text border styles
  outlinedInputContainer: {
    position: 'relative',
  },
  floatingLabel: {
    position: 'absolute',
    top: -8,
    left: 12,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 4,
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
    zIndex: 1,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'android' ? 8 : 16,
    height: 56,
  },
  currencySymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: 8,
    lineHeight: Platform.OS === 'android' ? 32 : undefined,
    textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    textAlignVertical: 'center',
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
    marginVertical: 0,
    includeFontPadding: false,
    lineHeight: Platform.OS === 'android' ? 32 : undefined,
  },
  rateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'android' ? 8 : 16,
    height: 56,
  },
  rateInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    textAlignVertical: 'center',
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
    marginVertical: 0,
    includeFontPadding: false,
    lineHeight: Platform.OS === 'android' ? 32 : undefined,
  },
  percentSymbol: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 8,
    lineHeight: Platform.OS === 'android' ? 32 : undefined,
    textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
  },
  termContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'android' ? 8 : 16,
    height: 56,
    justifyContent: 'space-between',
  },
  termInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    textAlignVertical: 'center',
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
    marginVertical: 0,
    includeFontPadding: false,
    lineHeight: Platform.OS === 'android' ? 32 : undefined,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
    borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 16,
    paddingVertical: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
      color: theme.colors.text,
      padding: 0,
  },
  termTypeContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 3,
    marginLeft: 12,
  },
  termTypeButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
    minHeight: 32,
  },
  termTypeButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  termTypeText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  termTypeTextActive: {
    color: '#FFFFFF',
  },
   adContainer: {
     alignItems: 'center',
     paddingVertical: 4,
     marginTop: 16,
     marginBottom: 16,
     backgroundColor: 'transparent',
   },
   buttonContainer: {
     marginTop: 20,
   },
    primaryButton: {
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
      color: '#FFFFFF',
    },
    resultsCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 16,
    padding: 20,
      marginTop: 20,
    borderWidth: 1,
      borderColor: theme.colors.border,
    },
    resultsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
  resultRow: {
    flexDirection: 'row',
      justifyContent: 'space-between',
    alignItems: 'center',
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
  },
  resultLabel: {
      fontSize: 14,
      color: theme.colors.textSecondary,
  },
  resultValue: {
    fontSize: 14,
    fontWeight: '600',
      color: theme.colors.text,
    },
    amortizationCard: {
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      paddingTop: 16,
      paddingBottom: 16,
      paddingLeft: 8,
      paddingRight: 16,
      marginTop: 20,
    borderWidth: 1,
      borderColor: theme.colors.border,
      ...Platform.select({
        ios: {
    shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        android: {
          elevation: 3,
        },
      }),
    },
    amortizationTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
      marginBottom: 16,
      textAlign: 'center',
    },
    amortizationTable: {
      marginTop: 0,
    },
    tableHeader: {
    flexDirection: 'row',
      backgroundColor: theme.colors.surface,
      paddingVertical: 12,
      paddingLeft: 0,
      paddingRight: 8,
      borderRadius: 8,
      marginBottom: 8,
    },
    tableHeaderText: {
    flex: 1,
    fontSize: 12,
      fontWeight: '600',
      color: theme.colors.textSecondary,
      textAlign: 'center',
      paddingHorizontal: 2,
  },
    tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
      paddingLeft: 0,
      paddingRight: 8,
    borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    tableCell: {
      flex: 1,
      fontSize: 12,
      color: theme.colors.text,
    textAlign: 'center',
      paddingHorizontal: 2,
    },
    periodColumn: {
      flex: 0.7,
      textAlign: 'left',
      paddingLeft: 0,
    },
    loadingContainer: {
    alignItems: 'center',
      paddingVertical: 20,
    },
    loadingText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 10,
    },
  });

  const styles = createStyles(theme);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header with Safe Area */}
      <ScreenHeader theme={theme} insets={insets} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.content}>

          {/* Loan Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Loan Details</Text>
            
            {/* Loan Amount */}
            <View style={styles.inputGroup}>
              <View style={styles.outlinedInputContainer}>
                <Text style={styles.floatingLabel} allowFontScaling={false}>Loan Amount</Text>
                <View style={styles.amountContainer}>
                  <Text style={styles.currencySymbol} allowFontScaling={false}>₹</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={formatIndianNumberInput(loanAmount)}
                    onChangeText={(text) => {
                      const sanitizedInput = text.replace(/,/g, '');
                      const sanitized = sanitizedInput.replace(/[^0-9.]/g, '');
                      const parts = sanitized.split('.');
                      if (parts.length > 2) {
                        return;
                      }
                      const integerPart = parts[0];
                      const decimalPart = parts[1] ? parts[1].slice(0, 2) : '';
                      const normalized = decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
                      setLoanAmount(normalized);
                    }}
                    placeholder="Enter loan amount"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="numeric"
                    maxLength={12}
                    allowFontScaling={false}
                  />
                </View>
              </View>
            </View>

            {/* Interest Rate */}
            <View style={styles.inputGroup}>
              <View style={styles.outlinedInputContainer}>
                <Text style={styles.floatingLabel} allowFontScaling={false}>Annual Interest Rate</Text>
                <View style={styles.rateContainer}>
                  <TextInput
                    style={styles.rateInput}
                    value={interestRate}
                    onChangeText={setInterestRate}
                    placeholder="Enter interest rate"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="numeric"
                    maxLength={5}
                    allowFontScaling={false}
                  />
                  <Text style={styles.percentSymbol} allowFontScaling={false}>%</Text>
                </View>
              </View>
            </View>

            {/* Loan Term */}
            <View style={styles.inputGroup}>
              <View style={styles.outlinedInputContainer}>
                <Text style={styles.floatingLabel} allowFontScaling={false}>Loan Term</Text>
                <View style={styles.termContainer}>
                  <TextInput
                    style={styles.termInput}
                    value={loanTerm}
                    onChangeText={setLoanTerm}
                    placeholder="Enter loan term"
                    placeholderTextColor={theme.colors.textSecondary}
                    keyboardType="numeric"
                    maxLength={3}
                    allowFontScaling={false}
                  />
                  <View style={styles.termTypeContainer}>
                    <TouchableOpacity
                      style={[
                        styles.termTypeButton,
                        termType === 'years' && styles.termTypeButtonActive
                      ]}
                      onPress={() => setTermType('years')}
                    >
                      <Text style={[
                        styles.termTypeText,
                        termType === 'years' && styles.termTypeTextActive
                      ]} allowFontScaling={false}>
                        Years
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.termTypeButton,
                        termType === 'months' && styles.termTypeButtonActive
                      ]}
                      onPress={() => setTermType('months')}
                    >
                      <Text style={[
                        styles.termTypeText,
                        termType === 'months' && styles.termTypeTextActive
                      ]} allowFontScaling={false}>
                        Months
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

            {/* Custom Date Picker */}
            <WheelDatePicker
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              label="Select Date"
              placeholder="Choose a date"
            />
          </View>

          {/* Banner Ad above Calculate Loan Button */}
          <View style={styles.adContainer}>
            <BannerAdComponent />
          </View>

           {/* Action Button */}
           <View style={styles.buttonContainer}>
             <TouchableOpacity 
               style={styles.primaryButton} 
               onPress={async () => {
                 Keyboard.dismiss(); // Dismiss keyboard when calculate button is pressed
                 try { await AppOpenAdService.showInterstitial(); } catch {}
                 calculateLoan();
               }}
               disabled={isCalculating}
             >
               <Text style={styles.primaryButtonText}>
                 {isCalculating ? 'Calculating...' : 'Calculate Loan'}
               </Text>
             </TouchableOpacity>
           </View>

          {/* Loading State */}
          {isCalculating && (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Calculating loan details...</Text>
            </View>
          )}

          {/* Results Section */}
          {calculation && (
            <View style={styles.resultsCard}>
              <Text style={styles.resultsTitle}>Loan Calculation Results</Text>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Monthly Payment</Text>
                <Text style={styles.resultValue}>
                  {formatCurrency(calculation.monthlyPayment)}
                </Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Loan Amount</Text>
                <Text style={styles.resultValue}>
                  {formatCurrency(parseFloat(loanAmount) || 0)}
                </Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Total Interest</Text>
                <Text style={styles.resultValue}>
                  {formatCurrency(calculation.totalInterest)}
                </Text>
              </View>
              
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Total Payment</Text>
                <Text style={styles.resultValue}>
                  {formatCurrency(calculation.totalPayment)}
                </Text>
              </View>

            </View>
          )}

          {/* Banner Ad between Results and Amortization Schedule */}
          {calculation && showAmortization && amortization.length > 0 && (
            <View style={styles.adContainer}>
              <BannerAdComponent />
            </View>
          )}

          {/* Amortization Schedule */}
          {showAmortization && amortization.length > 0 && (
            <View style={styles.amortizationCard}>
              <Text style={styles.amortizationTitle}>Amortization Schedule</Text>
              <View style={styles.amortizationTable}>
                <View style={styles.tableHeader}>
                  <Text style={[styles.tableHeaderText, styles.periodColumn]}>Period</Text>
                  <Text style={styles.tableHeaderText}>Payment</Text>
                  <Text style={styles.tableHeaderText}>Principal</Text>
                  <Text style={styles.tableHeaderText}>Interest</Text>
                  <Text style={styles.tableHeaderText}>Balance</Text>
                </View>
                
                {amortization.map((entry, index) => (
                  <View key={index} style={styles.tableRow}>
                    <Text style={[styles.tableCell, styles.periodColumn]}>{entry.period}</Text>
                    <Text style={styles.tableCell}>{formatCurrency(entry.payment)}</Text>
                    <Text style={styles.tableCell}>{formatCurrency(entry.principal)}</Text>
                    <Text style={styles.tableCell}>{formatCurrency(entry.interest)}</Text>
                    <Text style={styles.tableCell}>{formatCurrency(entry.balance)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Interstitial modal removed; direct interstitial shown before calculate */}
    </KeyboardAvoidingView>
  );
};

export default LoanCalculatorScreen;