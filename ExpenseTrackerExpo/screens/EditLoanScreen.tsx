import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, useWindowDimensions, Alert } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LoanService, StoredLoan } from '../services/LoanService';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

interface RouteParams {
  loanId: string;
  loanData?: StoredLoan;
}

const EditLoanScreen: React.FC = () => {
    const { theme } = useTheme();
    const { width } = useWindowDimensions();
    const isWide = width >= 768; // 2-column on tablets/large screens
    const navigation = useNavigation();
    const route = useRoute();
    const { loanId, loanData } = route.params as RouteParams;
    const insets = useSafeAreaInsets();
    
    // State for loan data
    const [loan, setLoan] = useState<StoredLoan | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    
    // Form state - will be populated after fetching data
    const [name, setName] = useState('');
    const [type, setType] = useState<string>('');
    const [lender, setLender] = useState('');
    const [principal, setPrincipal] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [termYears, setTermYears] = useState('');
    const [tenureUnit, setTenureUnit] = useState<'Months' | 'Years'>('Years');
    const [typeOpen, setTypeOpen] = useState(false);
    const [emiStartDate, setEmiStartDate] = useState('');
    const [emiDate, setEmiDate] = useState<Date | null>(null);
    const [showEmiDatePicker, setShowEmiDatePicker] = useState(false);

    const styles = createStyles(theme);

    // Use passed loan data or fetch from service
    useEffect(() => {
        const initializeLoan = async () => {
            try {
                setIsLoading(true);
                
                let loanDataToUse: StoredLoan;
                
                // First try to use the passed data
                if (loanData) {
                    loanDataToUse = loanData;
                    setLoan(loanData);
                } else {
                    // Fallback: try to get from the service
                    try {
                        const loans = await LoanService.getLoans();
                        const foundLoan = loans.find(l => l.id === loanId);
                        
                        if (foundLoan) {
                            loanDataToUse = foundLoan;
                            setLoan(foundLoan);
                        } else {
                            throw new Error('Loan not found');
                        }
                    } catch (serviceError) {
                        console.error('Service Error fetching loan:', serviceError);
                        Alert.alert(
                            'Error',
                            'Unable to load loan data. Please try again.',
                            [
                                {
                                    text: 'OK',
                                    onPress: () => (navigation as any).goBack()
                                }
                            ]
                        );
                        return;
                    }
                }
                
                // Populate form with existing data
                setName(loanDataToUse.name || '');
                setType(loanDataToUse.type || '');
                setLender(loanDataToUse.lender || '');
                setPrincipal(String(loanDataToUse.principal ?? ''));
                setInterestRate(String(loanDataToUse.interestRate ?? ''));
                
                const months = Number(loanDataToUse.tenureMonths || Math.round((loanDataToUse.term || 0) * 12));
                if (!isNaN(months) && months > 0) {
                    if (months % 12 === 0) {
                        setTenureUnit('Years');
                        setTermYears(String(months / 12));
                    } else {
                        setTenureUnit('Months');
                        setTermYears(String(months));
                    }
                } else {
                    setTenureUnit('Years');
                    setTermYears('');
                }
                
                const startIso = loanDataToUse.emiStartDate || loanDataToUse.nextPaymentDate;
                if (startIso) {
                    const d = new Date(startIso);
                    setEmiDate(d);
                    const y = d.getFullYear();
                    const m = String(d.getMonth() + 1).padStart(2, '0');
                    const da = String(d.getDate()).padStart(2, '0');
                    setEmiStartDate(`${y}-${m}-${da}`);
                } else {
                    setEmiDate(null);
                    setEmiStartDate('');
                }
            } catch (error) {
                console.error('Error initializing loan:', error);
                Alert.alert('Error', 'Failed to load loan data');
            } finally {
                setIsLoading(false);
            }
        };

        initializeLoan();
    }, [loanId, loanData, navigation]);

    // Update header title
    useEffect(() => {
        (navigation as any).setOptions?.({ title: 'Edit Loan' });
    }, [navigation]);

    const isValid = useMemo(() => {
        const amount = Number(principal);
        const rate = Number(interestRate);
        const tenureNum = Number(termYears);
        return (
            name.trim().length > 0 &&
            type.trim().length > 0 &&
            lender.trim().length > 0 &&
            principal.trim().length > 0 && !isNaN(amount) && amount > 0 &&
            interestRate.trim().length > 0 && !isNaN(rate) && rate >= 0 &&
            termYears.trim().length > 0 && !isNaN(tenureNum) && tenureNum > 0 &&
            emiStartDate.trim().length > 0
        );
    }, [name, type, lender, principal, interestRate, termYears, emiStartDate]);

    // Monthly amount: EMI for bank-type loans; Monthly Interest for Gold/Private lending
    const isInterestOnly = useMemo(() => {
        return type === 'Gold Loan' || type === 'Private Money Lending';
    }, [type]);

    const monthlyAmount = useMemo(() => {
        const P = Number(principal);
        const annualRate = Number(interestRate);
        const tenureNum = Number(termYears);
        if (!isFinite(P) || P <= 0) return null;
        if (!isFinite(annualRate) || annualRate < 0) return null;
        const r = (annualRate / 12) / 100; // monthly rate
        if (isInterestOnly) {
            return P * r; // interest-only per month
        }
        if (!isFinite(tenureNum) || tenureNum <= 0) return null;
        const n = tenureUnit === 'Years' ? Math.round(tenureNum * 12) : Math.round(tenureNum);
        if (n <= 0) return null;
        if (r === 0) {
            return P / n;
        }
        const pow = Math.pow(1 + r, n);
        const emi = (P * r * pow) / (pow - 1);
        return emi;
    }, [principal, interestRate, termYears, tenureUnit, isInterestOnly]);

    const monthlyLabel = isInterestOnly ? 'Monthly Interest' : 'Monthly EMI';

    const formattedMonthly = useMemo(() => {
        if (monthlyAmount == null || !isFinite(monthlyAmount)) return '--';
        return Math.round(monthlyAmount).toLocaleString(undefined, { maximumFractionDigits: 0 });
    }, [monthlyAmount]);

    const handleSubmit = async () => {
        if (isValid && loan) {
            try {
                const updatedLoan = await LoanService.updateLoan(loanId, (prevLoan) => {
                    const updatedLoan = {
                        ...prevLoan,
                        name: name.trim(),
                        type: type.trim(),
                        lender: lender.trim(),
                        principal: Number(principal),
                        interestRate: Number(interestRate),
                        term: tenureUnit === 'Years' ? Number(termYears) : Number(termYears) / 12,
                        tenureMonths: tenureUnit === 'Years' ? Number(termYears) * 12 : Number(termYears),
                        emiStartDate: emiStartDate,
                        monthlyPayment: monthlyAmount || 0,
                        isInterestOnly: isInterestOnly
                    };
                    return updatedLoan;
                });
                
                // Replace current screen with loans list to clear the stack
                (navigation as any).replace('Loans');
            } catch (error: any) {
                console.error('Error updating loan:', error);
                Alert.alert(
                    'Error',
                    'Failed to update loan. Please try again.',
                    [{ text: 'OK' }]
                );
            }
        }
    };

    const handleEmiDateChange = (event: any, selectedDate?: Date) => {
        setShowEmiDatePicker(false);
        if (selectedDate) {
            setEmiDate(selectedDate);
            const y = selectedDate.getFullYear();
            const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
            const d = String(selectedDate.getDate()).padStart(2, '0');
            setEmiStartDate(`${y}-${m}-${d}`);
        }
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText} allowFontScaling={false}>Loading loan data...</Text>
                </View>
            </View>
        );
    }

    if (!loan) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorTitle} allowFontScaling={false}>Loan Not Found</Text>
                    <Text style={styles.errorSubtitle} allowFontScaling={false}>The requested loan could not be found</Text>
                </View>
            </View>
        );
    }

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
                            Edit Loan
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
                            Update loan details
                        </Text>
                    </View>
                    
                    <View style={styles.headerRight}>
                        <TouchableOpacity 
                            style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
                            onPress={handleSaveLoan}
                            disabled={!isValid}
                            activeOpacity={0.7}
                        >
                            <Ionicons 
                                name="checkmark" 
                                size={24} 
                                color={isValid ? "#FFFFFF" : "#9CA3AF"} 
                            />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    };

    const handleSaveLoan = async () => {
        if (!isValid) return;

        try {
            const loanData = {
                name: name.trim(),
                type: type,
                lender: lender.trim(),
                principal: Number(principal),
                interestRate: Number(interestRate),
                term: tenureUnit === 'Years' ? Number(termYears) * 12 : Number(termYears),
                termYears: Number(termYears),
                termUnit: tenureUnit,
                emiStartDate: emiStartDate,
                emiDate: emiDate,
                monthlyPayment: calculateEMI(),
                remainingTerm: tenureUnit === 'Years' ? Number(termYears) * 12 : Number(termYears),
                currentBalance: Number(principal),
                gradientColors: ['#667eea', '#764ba2'],
            };

            await LoanService.updateLoan(loanId, loanData);
            
            // Navigate back with refresh flag
            (navigation as any).navigate('LoanAccount', { 
                loanId: loanId,
                refresh: true 
            });
        } catch (error) {
            console.error('Error updating loan:', error);
            Alert.alert('Error', 'Failed to update loan. Please try again.');
        }
    };

      return (
        <View style={styles.container}>
            {/* Header with Safe Area */}
            <ScreenHeader theme={theme} insets={insets} loan={loan} />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View>
        {/* Loan Name */}
        <View style={[styles.formGroup, styles.firstFormGroup]}>
          <Text style={styles.label} allowFontScaling={false}>Loan Name<Text style={styles.required} allowFontScaling={false}>*</Text></Text>
          <TextInput style={styles.input}
            placeholder="Enter loan title"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            returnKeyType="next" allowFontScaling={false} />
        </View>

        {/* Loan Type */}
        <View style={styles.formGroup}> 
          <Text style={styles.label} allowFontScaling={false}>Loan Type<Text style={styles.required} allowFontScaling={false}>*</Text></Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeChipsRow}>
            {['Personal Loan','Home Loan','Car Loan','Business Loan','Gold Loan','Education Loan','Private Money Lending','Other'].map((opt) => (
              <TouchableOpacity key={opt} style={[styles.chip, type === opt && styles.chipActive]} onPress={() => setType(opt)} activeOpacity={0.85}>
                <Text style={[styles.chipText, type === opt && styles.chipTextActive]} allowFontScaling={false}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Lender Name - full width (required) */}
        <View style={styles.formGroup}> 
          <Text style={styles.label} allowFontScaling={false}>Lender Name<Text style={styles.required} allowFontScaling={false}>*</Text></Text>
          <TextInput style={styles.input}
            placeholder="Enter bank/financial institution name"
            placeholderTextColor="#9CA3AF"
            value={lender}
            onChangeText={setLender}
            returnKeyType="next" allowFontScaling={false} />
        </View>

        {/* Loan Amount and Interest Rate */}
        <View style={styles.row}> 
          <View style={[styles.formGroup, styles.rowItem]}> 
            <Text style={styles.label} allowFontScaling={false}>Loan Amount<Text style={styles.required} allowFontScaling={false}>*</Text></Text>
            <View style={styles.inputWithAdornment}>
              <Text style={styles.adornment} allowFontScaling={false}>₹</Text>
              <TextInput style={[styles.input, styles.inputFlex]}
                placeholder="e.g. 250000"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
                value={principal}
                onChangeText={setPrincipal}
                returnKeyType="next" allowFontScaling={false} />
            </View>
            <Text style={styles.helperText} allowFontScaling={false}>Enter total sanctioned amount</Text>
          </View>
          <View style={[styles.formGroup, styles.rowItem]}> 
            <Text style={styles.label} allowFontScaling={false}>Interest Rate (p.a.)<Text style={styles.required} allowFontScaling={false}>*</Text></Text>
            <View style={styles.inputWithAdornment}>
              <TextInput style={[styles.input, styles.inputFlex]}
                placeholder="e.g. 13.5"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
                value={interestRate}
                onChangeText={setInterestRate}
                returnKeyType="next" allowFontScaling={false} />
              <Text style={styles.adornment} allowFontScaling={false}>%</Text>
            </View>
            <Text style={styles.helperText} allowFontScaling={false}>Annual interest percentage</Text>
          </View>
        </View>

        {/* Loan Tenure (full width) */}
        <View style={styles.formGroup}>
          <View style={styles.labelRow}>
            <Text style={styles.label} allowFontScaling={false}>Loan Tenure<Text style={styles.required} allowFontScaling={false}>*</Text></Text>
            <View style={styles.segmentedInline}>
              {(['Years','Months'] as const).map((u) => (
                <TouchableOpacity
                  key={u}
                  style={[styles.segmentedInlineOption, tenureUnit === u && styles.segmentedInlineOptionActive]}
                  onPress={() => setTenureUnit(u)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.segmentedInlineOptionText, tenureUnit === u && styles.segmentedInlineOptionTextActive]} allowFontScaling={false}>{u}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <TextInput style={styles.input}
            placeholder="e.g. 60"
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
            value={termYears}
            onChangeText={setTermYears}
            returnKeyType="done" allowFontScaling={false} />
        </View>

        {/* EMI Start Date */}
        <View style={styles.formGroup}>
          <Text style={styles.label} allowFontScaling={false}>EMI Start Date<Text style={styles.required} allowFontScaling={false}>*</Text></Text>
          <TouchableOpacity
            style={[styles.input, styles.dateInput]}
            activeOpacity={0.8}
            onPress={() => setShowEmiDatePicker(true)}
          >
            <Text style={{ fontSize: 16, color: emiStartDate ? '#111827' : '#9CA3AF' }} allowFontScaling={false}>
              {emiStartDate || 'YYYY-MM-DD'}
            </Text>
          </TouchableOpacity>
          {showEmiDatePicker && (
            <DateTimePicker
              value={emiDate || new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(event, selectedDate) => {
                if (selectedDate) {
                  setEmiDate(selectedDate);
                  const y = selectedDate.getFullYear();
                  const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
                  const d = String(selectedDate.getDate()).padStart(2, '0');
                  setEmiStartDate(`${y}-${m}-${d}`);
                }
                // Close picker on any selection/change
                setShowEmiDatePicker(false);
              }}
              minimumDate={new Date(2000, 0, 1)}
              maximumDate={new Date(2100, 11, 31)}
            />
          )}
        </View>

        {/* Monthly amount (EMI or Interest) */}
        <View style={styles.formGroup}>
          <Text style={styles.label} allowFontScaling={false}>{monthlyLabel}</Text>
          <View style={styles.inputWithAdornment}>
            <Text style={styles.adornment} allowFontScaling={false}>₹</Text>
            <View style={[styles.inputFlex, styles.readonlyValueContainer]}>
              <Text style={styles.readonlyValueText} allowFontScaling={false}>{formattedMonthly}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionsRow}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => (navigation as any).goBack()} activeOpacity={0.8}>
          <Text style={styles.cancelButtonText} allowFontScaling={false}>Cancel</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.saveButton, !isValid && styles.saveButtonDisabled]} onPress={handleSubmit} activeOpacity={0.8} disabled={!isValid}>
          <LinearGradient
            colors={['#667eea', '#764ba2']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.saveButtonGradient}
          >
            <Text style={styles.saveButtonText} allowFontScaling={false}>Update Loan</Text>
          </LinearGradient>
        </TouchableOpacity>
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
    saveButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#10B981',
        borderRadius: 22,
        shadowColor: '#10B981',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    saveButtonDisabled: {
        backgroundColor: '#E5E7EB',
        shadowOpacity: 0,
        elevation: 0,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 24,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    errorTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#374151',
        marginTop: 16,
        marginBottom: 8,
    },
    errorSubtitle: {
        fontSize: 14,
        color: '#6B7280',
        textAlign: 'center',
    },
    formGroup: {
        marginBottom: 20,
    },
    firstFormGroup: {
        marginTop: 16,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.text,
        marginBottom: 8,
    },
    required: {
        color: '#EF4444',
    },
    input: {
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: theme.colors.text,
        backgroundColor: '#FFFFFF',
    },
    helperText: {
        marginTop: 6,
        fontSize: 12,
        color: '#6B7280',
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
    },
    rowItem: {
        flex: 1,
    },
    labelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    inputWithAdornment: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E5E7EB',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
    },
    inputFlex: {
        flex: 1,
        borderWidth: 0,
        backgroundColor: 'transparent',
    },
    adornment: {
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '500',
    },
    typeChipsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 4,
    },
    chip: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        backgroundColor: '#FFFFFF',
    },
    chipActive: {
        backgroundColor: '#007AFF1A',
        borderColor: '#007AFF',
    },
    chipText: {
        fontSize: 13,
        color: '#374151',
        fontWeight: '600',
    },
    chipTextActive: {
        color: '#007AFF',
    },
    segmentedInline: {
        flexDirection: 'row',
        borderWidth: 2,
        borderColor: '#E9ECEF',
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        padding: 2,
    },
    segmentedInlineOption: {
        paddingVertical: 6,
        paddingHorizontal: 10,
        borderRadius: 8,
    },
    segmentedInlineOptionActive: {
        backgroundColor: '#007AFF1A',
    },
    segmentedInlineOptionText: {
        fontSize: 12,
        color: '#374151',
        fontWeight: '600',
    },
    segmentedInlineOptionTextActive: {
        color: '#007AFF',
    },
    dateInput: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    readonlyValueContainer: {
        paddingVertical: 16,
        paddingHorizontal: 16,
        backgroundColor: '#F8FAFC',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    readonlyValueText: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '600',
        textAlign: 'center',
    },
    actionsRow: {
        flexDirection: 'row',
        gap: 16,
        marginTop: 16,
    },
    cancelButton: {
        flex: 1,
        borderRadius: 12,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#E9ECEF',
        backgroundColor: '#FFFFFF',
    },
    cancelButtonText: {
        color: '#111827',
        fontSize: 16,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    saveButton: {
        flex: 1,
        borderRadius: 16,
        overflow: 'hidden',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonGradient: {
        flex: 1,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
});

export default EditLoanScreen;
