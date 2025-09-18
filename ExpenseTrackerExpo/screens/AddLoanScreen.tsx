import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Platform, useWindowDimensions } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LoanService } from '../services/LoanService';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
 
import { useTheme } from '../context/ThemeContext';
import { useFocusEffect } from '@react-navigation/native';
 

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
    const [showEmiDatePicker, setShowEmiDatePicker] = useState(false);

	const styles = createStyles(theme);

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
                    setEmiStartDate(`${y}-${m}-${d}`);
                } else {
                    setEmiDate(null);
                    setEmiStartDate('');
                }
                setTypeOpen(false);
                setShowEmiDatePicker(false);
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
                setShowEmiDatePicker(false);
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
            
            navigation.goBack();
        } catch (error) {
            console.error('Error adding loan:', error);
        }
    };

    return (
        <View style={styles.container}>
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

                {/* Lender/Bank Name - full width (required) */}
                <View style={styles.formGroup}> 
                    <Text style={styles.label} allowFontScaling={false}>Lender/Bank Name<Text style={styles.required} allowFontScaling={false}>*</Text></Text>
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
				<TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
					<Text style={styles.cancelButtonText} allowFontScaling={false}>Cancel</Text>
				</TouchableOpacity>
                <TouchableOpacity style={[styles.saveButton, !isValid && styles.saveButtonDisabled]} onPress={async () => {
                    if (!isValid) return;
                    const annualRate = Number(interestRate);
                    const tenureNum = Number(termYears);
                    const isInterestOnly = type === 'Gold Loan' || type === 'Private Money Lending';
                    const r = (annualRate / 12) / 100;
                    const n = tenureUnit === 'Years' ? Math.round(tenureNum * 12) : Math.round(tenureNum);
                    let monthlyPayment = 0;
                    const P = Number(principal);
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
                        await LoanService.updateLoan(editLoan.id, () => ({ ...payload }));
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
		marginTop: 16,
	},
    formGroup: {
        marginBottom: 12,
    },
    label: {
        fontSize: 16,
        color: theme.colors.text,
        marginBottom: 12,
        fontWeight: '600',
        letterSpacing: 0.3,
    },
    required: {
        color: '#EF4444',
        marginLeft: 4,
        fontSize: 16,
        fontWeight: '700',
    },
    input: {
		borderWidth: 2,
		borderColor: '#E9ECEF',
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 12,
		fontSize: 16,
		color: theme.colors.text,
		backgroundColor: '#FFFFFF',
		height: 48,
    },
	inputWithAdornment: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 2,
		borderColor: '#E9ECEF',
		borderRadius: 12,
		paddingHorizontal: 16,
		backgroundColor: '#FFFFFF',
		height: 48,
	},
	adornment: {
		fontSize: 16,
		color: '#6B7280',
		marginRight: 8,
		marginLeft: 4,
	},
	inputFlex: {
		flex: 1,
		paddingHorizontal: 0,
		borderWidth: 0,
		paddingVertical: 0,
		height: '100%',
	},
	readonlyValueContainer: {
        justifyContent: 'center',
        height: '100%',
    },
    readonlyValueText: {
        fontSize: 16,
        color: theme.colors.text,
        fontWeight: '700',
    },
	dateInput: {
		justifyContent: 'center',
	},
	dropdown: {
		borderWidth: 2,
		borderColor: '#E9ECEF',
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 0,
		backgroundColor: '#FFFFFF',
		height: 48,
		justifyContent: 'center',
    },
	dropdownText: {
		fontSize: 16,
		color: '#111827',
	},
    dropdownPlaceholder: {
        color: theme.colors.textSecondary,
    },
    dropdownList: {
        marginTop: 8,
        borderWidth: 2,
        borderColor: '#E9ECEF',
        borderRadius: 16,
        backgroundColor: '#FFFFFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
        elevation: 4,
        overflow: 'hidden',
    },
	dropdownItem: {
		paddingVertical: 12,
		paddingHorizontal: 14,
		borderBottomWidth: 1,
		borderBottomColor: '#F3F4F6',
	},
	dropdownItemText: {
		fontSize: 16,
		color: '#111827',
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
	segmented: {
		flexDirection: 'row',
		borderWidth: 2,
		borderColor: '#E9ECEF',
		borderRadius: 12,
		backgroundColor: '#FFFFFF',
		padding: 2,
		height: 48,
	},
	segmentedInline: {
		flexDirection: 'row',
		borderWidth: 2,
		borderColor: '#E9ECEF',
		borderRadius: 12,
		backgroundColor: '#FFFFFF',
		padding: 2,
	},
	segmentedOption: {
		flex: 1,
		height: '100%',
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
	},
	segmentedInlineOption: {
		paddingVertical: 6,
		paddingHorizontal: 10,
		borderRadius: 8,
	},
	segmentedOptionActive: {
		backgroundColor: '#007AFF1A',
	},
	segmentedInlineOptionActive: {
		backgroundColor: '#007AFF1A',
	},
	segmentedOptionText: {
		fontSize: 14,
		color: '#374151',
		fontWeight: '600',
	},
	segmentedInlineOptionText: {
		fontSize: 12,
		color: '#374151',
		fontWeight: '600',
	},
	segmentedOptionTextActive: {
		color: '#007AFF',
	},
	segmentedInlineOptionTextActive: {
		color: '#007AFF',
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
	saveButton: {
		flex: 1,
		borderRadius: 16,
		overflow: 'hidden',
	},
	saveButtonDisabled: {
		opacity: 0.6,
	},
	saveButtonText: {
		color: '#FFFFFF',
		fontSize: 16,
		fontWeight: '700',
		letterSpacing: 0.3,
	},
	saveButtonGradient: {
		flex: 1,
		height: 48,
		alignItems: 'center',
		justifyContent: 'center',
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
});

export default AddLoanScreen;



