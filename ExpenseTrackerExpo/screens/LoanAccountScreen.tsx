import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated, Platform } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useScroll } from '../context/ScrollContext';
import { LoanService, StoredLoan } from '../services/LoanService';
import { Ionicons } from '@expo/vector-icons';
import { interstitialAd } from '../services/AdMobService';
import LoanCard from '../components/LoanCard';
import { BannerAdComponent } from '../components/AdMobComponents';
import { InterstitialAdModal } from '../components/InterstitialAdModal';

const LoanAccountScreen: React.FC = () => {
	const { theme } = useTheme();
	const navigation = useNavigation();
	const route = useRoute<any>();
	const insets = useSafeAreaInsets();
	const { scrollY } = useScroll();
	const { loanId, loanData: passedLoanData } = route.params as any;
	
	const [loan, setLoan] = useState<StoredLoan | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [showAmortizationAd, setShowAmortizationAd] = useState(false);
	


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

	// Handle immediate refresh when coming from edit screen
	useEffect(() => {
		if (passedLoanData) {
			setLoan(passedLoanData);
		}
	}, [passedLoanData]);





	const styles = createStyles(theme);

	const currency = (n?: number) => `₹${(Math.round(n || 0)).toLocaleString()}`;
	const dateFmt = (iso?: string) => {
		if (!iso) return '--';
		try {
			const d = new Date(iso);
			return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
		} catch { return '--'; }
	};

	// Helper functions for progress bar
	const getCompletionPercentage = (principal: number, currentBalance: number) => {
		const paid = principal - currentBalance;
		return Math.round((paid / principal) * 100);
	};

	const getProgressBar = (principal: number, currentBalance: number) => {
		const percentage = getCompletionPercentage(principal, currentBalance);
		const filledBlocks = Math.floor(percentage / 5); // 5% per block
		const totalBlocks = 20; // Total blocks in progress bar
		const filled = '█'.repeat(filledBlocks);
		const empty = '░'.repeat(totalBlocks - filledBlocks);
		return `[${filled}${empty}]`;
	};

	// Get loan type icon based on loan type
	const getLoanTypeIcon = (loanType: string) => {
		switch ((loanType || 'personal').toLowerCase()) {
			case 'personal loan':
				return '👤';
			case 'home loan':
				return '🏠';
			case 'car loan':
			case 'auto loan':
				return '🚗';
			case 'business loan':
				return '💼';
			case 'gold loan':
				return '🥇';
			case 'education loan':
			case 'student loan':
				return '🎓';
			case 'private money lending':
				return '💰';
			default:
				return '🏦';
		}
	};

	// Calculate next payment date dynamically (same logic as LoansScreen)
	const calculateNextPaymentDate = (loan: any) => {
		try {
			const now = new Date();
			const start = new Date(loan.emiStartDate || loan.nextPaymentDate || new Date());
			
			// months elapsed from start to now
			let monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
			if (now.getDate() < start.getDate()) {
				monthsElapsed -= 1;
			}
			monthsElapsed = Math.max(0, monthsElapsed);
			
			// Next payment is after the number of payments already made
			const next = new Date(start);
			next.setMonth(start.getMonth() + monthsElapsed);
			
			// Ensure the next payment date is in the future
			while (next <= now) {
				next.setMonth(next.getMonth() + 1);
			}
			
			return next;
		} catch {
			// Return a fallback date if calculation fails
			const fallbackDate = new Date();
			fallbackDate.setMonth(fallbackDate.getMonth() + 1);
			return fallbackDate;
		}
	};

	// Calculate remaining term dynamically (same logic as LoansScreen)
	const calculateRemainingTerm = (loan: any) => {
		try {
			const now = new Date();
			const start = new Date(loan.emiStartDate || loan.nextPaymentDate || new Date());
			
			// months elapsed from start to now
			let monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
			if (now.getDate() < start.getDate()) {
				monthsElapsed -= 1;
			}
			monthsElapsed = Math.max(0, monthsElapsed);
			
			// Payments made includes the first EMI on the start date (if today >= start)
			const onOrAfterStart = now.getTime() >= start.getTime();
			const paymentsMade = onOrAfterStart ? Math.min(loan.tenureMonths || Math.round((loan.term || 0) * 12), monthsElapsed + 1) : 0;
			
			// Calculate remaining term in months
			const totalTenureMonths = loan.tenureMonths || Math.round((loan.term || 0) * 12);
			const remainingMonths = Math.max(0, totalTenureMonths - paymentsMade);
			
			return remainingMonths;
		} catch {
			return Math.round((loan.term || 0) * 12);
		}
	};

	// Calculate current balance dynamically (same logic as LoansScreen)
	const calculateCurrentBalance = (loan: any) => {
		try {
			const now = new Date();
			const start = new Date(loan.emiStartDate || loan.nextPaymentDate || new Date());
			
			// months elapsed from start to now
			let monthsElapsed = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
			if (now.getDate() < start.getDate()) {
				monthsElapsed -= 1;
			}
			monthsElapsed = Math.max(0, monthsElapsed);
			
			// Payments made includes the first EMI on the start date (if today >= start)
			const onOrAfterStart = now.getTime() >= start.getTime();
			const paymentsMade = onOrAfterStart ? Math.min(loan.tenureMonths || Math.round((loan.term || 0) * 12), monthsElapsed + 1) : 0;
			
			let currentBalance = Number(loan.principal || 0);
			const isInterestOnly = !!loan.isInterestOnly || loan.type === 'Gold Loan' || loan.type === 'Private Money Lending';
			
			if (isInterestOnly) {
				// Interest-only: principal doesn't reduce automatically
				return currentBalance;
			} else {
				const annualRate = Number(loan.interestRate || 0);
				const r = (annualRate / 12) / 100;
				const tenureMonths = Number(loan.tenureMonths || Math.round((loan.term || 0) * 12));
				
				if (r > 0 && tenureMonths > 0) {
					// Correct amortization formula for remaining balance
					// B_k = P * [((1+r)^n - (1+r)^k) / ((1+r)^n - 1)]
					const k = paymentsMade;
					const n = tenureMonths;
					const pow_n = Math.pow(1 + r, n);
					const pow_k = Math.pow(1 + r, k);
					
					if (k >= n) {
						// Loan is fully paid off
						currentBalance = 0;
					} else {
						currentBalance = currentBalance * ((pow_n - pow_k) / (pow_n - 1));
						currentBalance = Math.max(0, Math.round(currentBalance));
					}
				} else if (r === 0 && tenureMonths > 0) {
					const k = paymentsMade;
					const principalPaid = (Number(loan.principal || 0) / tenureMonths) * k;
					currentBalance = Math.max(0, Math.round(Number(loan.principal || 0) - principalPaid));
				}
			}
			
			return currentBalance;
		} catch {
			return loan.currentBalance;
		}
	};

	// Calculate days until next EMI
	const calculateDaysUntilEMI = (loan: any) => {
		try {
			const now = new Date();
			const nextEMIDate = new Date(calculateNextPaymentDate(loan));
			
			// Calculate difference in days
			const timeDiff = nextEMIDate.getTime() - now.getTime();
			const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
			
			if (daysDiff <= 0) {
				return 'Due today';
			} else if (daysDiff === 1) {
				return 'Due tomorrow';
			} else {
				return `Due in ${daysDiff} days`;
			}
		} catch {
			return 'Due soon';
		}
	};



	if (!loan) {
		return (
			<View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }] }>
				<Text style={styles.loadingText} allowFontScaling={false}>Loading...</Text>
			</View>
		);
	}

	const isInterestOnly = !!loan.isInterestOnly || loan.type === 'Gold Loan' || loan.type === 'Private Money Lending';

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
								// Go back to previous screen in stack
								navigation.goBack();
							}}
						>
							<Ionicons name="arrow-back" size={24} color={theme.colors.text} />
						</TouchableOpacity>
					</View>
					
					<View style={styles.headerCenter}>
						<Text style={[styles.headerTitle, { color: theme.colors.text }]} allowFontScaling={false}>
							{loan.name}
						</Text>
						<Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
							{loan.lender}
						</Text>
					</View>
					
					<View style={styles.headerRight}>
						<TouchableOpacity 
							style={styles.editButton}
							onPress={() => {
								(navigation as any).navigate('EditLoan', { 
									loanId: loan.id,
									editLoan: loan 
								});
							}}
							activeOpacity={0.7}
						>
							<Ionicons name="create-outline" size={20} color="#007AFF" />
						</TouchableOpacity>
						
						<TouchableOpacity 
							style={styles.deleteButton}
							onPress={() => {
								Alert.alert(
									'Delete Loan',
									'Are you sure you want to delete this loan?',
									[
										{ text: 'Cancel', style: 'cancel' },
										{ text: 'Delete', style: 'destructive', onPress: () => {
											handleDeleteLoan();
										}}
									]
								);
							}}
							activeOpacity={0.7}
						>
							<Ionicons name="trash-outline" size={20} color="#FF3B30" />
						</TouchableOpacity>
					</View>
				</View>
			</View>
		);
	};

	const handleDeleteLoan = async () => {
		try {
			await LoanService.deleteLoan(loan.id);
			Alert.alert('Success', 'Loan deleted successfully', [
				{ text: 'OK', onPress: () => navigation.goBack() }
			]);
		} catch (error) {
			Alert.alert('Error', 'Failed to delete loan. Please try again.');
		}
	};

	  return (
    <View style={styles.container}>
      {/* Header with Safe Area */}
      <ScreenHeader theme={theme} insets={insets} loan={loan} />
      {/* Loading Overlay for Initial Load */}
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText} allowFontScaling={false}>Loading loan details...</Text>
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
				{/* Loan Card - New Visual Component */}
				<View style={styles.loanCardContainer}>
					<LoanCard
						loanName={loan.name || 'Loan'}
						loanType={loan.type || 'Personal Loan'}
						lender={loan.lender || 'Unknown Lender'}
						currentBalance={calculateCurrentBalance(loan) || 0}
						monthlyPayment={loan.monthlyPayment || 0}
						interestRate={loan.interestRate || 0}
						nextPaymentDate={(() => {
							const nextDate = calculateNextPaymentDate(loan);
							if (nextDate && nextDate instanceof Date) {
								return nextDate.toISOString();
							} else {
								return new Date().toISOString();
							}
						})()}
						cardColor={loan.gradientColors?.[0] || undefined}
					/>
				</View>

				{/* Banner Ad below Loan Card */}
				<View style={styles.adContainer}>
					<BannerAdComponent />
				</View>

				{/* Enhanced Loan Summary Card - Old Format */}
				<View style={styles.loanSummaryCard}>
					<View style={styles.loanSummaryHeader}>
						<Text style={styles.loanSummaryTitle} allowFontScaling={false}>{getLoanTypeIcon(loan.type)} {loan.type} - {loan.lender || 'Unknown Lender'}</Text>
					</View>
					
											<View style={styles.loanSummaryStatus}>
							<Text style={styles.statusText} allowFontScaling={false}>Status: Active</Text>
							<Text style={styles.balanceText} allowFontScaling={false}>Balance: {currency(calculateCurrentBalance(loan))}</Text>
						</View>
					
					<View style={styles.loanSummaryDetails}>
						<Text style={styles.detailText} allowFontScaling={false}>EMI: {currency(loan.monthlyPayment)}/mo</Text>
						<Text style={styles.detailText} allowFontScaling={false}>Interest Rate: {Number(loan.interestRate).toFixed(2)}%</Text>
					</View>
					
											<View style={styles.loanSummaryDates}>
							<Text style={styles.detailText} allowFontScaling={false}>First EMI: {dateFmt(loan.emiStartDate || loan.nextPaymentDate)}</Text>
							<Text style={styles.detailText} allowFontScaling={false}>Next EMI: {dateFmt(calculateNextPaymentDate(loan))}</Text>
						</View>
					
					<Text style={styles.remainingTermText} allowFontScaling={false}>Remaining Term: {calculateRemainingTerm(loan)} months</Text>
					
					<View style={styles.loanSummaryDivider} />
					
					<View style={styles.loanSummaryTotals}>
						<Text style={styles.totalText} allowFontScaling={false}>Total Loan Amount: {currency(loan.principal)}</Text>
						<Text style={styles.totalText} allowFontScaling={false}>Total Remaining Amount: {currency(calculateCurrentBalance(loan))}</Text>
						<Text style={styles.totalText} allowFontScaling={false}>Total Principal Paid: {currency(loan.principal - calculateCurrentBalance(loan))}</Text>
					</View>
					
					<View style={styles.progressSection}>
						<Text style={styles.progressText} allowFontScaling={false}>Progress: {getCompletionPercentage(loan.principal, calculateCurrentBalance(loan))}% Paid</Text>
						<View style={styles.progressBarContainer}>
							<View style={[styles.progressBarFill, { width: `${getCompletionPercentage(loan.principal, calculateCurrentBalance(loan))}%` }]} />
						</View>
						<Text style={styles.progressDetails} allowFontScaling={false}>
							{currency(loan.principal - calculateCurrentBalance(loan))} of {currency(loan.principal)}
						</Text>
					</View>
					
					<TouchableOpacity 
						style={styles.amortizationButton}
						onPress={() => {
							setShowAmortizationAd(true);
						}}
						activeOpacity={0.7}
					>
						<Ionicons name="calculator-outline" size={20} color="#FFFFFF" style={styles.buttonIcon} />
						<Text style={styles.amortizationButtonText} allowFontScaling={false}>Amortization Schedule</Text>
						<Ionicons name="chevron-forward" size={16} color="rgba(255, 255, 255, 0.8)" />
					</TouchableOpacity>
					

				</View>

				{/* Banner Ad above Alerts & Reminders */}
				<View style={styles.adContainer}>
					<BannerAdComponent />
				</View>

				{/* Alerts & Reminders Section */}
				<View style={styles.alertsCard}>
					<View style={styles.alertsHeader}>
						<Text style={styles.alertsTitle} allowFontScaling={false}>⚠ Alerts & Reminders</Text>
					</View>
					
					<View style={styles.alertsContent}>
						<View style={styles.alertItem}>
							<Text style={styles.alertText} allowFontScaling={false}>• EMI {calculateDaysUntilEMI(loan)}</Text>
						</View>
					</View>
				</View>



			</ScrollView>

			{/* Interstitial Ad Modal for Amortization Schedule */}
			<InterstitialAdModal
				visible={showAmortizationAd}
				onClose={() => {
					console.log('📱 Amortization Schedule interstitial ad modal closed');
					setShowAmortizationAd(false);
					setTimeout(() => {
						(navigation as any).navigate('LoanAmortization', { loanId: loan?.id });
					}, 500);
				}}
				onAdClicked={() => {
					console.log('📱 Amortization Schedule interstitial ad clicked');
					setShowAmortizationAd(false);
					setTimeout(() => {
						(navigation as any).navigate('LoanAmortization', { loanId: loan?.id });
					}, 500);
				}}
			/>
		</View>
	);
};

const createStyles = (theme: any) => StyleSheet.create({
	container: { flex: 1, backgroundColor: theme.colors.background },

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
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end',
		gap: 16,
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
	editButton: {
		width: 36,
		height: 36,
		justifyContent: 'center',
		alignItems: 'center',
	},
	deleteButton: {
		width: 36,
		height: 36,
		justifyContent: 'center',
		alignItems: 'center',
	},
	scrollContent: {
		paddingHorizontal: 16,
		paddingBottom: 20,
	},
	content: { padding: 20, paddingBottom: 40 },
	loanCardContainer: {
		marginBottom: 20,
		alignItems: 'center',
	},
	loadingText: { fontSize: 16, color: theme.colors.text },
	sectionTitle: { fontSize: 14, fontWeight: '800', color: '#111827', marginTop: 8, marginBottom: 10 },
	
	// Enhanced Loan Summary Card Styles - Attractive Colors
	loanSummaryCard: {
		backgroundColor: '#667eea',
		borderRadius: 20,
		padding: 24,
		marginTop: 20,
		marginBottom: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 8 },
		shadowOpacity: 0.15,
		shadowRadius: 12,
		elevation: 8,
		borderWidth: 0,
	},
	loanSummaryHeader: {
		marginBottom: 12,
		paddingBottom: 12,
		borderBottomWidth: 2,
		borderBottomColor: 'rgba(255, 255, 255, 0.3)',
	},
	loanSummaryTitle: {
		fontSize: 16,
		fontWeight: '800',
		color: '#FFFFFF',
		marginBottom: 8,
		letterSpacing: 0.5,
	},
	loanSummaryLender: {
		fontSize: 14,
		color: 'rgba(255, 255, 255, 0.9)',
		fontWeight: '600',
		letterSpacing: 0.3,
	},
	loanSummaryStatus: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
		paddingVertical: 4,
	},
	statusText: {
		fontSize: 14,
		color: '#10B981',
		fontWeight: '700',
		letterSpacing: 0.5,
	},
	balanceText: {
		fontSize: 14,
		color: '#FEF3C7',
		fontWeight: '700',
		letterSpacing: 0.5,
	},
	loanSummaryDetails: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
		paddingVertical: 4,
	},
	detailText: {
		fontSize: 14,
		color: 'rgba(255, 255, 255, 0.95)',
		fontWeight: '600',
		letterSpacing: 0.3,
	},
	loanSummaryDates: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		marginBottom: 8,
		paddingVertical: 4,
	},
	remainingTermText: {
		fontSize: 14,
		color: 'rgba(255, 255, 255, 0.95)',
		fontWeight: '600',
		marginBottom: 8,
		paddingVertical: 4,
		textAlign: 'center',
		letterSpacing: 0.3,
	},
	loanSummaryDivider: {
		height: 1,
		backgroundColor: 'rgba(255, 255, 255, 0.3)',
		marginVertical: 16,
		borderRadius: 1,
	},
	loanSummaryTotals: {
		marginBottom: 8,
		paddingVertical: 8,
	},
	totalText: {
		fontSize: 14,
		color: 'rgba(255, 255, 255, 0.95)',
		fontWeight: '700',
		marginBottom: 8,
		letterSpacing: 0.3,
	},
	progressSection: {
		alignItems: 'center',
		paddingVertical: 8,
	},
	progressText: {
		fontSize: 16,
		color: '#10B981',
		fontWeight: '700',
		letterSpacing: 0.5,
		textAlign: 'center',
		marginBottom: 8,
	},
	progressBarContainer: {
		width: '100%',
		height: 12,
		backgroundColor: '#E2E8F0',
		borderRadius: 6,
		overflow: 'hidden',
		marginBottom: 8,
	},
	progressBarFill: {
		height: '100%',
		backgroundColor: '#059669',
		borderRadius: 6,
	},
		progressDetails: {
		fontSize: 14,
		color: 'rgba(255, 255, 255, 0.8)',
		fontWeight: '500',
		letterSpacing: 0.3,
		textAlign: 'center',
	},
	
	// Amortization Schedule Button Styles
	amortizationButton: {
		backgroundColor: 'rgba(255, 255, 255, 0.15)',
		borderRadius: 16,
		paddingVertical: 16,
		paddingHorizontal: 24,
		alignItems: 'center',
		marginTop: 20,
		borderWidth: 1.5,
		borderColor: 'rgba(255, 255, 255, 0.4)',
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.15,
		shadowRadius: 8,
		elevation: 4,
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 8,
	},
	amortizationButtonText: {
		fontSize: 17,
		color: '#FFFFFF',
		fontWeight: '800',
		letterSpacing: 0.6,
		textShadowColor: 'rgba(0, 0, 0, 0.3)',
		textShadowOffset: { width: 0, height: 1 },
		textShadowRadius: 2,
	},
	buttonIcon: {
		marginRight: 2,
	},
	
	// Alerts & Reminders Card Styles
	adContainer: {
		alignItems: 'center',
		paddingVertical: 4,
		marginBottom: 16,
		backgroundColor: 'transparent',
	},
	alertsCard: {
		backgroundColor: '#F59E0B',
		borderRadius: 20,
		padding: 24,
		marginBottom: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.12,
		shadowRadius: 10,
		elevation: 6,
		borderWidth: 0,
	},
	alertsHeader: {
		marginBottom: 16,
		paddingBottom: 12,
		borderBottomWidth: 2,
		borderBottomColor: 'rgba(255, 255, 255, 0.3)',
	},
	alertsTitle: {
		fontSize: 16,
		fontWeight: '800',
		color: '#FFFFFF',
		letterSpacing: 0.5,
	},
	alertsContent: {
		gap: 12,
	},
	alertItem: {
		marginBottom: 8,
	},
	alertText: {
		fontSize: 14,
		color: 'rgba(255, 255, 255, 0.95)',
		fontWeight: '600',
		letterSpacing: 0.3,
	},
	

	
	// Early Payment Simulator Card Styles
	simulatorCard: {
		backgroundColor: '#FFFFFF',
		borderRadius: 20,
		padding: 24,
		marginBottom: 20,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 6 },
		shadowOpacity: 0.12,
		shadowRadius: 10,
		elevation: 6,
		borderWidth: 1,
		borderColor: '#F1F5F9',
	},
	simulatorHeader: {
		marginBottom: 16,
		paddingBottom: 12,
		borderBottomWidth: 2,
		borderBottomColor: '#E2E8F0',
	},
	simulatorTitle: {
		fontSize: 20,
		fontWeight: '800',
		color: '#1E293B',
		letterSpacing: 0.5,
	},
	simulatorContent: {
		gap: 12,
		marginBottom: 20,
	},
	simulatorInputRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 16,
	},
	inputContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		borderWidth: 1,
		borderColor: '#E2E8F0',
		borderRadius: 8,
		paddingHorizontal: 12,
		paddingVertical: 8,
		backgroundColor: '#F8FAFC',
		minWidth: 120,
	},
	currencySymbol: {
		fontSize: 16,
		color: '#374151',
		fontWeight: '600',
		marginRight: 4,
	},
	amountInput: {
		fontSize: 16,
		color: '#374151',
		fontWeight: '600',
		flex: 1,
		textAlign: 'right',
	},
	simulatorRow: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
	},
	simulatorLabel: {
		fontSize: 16,
		color: '#374151',
		fontWeight: '600',
		letterSpacing: 0.3,
	},
	simulatorValue: {
		fontSize: 16,
		color: '#059669',
		fontWeight: '700',
		letterSpacing: 0.3,
	},
	simulatorButton: {
		backgroundColor: '#059669',
		borderRadius: 12,
		paddingVertical: 14,
		paddingHorizontal: 20,
		alignItems: 'center',
	},
	simulatorButtonText: {
		fontSize: 16,
		color: '#FFFFFF',
		fontWeight: '700',
		letterSpacing: 0.3,
	},
	simulatorTip: {
		backgroundColor: '#F0F9FF',
		borderRadius: 12,
		padding: 16,
		marginBottom: 20,
		borderLeftWidth: 4,
		borderLeftColor: '#0EA5E9',
	},
	tipText: {
		fontSize: 14,
		color: '#0C4A6E',
		fontWeight: '500',
		lineHeight: 20,
		letterSpacing: 0.3,
	},
	
	progressRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
	},
	progressBarText: {
		fontSize: 16,
		color: '#059669',
		fontWeight: '700',
		fontFamily: 'monospace',
		letterSpacing: 0.5,
	},
	progressLabel: {
		fontSize: 14,
		color: '#64748B',
		fontWeight: '500',
		letterSpacing: 0.3,
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

export default LoanAccountScreen;


