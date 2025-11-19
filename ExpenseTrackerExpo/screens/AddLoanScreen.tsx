import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, useWindowDimensions, Alert, KeyboardAvoidingView } from 'react-native';
import WheelDatePicker from '../components/WheelDatePicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LoanService } from '../services/LoanService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BannerAdComponent } from '../components/AdMobComponents';
 
import { useTheme } from '../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
import { formatNumber } from '../utils/currencyFormatter';
 
const MAX_LOAN_AMOUNT = 1000000000; // ₹1,000,000,000 (1 Billion)
const MAX_INTEREST_RATE = 50; // Maximum 50%

const AddLoanScreen: React.FC = () => {
    const { theme } = useTheme();
    const { width } = useWindowDimensions();
    const isWide = width >= 768; // 2-column on tablets/large screens
    const navigation = useNavigation();
    const route = useRoute<any>();
    const insets = useSafeAreaInsets();
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
    const [lenderSuggestion, setLenderSuggestion] = useState<string | null>(null);

	const styles = createStyles(theme);

    // List of banks and NBFCs in alphabetical order (for autocomplete suggestion)
    const lenderList = [
        'Aditya Birla Capital',
        'AU Small Finance Bank',
        'Airtel Payments Bank',
        'Axis Bank',
        'Bajaj Finserv',
        'Bandhan Bank',
        'Bank of Baroda',
        'Bank of India',
        'Canara Bank',
        'Central Bank of India',
        'City Union Bank',
        'CSB Bank',
        'DCB Bank',
        'Dhanalakshmi Bank',
        'Edelweiss Financial Services',
        'Federal Bank',
        'HDFC Bank',
        'ICICI Bank',
        'IDBI Bank',
        'IDFC First Bank',
        'Indian Bank',
        'Indian Overseas Bank',
        'Indusind Bank',
        'Jammu and Kashmir Bank',
        'Jio Payments Bank',
        'Karnataka Bank',
        'Karur Vysya Bank',
        'Kotak Mahindra Bank',
        'Manappuram Finance',
        'Muthoot Finance',
        'Paytm Payments Bank',
        'Piramal Finance',
        'Punjab National Bank',
        'Punjab and Sind Bank',
        'RBL Bank',
        'South Indian Bank',
        'Standard Chartered',
        'State Bank of India',
        'Tata Capital',
        'Tamilnad Mercantile Bank',
        'UCO Bank',
        'Ujjivan Small Finance Bank',
        'Union Bank of India',
        'Yes Bank',
    ];

    // Function to find lender suggestion based on input
    const getLenderSuggestion = (input: string): string | null => {
        if (!input || input.trim().length === 0) {
            return null;
        }
        
        const normalizedInput = input.toLowerCase().trim();
        
        // Priority mapping for common prefixes (user preference)
        const priorityMap: { [key: string]: string } = {
            'id': 'IDFC First Bank',  // ID should prioritize IDFC over IDBI
            'idf': 'IDFC First Bank',
            'idfc': 'IDFC First Bank',
            'baj': 'Bajaj Finserv',  // BA should prioritize Bajaj
            'baja': 'Bajaj Finserv',
            'bajaj': 'Bajaj Finserv',
        };
        
        // Check priority map first
        if (priorityMap[normalizedInput]) {
            return priorityMap[normalizedInput];
        }
        
        // Find the first lender that starts with the input (case-insensitive)
        const match = lenderList.find(lender => 
            lender.toLowerCase().startsWith(normalizedInput)
        );
        
        return match || null;
    };

    // Function to capitalize first letter of each word
    const toTitleCase = (text: string): string => {
        return text
            .toLowerCase()
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Filter input based on field type
    const filterLoanName = (text: string): string => {
        // Only allow alphabets and spaces
        return text.replace(/[^a-zA-Z\s]/g, '');
    };

    const filterLenderName = (text: string): string => {
        // Only allow alphabets and spaces
        return text.replace(/[^a-zA-Z\s]/g, '');
    };

    const filterAmount = (text: string): string => {
        // Only allow numbers
        return text.replace(/[^0-9]/g, '');
    };

    const filterTenure = (text: string): string => {
        // Only allow numbers
        return text.replace(/[^0-9]/g, '');
    };

    const handleLenderChange = (text: string) => {
        // Filter to only alphabets and spaces
        const filteredText = filterLenderName(text);
        const titleCaseText = toTitleCase(filteredText);
        setLender(titleCaseText);
        
        // Update lender suggestion
        const suggestion = getLenderSuggestion(filteredText);
        setLenderSuggestion(suggestion && suggestion.toLowerCase() !== titleCaseText.toLowerCase() ? suggestion : null);
    };

    const handleLenderSuggestionPress = () => {
        if (lenderSuggestion) {
            setLender(toTitleCase(lenderSuggestion));
            setLenderSuggestion(null);
        }
    };

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
        return formatNumber(Math.round(monthlyAmount));
    }, [monthlyAmount]);

    // Clear or prefill inputs when screen gains focus
    useFocusEffect(
        React.useCallback(() => {
            const editLoan = route.params?.editLoan as any | undefined;
            // EditLoan data loaded
            if (editLoan) {
                setName(editLoan.name || '');
                setType(editLoan.type || '');
                setLender(editLoan.lender || '');
                setPrincipal(String(editLoan.principal ?? ''));
                setInterestRate(String(editLoan.interestRate ?? ''));
                const months = Number(editLoan.tenureMonths || Math.round((editLoan.term || 0) * 12));
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
                const startIso = editLoan.emiStartDate || editLoan.nextPaymentDate;
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
                setTypeOpen(false);
            } else {
                setName('');
                setType('');
                setLender('');
                setPrincipal('');
                setInterestRate('');
                setTermYears('');
                setTenureUnit('Years');
                setTypeOpen(false);
                setEmiStartDate('');
                setEmiDate(null);
            }
        }, [route.params])
    );

    // Also add a useEffect to handle route params changes
    React.useEffect(() => {
        const editLoan = route.params?.editLoan as any | undefined;
        if (editLoan) {
                    // Setting form data from editLoan
            setLender(editLoan.lender || '');
        }
    }, [route.params?.editLoan]);

    // Auto-fill function
    const handleAutoFill = () => {
        const editLoan = route.params?.editLoan as any | undefined;
        if (editLoan) {
            // Don't auto-fill when editing
            return;
        }

        // Check if form has any data
        const hasData = name || type || lender || principal || interestRate || termYears || emiStartDate;
        
        if (hasData) {
            Alert.alert(
                'Auto Fill',
                'This will replace all current form data. Do you want to continue?',
                [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                        text: 'Auto Fill', 
                        onPress: () => {
                            performAutoFill();
                        },
                        style: 'default'
                    }
                ]
            );
        } else {
            performAutoFill();
        }
    };

    const performAutoFill = () => {
        // Sample loan data
        setName('Sample Personal Loan');
        setType('Personal Loan');
        setLender('HDFC Bank');
        setPrincipal('500000');
        setInterestRate('12.5');
        setTermYears('5');
        setTenureUnit('Years');
        
        // Set EMI start date to today
        const today = new Date();
        setEmiDate(today);
        const y = today.getFullYear();
        const m = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        setEmiStartDate(`${y}-${m}-${day}`);
    };

    // Header Component
    const ScreenHeader: React.FC<{ theme: any; insets: any }> = ({ theme, insets }) => {
        const headerPaddingTop = Platform.OS === 'android' ? insets.top + 5 : insets.top + 10;
        const editLoan = route.params?.editLoan as any | undefined;
        
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
                            {editLoan ? 'Edit Loan' : 'Add Loan'}
                        </Text>
                        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
                            {editLoan ? 'Update loan details' : 'Add a new loan'}
                        </Text>
                    </View>
                    
                    <View style={styles.headerRight}>
                        {!editLoan && (
                            <TouchableOpacity 
                                style={styles.autoFillButton}
                                onPress={handleAutoFill}
                                activeOpacity={0.7}
                            >
                                <Ionicons 
                                    name="sparkles" 
                                    size={20} 
                                    color="#667eea" 
                                />
                            </TouchableOpacity>
                        )}
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

    // Map display loan type to backend loan type
    const mapLoanTypeToBackend = (displayType: string): string => {
        const typeMap: {[key: string]: string} = {
            'Personal Loan': 'personal',
            'Home Loan': 'home',      // Backend expects 'home' not 'mortgage'
            'Car Loan': 'car',        // Backend expects 'car' not 'auto'
            'Business Loan': 'business',
            'Gold Loan': 'other',
            'Education Loan': 'student',
            'Private Money Lending': 'other',
            'Other': 'other'
        };
        const mappedType = typeMap[displayType] || 'other';
        console.log('🔍 AddLoanScreen: Mapping loan type:', displayType, '->', mappedType);
        return mappedType;
    };

    const handleSaveLoan = async () => {
        if (!isValid) return;

        try {
            const tenureMonths = tenureUnit === 'Years' ? Number(termYears) * 12 : Number(termYears);
            const principalAmount = Number(principal);
            const rate = Number(interestRate);
            
            // Validate loan amount limit
            if (principalAmount > MAX_LOAN_AMOUNT) {
                Alert.alert(
                    'Limit Exceeded',
                    'Principal amount cannot exceed ₹1,000,000,000 (1 Billion).'
                );
                return;
            }
            
            // Validate interest rate limit
            if (rate > MAX_INTEREST_RATE) {
                Alert.alert(
                    'Limit Exceeded',
                    `Interest rate cannot exceed ${MAX_INTEREST_RATE}%.`
                );
                return;
            }
            
            // Calculate monthly payment (EMI for regular loans, interest-only for Gold/Private Money Lending)
            const isInterestOnlyLoan = type === 'Gold Loan' || type === 'Private Money Lending';
            const monthlyRate = rate / (12 * 100);
            let monthlyPayment: number;
            
            if (isInterestOnlyLoan) {
                // Interest-only: just the monthly interest
                monthlyPayment = principalAmount * monthlyRate;
            } else {
                // Standard EMI calculation
                monthlyPayment = monthlyRate > 0 
                ? (principalAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / (Math.pow(1 + monthlyRate, tenureMonths) - 1)
                : principalAmount / tenureMonths;
            }
            
            const loanData = {
                name: name.trim(),
                type: mapLoanTypeToBackend(type) as 'personal' | 'home' | 'car' | 'business' | 'student' | 'other', // Map display name to backend code
                lender: lender.trim(),
                principal: principalAmount,
                interestRate: rate,
                tenureMonths: tenureMonths,
                monthlyPayment: monthlyPayment,
                remainingBalance: principalAmount,
                emiStartDate: emiStartDate,
                endDate: new Date(new Date(emiStartDate).getTime() + tenureMonths * 30 * 24 * 60 * 60 * 1000).toISOString(),
                status: 'active' as const,
                color: '#007AFF',
                icon: 'document-text'
            };

            console.log('🔍 AddLoanScreen: Sending loan data:', loanData);
            await LoanService.addLoan(loanData);
            
            // Reset form
            setName('');
            setType('');
            setLender('');
            setPrincipal('');
            setInterestRate('');
            setTermYears('');
            setTenureUnit('Years');
            setEmiStartDate('');
            setEmiDate(null);
            
            // Navigate back immediately after successful save
            // The form will be cleared when screen comes into focus again (via useFocusEffect)
            navigation.goBack();
        } catch (error) {
            console.error('Error adding loan:', error);
        }
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
            {/* Header with Safe Area */}
            <ScreenHeader theme={theme} insets={insets} />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View>


                {/* Loan Name */}
                <View style={[styles.formGroup, styles.firstFormGroup]}>
                    <Text style={styles.label} allowFontScaling={false}>Loan Name<Text style={styles.required} allowFontScaling={false}>*</Text></Text>
                    <TextInput style={styles.input}
                        placeholder="Enter loan title"
                        placeholderTextColor="#9CA3AF"
                        value={name}
                        onChangeText={(text) => {
                            const filtered = filterLoanName(text);
                            setName(toTitleCase(filtered));
                        }}
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

                {/* Lender/Bank Name - full width (required) */}
                <View style={styles.formGroup}> 
                    <Text style={styles.label} allowFontScaling={false}>Lender/Bank Name<Text style={styles.required} allowFontScaling={false}>*</Text></Text>
                    <TextInput style={styles.input}
                        placeholder="Enter bank/financial institution name"
                        placeholderTextColor="#9CA3AF"
                        value={lender}
                        onChangeText={handleLenderChange}
                        returnKeyType="next" allowFontScaling={false} />
                    {/* Lender Name Suggestion */}
                    {lenderSuggestion && (
                        <TouchableOpacity 
                            style={styles.suggestionContainer}
                            onPress={handleLenderSuggestionPress}
                            activeOpacity={0.7}
                        >
                            <Ionicons name="search" size={14} color="#667eea" />
                            <Text style={styles.suggestionText} allowFontScaling={false}>
                                {lenderSuggestion}
                            </Text>
                            <Ionicons name="arrow-forward-circle" size={16} color="#667eea" />
                        </TouchableOpacity>
                    )}
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
                                onChangeText={(text) => setPrincipal(filterAmount(text))}
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

                {/* Banner Ad above Loan Tenure */}
                <View style={styles.adContainer}>
                    <BannerAdComponent />
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
                        onChangeText={(text) => setTermYears(filterTenure(text))}
                        returnKeyType="done" allowFontScaling={false} />
                </View>

                {/* EMI Start Date */}
                <View style={styles.formGroup}>
                    <Text style={styles.label} allowFontScaling={false}>EMI Start Date<Text style={styles.required} allowFontScaling={false}>*</Text></Text>
                    <WheelDatePicker
                        selectedDate={emiDate || new Date()}
                        onDateChange={(d: Date) => {
                            setEmiDate(d);
                            const y = d.getFullYear();
                            const m = String(d.getMonth() + 1).padStart(2, '0');
                            const day = String(d.getDate()).padStart(2, '0');
                            setEmiStartDate(`${y}-${m}-${day}`);
                        }}
                        placeholder="Select date"
                        buttonStyle={[styles.input, styles.dateInput]}
                        textStyle={{ fontSize: 16, color: theme.colors.text, fontWeight: '600' }}
                    />
                </View>

                {/* Monthly amount (EMI or Interest) */}
                <View style={styles.formGroup}>
                    <Text style={styles.label} allowFontScaling={false}>{monthlyLabel}</Text>
                    <View style={styles.inputWithAdornment}>
                        <Text style={styles.adornment} allowFontScaling={false}>₹</Text>
                        <View style={styles.inputFlex}>
                            <Text style={{ fontSize: 14, color: '#111827', fontWeight: '500' }} allowFontScaling={false}>{formattedMonthly}</Text>
                        </View>
                    </View>
                </View>
            </View>
			{/* Action buttons */}
			<View style={styles.actionsRow}>
				<TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
					<Text style={styles.cancelButtonText} allowFontScaling={false}>Cancel</Text>
				</TouchableOpacity>
                <TouchableOpacity style={[styles.saveButtonFooter, !isValid && styles.saveButtonDisabled]} onPress={async () => {
                    if (!isValid) return;
                    const annualRate = Number(interestRate);
                    const tenureNum = Number(termYears);
                    const P = Number(principal);
                    
                    // Validate loan amount limit
                    if (P > MAX_LOAN_AMOUNT) {
                        Alert.alert(
                            'Limit Exceeded',
                            'Principal amount cannot exceed ₹1,000,000,000 (1 Billion).'
                        );
                        return;
                    }
                    
                    // Validate interest rate limit
                    if (annualRate > MAX_INTEREST_RATE) {
                        Alert.alert(
                            'Limit Exceeded',
                            `Interest rate cannot exceed ${MAX_INTEREST_RATE}%.`
                        );
                        return;
                    }
                    
                    const isInterestOnly = type === 'Gold Loan' || type === 'Private Money Lending';
                    const r = (annualRate / 12) / 100;
                    const n = tenureUnit === 'Years' ? Math.round(tenureNum * 12) : Math.round(tenureNum);
                    let monthlyPayment = 0;
                    if (isInterestOnly) {
                        monthlyPayment = P * r;
                    } else if (n > 0) {
                        if (r === 0) monthlyPayment = P / n; else {
                            const pow = Math.pow(1 + r, n);
                            monthlyPayment = (P * r * pow) / (pow - 1);
                        }
                    }
                    const emiStartDateObj = emiStartDate && !isNaN(Date.parse(emiStartDate)) ? new Date(emiStartDate) : new Date();
                    const editLoan = route.params?.editLoan as any | undefined;
                    
                    // Calculate next payment date
                    let nextPaymentDate = emiStartDateObj.toISOString();
                    if (editLoan?.id) {
                        // For existing loans, calculate the next upcoming EMI date
                        const today = new Date();
                        const monthsSinceStart = Math.floor((today.getTime() - emiStartDateObj.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
                        const nextEMIMonth = emiStartDateObj.getMonth() + monthsSinceStart + 1;
                        const nextEMIDate = new Date(emiStartDateObj.getFullYear(), nextEMIMonth, emiStartDateObj.getDate());
                        
                        // If next EMI date is in the past, find the next one
                        while (nextEMIDate <= today) {
                            nextEMIDate.setMonth(nextEMIDate.getMonth() + 1);
                        }
                        nextPaymentDate = nextEMIDate.toISOString();
                    }
                    
                    const payload: any = {
                        id: editLoan?.id || String(Date.now()),
                        name,
                        type,
                        lender,
                        principal: P,
                        currentBalance: P,
                        interestRate: annualRate,
                        monthlyPayment: Math.round(monthlyPayment),
                        nextPaymentDate: nextPaymentDate,
                        term: tenureUnit === 'Years' ? tenureNum : tenureNum / 12,
                        remainingTerm: tenureUnit === 'Years' ? tenureNum : tenureNum / 12,
                        gradientColors: ['#4facfe', '#00f2fe'],
                        emiStartDate: emiStartDateObj.toISOString(),
                        isInterestOnly,
                        tenureMonths: n,
                    };
                    if (editLoan?.id) {
                        await LoanService.updateLoan(editLoan.id, payload);
                    } else {
                        await LoanService.addLoan(payload);
                    }
                    (navigation as any).goBack();
                }} activeOpacity={0.8} disabled={!isValid}>
					<LinearGradient
						colors={['#667eea', '#764ba2']}
						start={{ x: 0, y: 0 }}
						end={{ x: 1, y: 0 }}
						style={styles.saveButtonGradient}
					>
						<Text style={styles.saveButtonText} allowFontScaling={false}>Save Loan</Text>
					</LinearGradient>
				</TouchableOpacity>
			</View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: '#FFFFFF',
	},

    // Header Styles
    headerContainer: {
        paddingHorizontal: 20,
        paddingBottom: 20,
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
        justifyContent: 'flex-end',
        gap: 12,
        minWidth: 60,
    },
    autoFillButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#E5E7EB',
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
        color: '#111827',
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '400',
        textAlign: 'center',
        color: '#6B7280',
        marginTop: 2,
    },
    saveButton: {
        width: 48,
        height: 48,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#10B981',
        borderRadius: 24,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    saveButtonDisabled: {
        backgroundColor: '#D1D5DB',
        shadowOpacity: 0,
        elevation: 0,
    },
    saveButtonGradient: {
        flex: 1,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.4,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 24,
        paddingBottom: 32,
    },
 
	helperText: {
		marginTop: 6,
		fontSize: 12,
		color: '#6B7280',
	},
	sectionTitle: {
		fontSize: 14,
		fontWeight: '800',
		color: '#111827',
		marginBottom: 10,
		letterSpacing: 0.4,
	},
	firstFormGroup: {
		marginTop: 8,
	},
    adContainer: {
        alignItems: 'center',
        paddingVertical: 4,
        marginBottom: 16,
        backgroundColor: 'transparent',
    },
    formGroup: {
        marginBottom: 24,
    },
    
    label: {
        fontSize: 14,
        color: '#111827',
        marginBottom: 8,
        fontWeight: '600',
    },
    required: {
        color: '#EF4444',
        marginLeft: 4,
        fontSize: 16,
        fontWeight: '700',
    },
    input: {
		borderWidth: 1,
		borderColor: '#000000',
		borderRadius: 16,
		paddingHorizontal: 20,
		paddingVertical: 16,
		fontSize: 14,
		color: '#111827',
		backgroundColor: '#FFFFFF',
    },
	inputWithAdornment: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#000000',
		borderRadius: 16,
		backgroundColor: '#FFFFFF',
		paddingHorizontal: 20,
		paddingVertical: 16,
	},
	adornment: {
		fontSize: 14,
		color: '#6B7280',
		fontWeight: '500',
		marginRight: 8,
	},
	inputFlex: {
		flex: 1,
		paddingHorizontal: 0,
		paddingVertical: 0,
		borderWidth: 0,
		fontSize: 14,
		color: '#111827',
		backgroundColor: 'transparent',
	},
	readonlyValueContainer: {
        flex: 1,
        paddingVertical: 16,
        paddingHorizontal: 20,
        backgroundColor: '#F8FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        alignItems: 'center',
    },
    readonlyValueText: {
        fontSize: 14,
        color: '#111827',
        fontWeight: '600',
    },
	dateInput: {
		justifyContent: 'center',
	},
	dropdown: {
		borderWidth: 1,
		borderColor: '#000000',
		borderRadius: 16,
		paddingHorizontal: 20,
		paddingVertical: 16,
		backgroundColor: '#FFFFFF',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
		justifyContent: 'center',
    },
	dropdownText: {
		fontSize: 14,
		color: '#111827',
		fontWeight: '500',
	},
    dropdownPlaceholder: {
        color: '#9CA3AF',
    },
    dropdownList: {
        marginTop: 8,
        borderWidth: 1.5,
        borderColor: '#D1D5DB',
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
        elevation: 8,
        overflow: 'hidden',
    },
	dropdownItem: {
		paddingVertical: 16,
		paddingHorizontal: 20,
		borderBottomWidth: 1,
		borderBottomColor: '#F3F4F6',
	},
	dropdownItemText: {
		fontSize: 16,
		color: '#111827',
		fontWeight: '500',
	},
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 20,
    },
	rowItem: {
		flex: 1,
	},
	labelRow: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 16,
	},
	segmented: {
		flexDirection: 'row',
		borderWidth: 1.5,
		borderColor: '#D1D5DB',
		borderRadius: 16,
		backgroundColor: '#FFFFFF',
		padding: 4,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.05,
		shadowRadius: 3,
		elevation: 1,
	},
	segmentedInline: {
		flexDirection: 'row',
		borderWidth: 1,
		borderColor: '#000000',
		borderRadius: 12,
		backgroundColor: '#FFFFFF',
		padding: 2,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
		alignSelf: 'flex-start',
	},
	segmentedOption: {
		flex: 1,
		paddingVertical: 12,
		borderRadius: 12,
		alignItems: 'center',
		justifyContent: 'center',
	},
	segmentedInlineOption: {
		paddingVertical: 8,
		paddingHorizontal: 16,
		borderRadius: 8,
		alignItems: 'center',
		minWidth: 60,
	},
	segmentedOptionActive: {
		backgroundColor: '#3B82F6',
		shadowColor: '#3B82F6',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
		elevation: 3,
	},
	segmentedInlineOptionActive: {
		backgroundColor: '#007AFF',
	},
	segmentedOptionText: {
		fontSize: 14,
		color: '#6B7280',
		fontWeight: '600',
	},
	segmentedInlineOptionText: {
		fontSize: 12,
		color: '#374151',
		fontWeight: '600',
	},
	segmentedOptionTextActive: {
		color: '#FFFFFF',
		fontWeight: '700',
	},
	segmentedInlineOptionTextActive: {
		color: '#FFFFFF',
		fontWeight: '700',
	},
	typeChipsRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		gap: 12,
		marginBottom: 8,
	},
	chip: {
		paddingVertical: 8,
		paddingHorizontal: 12,
		borderRadius: 20,
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
		fontWeight: '700',
	},
	actionsRow: {
		flexDirection: 'row',
		gap: 16,
		marginTop: 32,
		paddingTop: 24,
	},
	cancelButton: {
		flex: 1,
		borderRadius: 16,
		height: 56,
		alignItems: 'center',
		justifyContent: 'center',
		borderWidth: 1.5,
		borderColor: '#D1D5DB',
		backgroundColor: '#FFFFFF',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 4,
		elevation: 2,
	},
	cancelButtonText: {
		color: '#374151',
		fontSize: 16,
		fontWeight: '600',
		letterSpacing: 0.3,
	},
	saveButtonFooter: {
		flex: 1,
		borderRadius: 16,
		height: 56,
		overflow: 'hidden',
	},
	suggestionContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		backgroundColor: '#F0F4FF',
		borderRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 10,
		marginTop: 8,
		borderWidth: 1,
		borderColor: '#667eea',
	},
	suggestionText: {
		flex: 1,
		fontSize: 14,
		color: '#667eea',
		fontWeight: '500',
		marginLeft: 8,
	},
});

export default AddLoanScreen;



