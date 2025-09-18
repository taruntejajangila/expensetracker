import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  Alert,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  Dimensions
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CreditCard from '../components/CreditCard';
import CreditCardService from '../services/CreditCardService';

interface CreditCardDetails {
  id: number;
  cardName: string;
  cardType: string;
  issuer: string;
  lastFourDigits: string;
  creditLimit: number;
  currentBalance: number;
  statementDay: number;
  dueDay: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RouteParams {
  creditCardId: number;
  creditCardData?: CreditCardDetails;
}

const EditCreditCardScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { creditCardId, creditCardData } = route.params as RouteParams;
  const styles = createStyles(theme, insets);
  const scrollViewRef = useRef<ScrollView>(null);

  // State for credit card data
  const [creditCard, setCreditCard] = useState<CreditCardDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state - will be populated after fetching data
  const [formData, setFormData] = useState({
    cardName: '',
    cardType: '',
    issuer: '',
    lastFourDigits: '',
    creditLimit: '',
    currentBalance: '',
    statementDay: '',
    dueDay: ''
  });

  // Validation state
  const [errors, setErrors] = useState<{[key: string]: string}>({});

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
              Edit Credit Card
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              Update credit card details
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={[styles.saveButton, !isValid && styles.saveButtonDisabled]}
              onPress={handleSubmit}
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

  // Form validation
  const isValid = useMemo(() => {
    if (isLoading || !creditCard) return false;
    
    return (
      formData.cardName.trim().length > 0 &&
      formData.cardType.trim().length > 0 &&
      formData.issuer.trim().length > 0 &&
      formData.creditLimit.trim().length > 0 && !isNaN(Number(formData.creditLimit)) && Number(formData.creditLimit) > 0 &&
      formData.currentBalance.trim().length > 0 && !isNaN(Number(formData.currentBalance)) && Number(formData.currentBalance) >= 0 &&
      formData.statementDay.trim().length > 0 && !isNaN(Number(formData.statementDay)) && Number(formData.statementDay) >= 1 && Number(formData.statementDay) <= 31 &&
      formData.dueDay.trim().length > 0 && !isNaN(Number(formData.dueDay)) && Number(formData.dueDay) >= 1 && Number(formData.dueDay) <= 31 &&
      Number(formData.currentBalance) <= Number(formData.creditLimit) &&
      formData.lastFourDigits.trim().length === 4 && !isNaN(Number(formData.lastFourDigits))
    );
  }, [formData, isLoading, creditCard]);

  // Calculate available credit
  const availableCredit = formData.creditLimit && formData.currentBalance ? parseFloat(formData.creditLimit) - parseFloat(formData.currentBalance) : 0;
  const utilization = formData.creditLimit && formData.currentBalance ? (parseFloat(formData.currentBalance) / parseFloat(formData.creditLimit)) * 100 : 0;

  // Handle form submission
  const handleSubmit = async () => {
    if (isValid && creditCard) {
      try {
        const creditCardData = {
          cardName: formData.cardName.trim(),
          cardType: formData.cardType.trim(),
          issuer: formData.issuer.trim(),
          lastFourDigits: formData.lastFourDigits.trim(),
          creditLimit: parseFloat(formData.creditLimit),
          currentBalance: parseFloat(formData.currentBalance),
          statementDay: parseInt(formData.statementDay),
          dueDay: parseInt(formData.dueDay)
        };

        await CreditCardService.updateCreditCard(creditCard.id, creditCardData);
        
        // Replace current screen with credit cards list to clear the stack
        (navigation as any).replace('CreditCards');
      } catch (error: any) {
        console.error('Error updating credit card:', error);
        Alert.alert(
          'Error',
          error.response?.data?.error || 'Failed to update credit card. Please try again.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  // Update form data
  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Handle input focus - only scroll if input is actually hidden by keyboard
  const handleInputFocus = (event: any) => {
    // Get the input field's position
    event.target.measureInWindow((x: number, y: number, width: number, height: number) => {
      const keyboardHeight = 250; // Approximate keyboard height
      const screenHeight = Dimensions.get('window').height;
      const inputTop = y;
      const inputBottom = y + height;
      
      // Check if the input is already visible above the keyboard
      const isInputVisible = inputTop >= 0 && inputBottom <= (screenHeight - keyboardHeight);
      
      // Only scroll if the input field would be hidden by the keyboard
      if (!isInputVisible && inputBottom > (screenHeight - keyboardHeight)) {
        // Calculate how much to scroll to make the input visible with buffer
        const scrollAmount = inputBottom - (screenHeight - keyboardHeight) + 100; // 100px buffer for better visibility
        
        // Only scroll if it's a significant amount (more than 50px)
        if (scrollAmount > 50) {
          setTimeout(() => {
            scrollViewRef.current?.scrollTo({
              y: scrollAmount,
              animated: true
            });
          }, 300);
        }
      }
    });
  };

  // Use passed credit card data or fetch from API
  useEffect(() => {
    const initializeCreditCard = async () => {
      try {
        setIsLoading(true);
        
        let cardData: CreditCardDetails;
        
        // First try to use the passed data
        if (creditCardData) {
          cardData = creditCardData;
          setCreditCard(cardData);
        } else {
          // Fallback: try to get from the API
          try {
            const response = await CreditCardService.getCreditCardById(creditCardId);
            cardData = response.data.creditCard;
            setCreditCard(cardData);
          } catch (apiError) {
            console.error('API Error fetching credit card:', apiError);
            Alert.alert(
              'Error',
              'Unable to load credit card data. Please try again.',
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
        setFormData({
          cardName: cardData.cardName || '',
          cardType: cardData.cardType || '',
          issuer: cardData.issuer || '',
          lastFourDigits: cardData.lastFourDigits || '',
          creditLimit: cardData.creditLimit?.toString() || '',
          currentBalance: cardData.currentBalance?.toString() || '',
          statementDay: cardData.statementDay?.toString() || '',
          dueDay: cardData.dueDay?.toString() || ''
        });
      } catch (error) {
        console.error('Error initializing credit card:', error);
        Alert.alert('Error', 'Failed to load credit card data');
      } finally {
        setIsLoading(false);
      }
    };

    initializeCreditCard();
  }, [creditCardId, creditCardData, navigation]);

  // Handle keyboard show/hide with smarter scrolling
  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      // Don't auto-scroll on keyboard show - let individual inputs handle it
    });

    return () => {
      keyboardDidShowListener?.remove();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText} allowFontScaling={false}>Loading credit card data...</Text>
        </View>
      </View>
    );
  }

  if (!creditCard) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="card-outline" size={48} color="#9CA3AF" />
          <Text style={styles.errorTitle} allowFontScaling={false}>Card Not Found</Text>
          <Text style={styles.errorSubtitle} allowFontScaling={false}>The requested credit card could not be found</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header with Safe Area */}
      <ScreenHeader theme={theme} insets={insets} />

      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView} 
        contentContainerStyle={styles.content} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View>
          {/* Credit Card Preview */}
          <View style={[styles.formGroup, styles.cardPreviewSection]}>
            <CreditCard 
              cardNumber={formData.lastFourDigits ? `XXXX XXXX XXXX ${formData.lastFourDigits}` : 'XXXX XXXX XXXX XXXX'}
              cardHolderName={formData.cardName || 'YOUR NAME'}
              expiryMonth={formData.statementDay || 'MM'}
              expiryYear={formData.dueDay ? formData.dueDay.slice(-2) : 'YY'}
              cardType={formData.cardType || 'CARD'}
              issuer={formData.issuer || 'BANK'}
              creditLimit={formData.creditLimit ? parseFloat(formData.creditLimit) : 100000}
              currentBalance={formData.currentBalance ? parseFloat(formData.currentBalance) : 25000}
            />
          </View>

          {/* Card Name */}
          <View style={[styles.formGroup, styles.firstFormGroup]}>
            <Text style={styles.label} allowFontScaling={false}>Card Holder Name<Text style={styles.required} allowFontScaling={false}>*</Text></Text>
            <TextInput style={styles.input}
              placeholder="Enter credit card name"
              placeholderTextColor="#9CA3AF"
              value={formData.cardName}
              onChangeText={(text) => updateFormData('cardName', text)}
              onFocus={handleInputFocus}
              autoCapitalize="words"
            />
            {errors.cardName ? <Text style={styles.errorText} allowFontScaling={false}>{errors.cardName}</Text> : null}
          </View>

          {/* Card Type */}
          <View style={styles.formGroup}> 
            <Text style={styles.label} allowFontScaling={false}>Card Type<Text style={styles.required} allowFontScaling={false}>*</Text></Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.typeChipsRow}>
              {['RuPay', 'Visa', 'Mastercard', 'American Express', 'Discover'].map((opt) => (
                <TouchableOpacity key={opt} style={[styles.chip, formData.cardType === opt && styles.chipActive]} onPress={() => updateFormData('cardType', opt)} activeOpacity={0.85}>
                  <Text style={[styles.chipText, formData.cardType === opt && styles.chipTextActive]} allowFontScaling={false}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Credit Card Last 4 Numbers */}
          <View style={styles.formGroup}>
            <Text style={styles.label} allowFontScaling={false}>Last 4 Numbers<Text style={styles.required} allowFontScaling={false}>*</Text></Text>
            <TextInput style={styles.input}
              placeholder="e.g. 3020"
              placeholderTextColor="#9CA3AF"
              value={formData.lastFourDigits}
              onChangeText={(text) => updateFormData('lastFourDigits', text.replace(/[^0-9]/g, '').slice(0, 4))}
              onFocus={handleInputFocus}
              keyboardType="numeric"
              maxLength={4}
              returnKeyType="next"
            />
            <Text style={styles.helperText} allowFontScaling={false}>Last 4 digits of your credit card</Text>
          </View>

          {/* Issuer Name */}
          <View style={styles.formGroup}> 
            <Text style={styles.label} allowFontScaling={false}>Issuer/Bank Name<Text style={styles.required} allowFontScaling={false}>*</Text></Text>
            <TextInput style={styles.input}
              placeholder="e.g. HDFC Bank, SBI, Bajaj Finance, Tata Capital"
              placeholderTextColor="#9CA3AF"
              value={formData.issuer}
              onChangeText={(text) => updateFormData('issuer', text)}
              onFocus={handleInputFocus}
              returnKeyType="next"
            />
          </View>

          {/* Credit Limit and Current Balance */}
          <View style={styles.row}> 
            <View style={[styles.formGroup, styles.rowItem]}> 
              <Text style={styles.label} allowFontScaling={false}>Credit Limit<Text style={styles.required} allowFontScaling={false}>*</Text></Text>
              <View style={styles.inputWithAdornment}>
                <Text style={styles.adornment} allowFontScaling={false}>₹</Text>
                <TextInput style={[styles.input, styles.inputFlex]}
                  placeholder="e.g. 100000"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                  value={formData.creditLimit}
                  onChangeText={(text) => updateFormData('creditLimit', text.replace(/[^0-9]/g, ''))}
                  onFocus={handleInputFocus}
                  returnKeyType="next"
                />
              </View>
              <Text style={styles.helperText} allowFontScaling={false}>Total credit available</Text>
            </View>
            <View style={[styles.formGroup, styles.rowItem]}> 
              <Text style={styles.label} allowFontScaling={false}>Current Balance<Text style={styles.required} allowFontScaling={false}>*</Text></Text>
              <View style={styles.inputWithAdornment}>
                <Text style={styles.adornment} allowFontScaling={false}>₹</Text>
                <TextInput style={[styles.input, styles.inputFlex]}
                  placeholder="e.g. 25000"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                  value={formData.currentBalance}
                  onChangeText={(text) => updateFormData('currentBalance', text.replace(/[^0-9]/g, ''))}
                  onFocus={handleInputFocus}
                  returnKeyType="next"
                />
              </View>
              <Text style={styles.helperText} allowFontScaling={false}>Current outstanding amount</Text>
            </View>
          </View>

          {/* Billing Cycle */}
          <View style={styles.row}> 
            <View style={[styles.formGroup, styles.rowItem]}> 
              <Text style={styles.label} allowFontScaling={false}>Statement Day<Text style={styles.required} allowFontScaling={false}>*</Text></Text>
              <TextInput style={styles.input}
                placeholder="e.g. 15"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
                value={formData.statementDay}
                onChangeText={(text) => updateFormData('statementDay', text.replace(/[^0-9]/g, '').slice(0, 2))}
                onFocus={handleInputFocus}
                maxLength={2}
                returnKeyType="next"
              />
              <Text style={styles.helperText} allowFontScaling={false}>Day of month (1-31)</Text>
            </View>
            <View style={[styles.formGroup, styles.rowItem]}> 
              <Text style={styles.label} allowFontScaling={false}>Payment Due Day<Text style={styles.required} allowFontScaling={false}>*</Text></Text>
              <TextInput style={styles.input}
                placeholder="e.g. 25"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
                value={formData.dueDay}
                onChangeText={(text) => updateFormData('dueDay', text.replace(/[^0-9]/g, '').slice(0, 2))}
                onFocus={handleInputFocus}
                maxLength={2}
                returnKeyType="done"
              />
              <Text style={styles.helperText} allowFontScaling={false}>Day of month (1-31)</Text>
            </View>
          </View>

          {/* Summary Section */}
          {formData.creditLimit && formData.currentBalance && (
            <View style={styles.formGroup}>
              <Text style={styles.sectionTitle} allowFontScaling={false}>Summary</Text>
              <View style={styles.summaryContainer}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel} allowFontScaling={false}>Available Credit:</Text>
                  <Text style={styles.summaryValue} allowFontScaling={false}>₹{availableCredit.toLocaleString()}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel} allowFontScaling={false}>Credit Utilization:</Text>
                  <Text style={[styles.summaryValue, utilization> 30 ? styles.warningText : null]}>
                    {utilization.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel} allowFontScaling={false}>Days Between:</Text>
                  <Text style={styles.summaryValue} allowFontScaling={false}>
                    {formData.statementDay && formData.dueDay ? 
                      (parseInt(formData.dueDay) > parseInt(formData.statementDay) ? 
                        parseInt(formData.dueDay) - parseInt(formData.statementDay) : 
                        (31 - parseInt(formData.statementDay)) + parseInt(formData.dueDay)
                      ) : '-'} days
                  </Text>
                </View>
              </View>
            </View>
          )}
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
              <Text style={styles.saveButtonText} allowFontScaling={false}>Update Credit Card</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  formGroup: {
    marginBottom: 20,
  },
  firstFormGroup: {
    marginTop: 16,
  },
  cardPreviewSection: {
    alignItems: 'center',
    marginBottom: 30,
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
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 4,
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
  row: {
    flexDirection: 'row',
    gap: 16,
  },
  rowItem: {
    flex: 1,
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
    paddingVertical: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  chipActive: {
    backgroundColor: '#DBEAFE',
    borderColor: '#3B82F6',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  chipTextActive: {
    color: '#1E40AF',
  },
  summaryContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '600',
  },
  warningText: {
    color: '#DC2626',
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

export default EditCreditCardScreen;
