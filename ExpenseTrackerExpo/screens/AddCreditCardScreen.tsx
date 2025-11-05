import React, { useState, useMemo, useRef } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import CreditCard from '../components/CreditCard';
import CreditCardService from '../services/CreditCardService';

const AddCreditCardScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const styles = createStyles(theme);
  const scrollViewRef = useRef<ScrollView>(null);

  // Form state
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

  // Form validation
  const isValid = useMemo(() => {
    return (
      formData.cardName.trim().length > 0 &&
      formData.cardType.trim().length > 0 &&
      formData.issuer.trim().length > 0 &&
      formData.creditLimit.trim().length > 0 && !isNaN(Number(formData.creditLimit)) && Number(formData.creditLimit) > 0 &&
      formData.currentBalance.trim().length > 0 && !isNaN(Number(formData.currentBalance)) && Number(formData.currentBalance) >= 0 &&
      formData.statementDay.trim().length > 0 && !isNaN(Number(formData.statementDay)) && Number(formData.statementDay) >= 1 && Number(formData.statementDay) <= 31 &&
      formData.dueDay.trim().length > 0 && !isNaN(Number(formData.dueDay)) && Number(formData.dueDay) >= 1 && Number(formData.dueDay) <= 31 &&
      Number(formData.dueDay) !== Number(formData.statementDay) &&
      Number(formData.currentBalance) <= Number(formData.creditLimit) &&
      formData.lastFourDigits.trim().length === 4 && !isNaN(Number(formData.lastFourDigits))
    );
  }, [formData]);

  // Calculate available credit
  const availableCredit = parseFloat(formData.creditLimit) - parseFloat(formData.currentBalance);
  const utilization = formData.creditLimit ? (parseFloat(formData.currentBalance) / parseFloat(formData.creditLimit)) * 100 : 0;

  // Handle form submission
  const handleSubmit = async () => {
    if (isValid) {
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

        await CreditCardService.addCreditCard(creditCardData);
        
        Alert.alert(
          'Success!',
          'Credit card added successfully',
          [
            {
              text: 'OK',
              onPress: () => (navigation as any).goBack()
            }
          ]
        );
      } catch (error: any) {
        console.error('Error creating credit card:', error);
        Alert.alert(
          'Error',
          error.response?.data?.error || 'Failed to add credit card. Please try again.',
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

  // Handle keyboard show/hide with smarter scrolling
  React.useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (event) => {
      // Don't auto-scroll on keyboard show - let individual inputs handle it
    });

    return () => {
      keyboardDidShowListener?.remove();
    };
  }, []);

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
              Add Credit Card
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              Add a new credit card
            </Text>
          </View>
          
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={[styles.headerSaveButton, !isValid && styles.headerSaveButtonDisabled]}
              onPress={handleSave}
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

  const handleSave = async () => {
    if (!isValid) return;

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

      await CreditCardService.addCreditCard(creditCardData);
      
      Alert.alert(
        'Success!',
        'Credit card added successfully',
        [
          {
            text: 'OK',
            onPress: () => (navigation as any).goBack()
          }
        ]
      );
    } catch (error: any) {
      console.error('Error creating credit card:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to add credit card. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
      style={styles.container}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
              currentBalance={formData.currentBalance ? parseFloat(formData.currentBalance) : 0}
            />
          </View>

          {/* Card Name */}
          <View style={[styles.formGroup, styles.firstFormGroup]}>
            <Text style={styles.label} allowFontScaling={false}>Card Holder Name<Text style={styles.required} allowFontScaling={false}>*</Text></Text>
            <TextInput style={styles.input}
              placeholder="Enter credit card name"
              placeholderTextColor="#9CA3AF"
              value={formData.cardName}
              onChangeText={(value) => updateFormData('cardName', value)}
              onFocus={(event) => handleInputFocus(event)}
              returnKeyType="next"
              allowFontScaling={false}
            />
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
              onChangeText={(value) => updateFormData('lastFourDigits', value.replace(/[^0-9]/g, ''))}
              onFocus={(event) => handleInputFocus(event)}
              keyboardType="numeric"
              maxLength={4}
              returnKeyType="next"
              allowFontScaling={false}
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
              onChangeText={(value) => updateFormData('issuer', value)}
              onFocus={(event) => handleInputFocus(event)}
              returnKeyType="next"
              allowFontScaling={false}
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
                  onChangeText={(value) => updateFormData('creditLimit', value.replace(/[^0-9]/g, ''))}
                  onFocus={(event) => handleInputFocus(event)}
                  returnKeyType="next"
                  allowFontScaling={false}
                />
              </View>
              <Text style={styles.helperText} allowFontScaling={false}>Total credit available</Text>
            </View>
            <View style={[styles.formGroup, styles.rowItem]}> 
              <Text style={styles.label} allowFontScaling={false}>Outstanding Balance<Text style={styles.required} allowFontScaling={false}>*</Text></Text>
              <View style={styles.inputWithAdornment}>
                <Text style={styles.adornment} allowFontScaling={false}>₹</Text>
                <TextInput style={[styles.input, styles.inputFlex]}
                  placeholder="e.g. 0 (if no debt)"
                  keyboardType="numeric"
                  placeholderTextColor="#9CA3AF"
                  value={formData.currentBalance}
                  onChangeText={(value) => updateFormData('currentBalance', value.replace(/[^0-9]/g, ''))}
                  onFocus={(event) => handleInputFocus(event)}
                  returnKeyType="next"
                  allowFontScaling={false}
                />
              </View>
              <Text style={styles.helperText} allowFontScaling={false}>Amount you currently owe (outstanding debt)</Text>
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
                onChangeText={(value) => updateFormData('statementDay', value.replace(/[^0-9]/g, ''))}
                onFocus={(event) => handleInputFocus(event)}
                maxLength={2}
                returnKeyType="next"
                allowFontScaling={false}
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
                onChangeText={(value) => updateFormData('dueDay', value.replace(/[^0-9]/g, ''))}
                onFocus={(event) => handleInputFocus(event)}
                maxLength={2}
                returnKeyType="done"
                allowFontScaling={false}
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
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Text style={styles.cancelButtonText} allowFontScaling={false}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.saveButton, !isValid && styles.saveButtonDisabled]} onPress={handleSubmit} activeOpacity={0.8} disabled={!isValid}>
            <LinearGradient
              colors={['#667eea', '#764ba2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveButtonGradient}
            >
              <Text style={styles.saveButtonText} allowFontScaling={false}>Save Credit Card</Text>
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
  headerSaveButton: {
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
  headerSaveButtonDisabled: {
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
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 10,
    letterSpacing: 0.4,
  },
  firstFormGroup: {
    marginTop: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    color: theme.colors.text,
    marginBottom: 8,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  required: {
    color: '#EF4444',
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 14,
    color: theme.colors.text,
    backgroundColor: '#FFFFFF',
    height: 56,
  },
  inputWithAdornment: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    height: 56,
  },
  adornment: {
    fontSize: 14,
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
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
  },
  rowItem: {
    flex: 1,
  },
  typeChipsRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
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
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#007AFF',
  },
  summaryContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  warningText: {
    color: '#F59E0B',
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
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  saveButtonGradient: {
    flex: 1,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 12,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#000000',
    backgroundColor: '#FFFFFF',
  },
  cancelButtonText: {
    color: '#111827',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  cardPreviewSection: {
    marginTop: 16,
    alignItems: 'center',
  },
});

export default AddCreditCardScreen;
