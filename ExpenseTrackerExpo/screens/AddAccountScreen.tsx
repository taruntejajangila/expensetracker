import React, { useState, useEffect, useLayoutEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';

import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AccountService from '../services/AccountService';
import { BannerAdComponent } from '../components/AdMobComponents';

interface AccountFormData {
  nickname: string;
  bankName: string;
  accountHolderName: string;
  accountNumber: string;
  accountType: string;
}

const AddAccountScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const isEdit = !!route.params?.isEdit;
  const editingAccount = route.params?.account;
  
  const [formData, setFormData] = useState<AccountFormData>({
    nickname: '',
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    accountType: '',
  });
  
  const [showAccountTypeDropdown, setShowAccountTypeDropdown] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [bankSuggestion, setBankSuggestion] = useState<string | null>(null);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const duplicateCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isInitialMount = useRef(true);

  const accountTypes = [
    { id: 'wallet', name: 'Wallet', icon: 'wallet-outline', color: '#FF6B6B' },
    { id: 'savings', name: 'Savings', icon: 'save-outline', color: '#4ECDC4' },
    { id: 'salary', name: 'Salary', icon: 'card-outline', color: '#45B7D1' },
    { id: 'current', name: 'Current', icon: 'business-outline', color: '#96CEB4' },
  ];

  // List of banks in alphabetical order (for autocomplete suggestion)
  const bankList = [
    'AU Small Finance Bank',
    'Airtel Payments Bank',
    'Axis Bank',
    'Bandhan Bank',
    'Bank of Baroda',
    'Bank of India',
    'Canara Bank',
    'Central Bank of India',
    'City Union Bank',
    'CSB Bank',
    'DCB Bank',
    'Dhanalakshmi Bank',
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
    'Paytm Payments Bank',
    'Punjab National Bank',
    'Punjab and Sind Bank',
    'RBL Bank',
    'South Indian Bank',
    'Standard Chartered',
    'State Bank of India',
    'Tamilnad Mercantile Bank',
    'UCO Bank',
    'Ujjivan Small Finance Bank',
    'Union Bank of India',
    'Yes Bank',
  ];

  // Function to find bank suggestion based on input
  const getBankSuggestion = (input: string): string | null => {
    if (!input || input.trim().length === 0) {
      return null;
    }
    
    const normalizedInput = input.toLowerCase().trim();
    
    // Priority mapping for common prefixes (user preference)
    const priorityMap: { [key: string]: string } = {
      'id': 'IDFC First Bank',  // ID should prioritize IDFC over IDBI
      'idf': 'IDFC First Bank',
      'idfc': 'IDFC First Bank',
    };
    
    // Check priority map first
    if (priorityMap[normalizedInput]) {
      return priorityMap[normalizedInput];
    }
    
    // Find the first bank that starts with the input (case-insensitive)
    const match = bankList.find(bank => 
      bank.toLowerCase().startsWith(normalizedInput)
    );
    
    return match || null;
  };

  // Prefill when editing
  useEffect(() => {
    // AddAccountScreen initialized
    
    if (isEdit && editingAccount) {
      const mapAccountType = (t?: string, type?: string) => {
        const lower = (t || '').toLowerCase();
        if (lower === 'wallet') return 'wallet';
        if (lower === 'savings') return 'savings';
        if (lower === 'salary') return 'salary';
        if (lower === 'current' || lower === 'checking') return 'current';
        if (type === 'cash') return 'wallet';
        return '';
      };
      // Apply filters to existing data when editing
      const filteredNickname = (editingAccount.name || '').replace(/[^a-zA-Z0-9\s]/g, '');
      const filteredAccountHolderName = (editingAccount.accountHolderName || '').replace(/[^a-zA-Z\s]/g, '');
      const filteredAccountNumber = (editingAccount.accountNumber || '').replace(/[^0-9]/g, '').slice(0, 4);
      
      setFormData({
        nickname: filteredNickname,
        bankName: editingAccount.bankName || editingAccount.name || '',
        accountHolderName: filteredAccountHolderName,
        accountNumber: filteredAccountNumber,
        accountType: mapAccountType(editingAccount.accountType, editingAccount.type),
      });
      // Clear any existing suggestion when entering edit mode
      setBankSuggestion(null);
      // Reset initial mount flag so validation can run when user changes values
      isInitialMount.current = false;
    } else {
      // Reset initial mount flag for new account creation
      isInitialMount.current = true;
    }
  }, [isEdit, editingAccount, route.params]);

  // Clear form when screen comes into focus (unless in edit mode)
  // This ensures a clean state when navigating back after saving
  useFocusEffect(
    React.useCallback(() => {
      // Only clear if not in edit mode and no editing account is present
      if (!isEdit && !editingAccount) {
        // Small delay to avoid clearing form while navigation is happening
        const timer = setTimeout(() => {
          setFormData({
            nickname: '',
            bankName: '',
            accountHolderName: '',
            accountNumber: '',
            accountType: '',
          });
          setErrors({});
          setBankSuggestion(null);
        }, 100);
        
        return () => clearTimeout(timer);
      }
    }, [isEdit, editingAccount])
  );

  useLayoutEffect(() => {
    if (isEdit) {
      navigation.setOptions?.({ title: 'Edit Account' } as any);
    }
  }, [isEdit, navigation]);

  // Real-time duplicate validation when nickname or accountNumber changes
  useEffect(() => {
    // Skip on initial mount (including when editing account is loaded)
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Skip check if both fields are empty
    if (!formData.nickname.trim() && !formData.accountNumber.trim()) {
      return;
    }
    
    // Trigger duplicate check (has built-in 500ms debounce)
    checkDuplicateAccount();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.nickname, formData.accountNumber, formData.bankName]);

  // Filter input based on field type
  const filterInput = (field: keyof AccountFormData, value: string): string => {
    switch (field) {
      case 'nickname':
        // Allow alphabets, numbers, and spaces
        return value.replace(/[^a-zA-Z0-9\s]/g, '');
      case 'accountHolderName':
        // Only allow alphabets and spaces
        return value.replace(/[^a-zA-Z\s]/g, '');
      case 'accountNumber':
        // Only allow numbers
        return value.replace(/[^0-9]/g, '');
      default:
        return value;
    }
  };

  const handleInputChange = (field: keyof AccountFormData, value: string) => {
    // Apply real-time filtering
    const filteredValue = filterInput(field, value);
    
    setFormData(prev => ({ ...prev, [field]: filteredValue }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Update bank suggestion for bank name field
    if (field === 'bankName') {
      const suggestion = getBankSuggestion(filteredValue);
      setBankSuggestion(suggestion && suggestion.toLowerCase() !== filteredValue.toLowerCase() ? suggestion : null);
    }
  };

  const handleBankSuggestionPress = () => {
    if (bankSuggestion) {
      setFormData(prev => ({ ...prev, bankName: bankSuggestion }));
      setBankSuggestion(null);
    }
  };

  // Check for duplicate accounts
  const checkDuplicateAccount = async () => {
    // Clear existing timeout
    if (duplicateCheckTimeoutRef.current) {
      clearTimeout(duplicateCheckTimeoutRef.current);
    }

    // Debounce the duplicate check
    duplicateCheckTimeoutRef.current = setTimeout(async () => {
      if (!formData.nickname.trim() && !formData.accountNumber.trim()) {
        return;
      }

      setCheckingDuplicate(true);
      try {
        const result = await AccountService.checkDuplicate(
          formData.nickname.trim() || undefined,
          formData.accountNumber.trim() || undefined,
          formData.bankName.trim() || undefined,
          isEdit && editingAccount?.id ? editingAccount.id : undefined
        );

        if (result.isDuplicate && result.message) {
          // Parse error message to determine which field(s) to show error on
          // Backend may return multiple errors joined with ". "
          const errorMessages = result.message.split('. ').filter(msg => msg.trim());
          const newErrors: {[key: string]: string} = {};
          
          errorMessages.forEach(msg => {
            const lowerMsg = msg.toLowerCase();
            
            // Check for bank + account number duplicate (most specific - check first)
            if (lowerMsg.includes('bank') && lowerMsg.includes('number') && lowerMsg.includes('already')) {
              newErrors.accountNumber = msg.trim();
            }
            // Check for account number duplicate (without bank)
            else if (lowerMsg.includes('account number') && lowerMsg.includes('already in use')) {
              newErrors.accountNumber = msg.trim();
            }
            // Check for nickname duplicate
            else if (lowerMsg.includes('nickname') || (lowerMsg.includes('account name') && lowerMsg.includes('already'))) {
              newErrors.nickname = msg.trim();
            }
          });
          
          // If no specific field identified, show on nickname as fallback
          if (Object.keys(newErrors).length === 0) {
            newErrors.nickname = result.message;
          }
          
          setErrors(prev => ({
            ...prev,
            ...newErrors
          }));
        } else {
          // Clear duplicate errors if not duplicate
          setErrors(prev => {
            const newErrors = { ...prev };
            if (newErrors.nickname && (newErrors.nickname.includes('already') || newErrors.nickname.includes('in use'))) {
              delete newErrors.nickname;
            }
            if (newErrors.accountNumber && (newErrors.accountNumber.includes('already') || newErrors.accountNumber.includes('in use'))) {
              delete newErrors.accountNumber;
            }
            return newErrors;
          });
        }
      } catch (error: any) {
        console.error('Error checking duplicate:', error);
        // Don't show error to user, just log it
      } finally {
        setCheckingDuplicate(false);
      }
    }, 500); // 500ms debounce
  };

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    if (!formData.nickname.trim()) {
      newErrors.nickname = 'Account nickname is required';
    }

    if (!formData.bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }

    if (!formData.accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required';
    } else if (!/^[a-zA-Z\s]+$/.test(formData.accountHolderName.trim())) {
      newErrors.accountHolderName = 'Account holder name can only contain alphabets and spaces';
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (formData.accountNumber.length !== 4 || !/^\d+$/.test(formData.accountNumber)) {
      newErrors.accountNumber = 'Please enter last 4 digits only';
    }
    
    // Validate nickname format (alphabets, numbers, and spaces allowed)
    if (!formData.nickname.trim()) {
      newErrors.nickname = 'Account nickname is required';
    } else if (!/^[a-zA-Z0-9\s]+$/.test(formData.nickname.trim())) {
      newErrors.nickname = 'Nickname can only contain alphabets, numbers, and spaces';
    }

    if (!formData.accountType) {
      newErrors.accountType = 'Please select account type';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveAccount = async () => {
    if (!validateForm()) {
      return;
    }

    // Final duplicate check before saving
    setCheckingDuplicate(true);
    try {
      const duplicateResult = await AccountService.checkDuplicate(
        formData.nickname.trim(),
        formData.accountNumber.trim(),
        formData.bankName.trim(),
        isEdit && editingAccount?.id ? editingAccount.id : undefined
      );

      if (duplicateResult.isDuplicate && duplicateResult.message) {
        Alert.alert('Duplicate Account', duplicateResult.message);
        setCheckingDuplicate(false);
        return;
      }
    } catch (error: any) {
      console.error('Error in final duplicate check:', error);
      // Continue anyway, backend will also check
    } finally {
      setCheckingDuplicate(false);
    }

    setIsLoading(true);
    
    try {
      if (isEdit && editingAccount?.id) {
        const updateData = {
          name: formData.nickname, // Backend expects 'name', not 'nickname'
          bankName: formData.bankName,
          accountHolderName: formData.accountHolderName,
          accountNumber: formData.accountNumber,
          accountType: formData.accountType,
        };
        
        
        const updatedAccount = await AccountService.updateAccount(editingAccount.id, updateData);
        
        if (updatedAccount.success) {
        Alert.alert('Success', 'Account updated successfully!', [
          { 
            text: 'OK', 
            onPress: () => {
              // Navigate to BankAccountDetail with updated data instead of going back
                if (updatedAccount.data) {
                (navigation as any).navigate('BankAccountDetail', { 
                  account: updatedAccount.data, // Use the actual account data from response
                  refresh: true 
                });
              } else {
                navigation.goBack();
              }
            }
          }
        ]);
      } else {
          // Show specific error message from backend
          Alert.alert('Error', updatedAccount.message || 'Failed to update account. Please try again.');
        }
      } else {
        const result = await AccountService.addAccount({
          name: formData.nickname, // Backend expects 'name', not 'nickname'
          bankName: formData.bankName,
          accountHolderName: formData.accountHolderName,
          accountNumber: formData.accountNumber,
          accountType: formData.accountType,
        });
        
        if (result.success) {
          // Clear form data after successful save
          setFormData({
            nickname: '',
            bankName: '',
            accountHolderName: '',
            accountNumber: '',
            accountType: '',
          });
          setErrors({});
          setBankSuggestion(null);
          
          Alert.alert('Success', 'Account added successfully!', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } else {
          // Show specific error message from backend
          Alert.alert('Error', result.message || 'Failed to add account. Please try again.');
        }
      }
    } catch (error: any) {
      // Fallback error handling
      const errorMessage = error?.message || 'Failed to save account. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Alias for header save button
  const handleSave = () => {
    handleSaveAccount();
  };

  const selectedAccountType = accountTypes.find(type => type.id === formData.accountType);

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
              {isEdit ? 'Edit Account' : 'Add Account'}
            </Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]} allowFontScaling={false}>
              {isEdit ? 'Update account details' : 'Create new account'}
            </Text>
          </View>
          
          <View style={styles.headerRight}>
          </View>
        </View>
      </View>
    );
  };

  const styles = createStyles(theme);

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      {/* Header with Safe Area */}
      <ScreenHeader theme={theme} insets={insets} />

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
            >
        {/* Welcome Section removed */}

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Account Nickname */}
          <View style={[styles.inputGroup, styles.firstInputGroup]}>
            <View style={styles.inputLabelRow}>
              <Ionicons name="pencil" size={14} color="#667eea" />
              <Text style={styles.inputLabelText} allowFontScaling={false}>Account Nickname</Text>
            </View>
            <View style={[styles.inputWrapper, errors.nickname && styles.inputError]}>
              <TextInput style={styles.textInput}
                placeholder="e.g., Chase Checking, Cash Wallet"
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.nickname}
                onChangeText={(value) => handleInputChange('nickname', value)}
                onBlur={() => {
                  if (formData.nickname.trim()) {
                    checkDuplicateAccount();
                  }
                }}
                autoCapitalize="words"
                allowFontScaling={false}
              />
              {checkingDuplicate && (
                <ActivityIndicator size="small" color="#667eea" style={{ marginLeft: 8 }} />
              )}
            </View>
            {errors.nickname && <Text style={styles.errorText} allowFontScaling={false}>{errors.nickname}</Text>}
          </View>

          {/* Bank Name */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Ionicons name="business" size={14} color="#667eea" />
              <Text style={styles.inputLabelText} allowFontScaling={false}>Bank Name</Text>
            </View>
            <View style={[styles.inputWrapper, errors.bankName && styles.inputError]}>
              <TextInput style={styles.textInput}
                placeholder="e.g., HDFC Bank, ICICI Bank"
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.bankName}
                onChangeText={(value) => handleInputChange('bankName', value)}
                autoCapitalize="words"
                allowFontScaling={false}
              />
            </View>
            {/* Bank Name Suggestion */}
            {bankSuggestion && (
              <TouchableOpacity 
                style={styles.suggestionContainer}
                onPress={handleBankSuggestionPress}
                activeOpacity={0.7}
              >
                <Ionicons name="search" size={14} color="#667eea" />
                <Text style={styles.suggestionText} allowFontScaling={false}>
                  {bankSuggestion}
                </Text>
                <Ionicons name="arrow-forward-circle" size={16} color="#667eea" />
              </TouchableOpacity>
            )}
            {errors.bankName && <Text style={styles.errorText} allowFontScaling={false}>{errors.bankName}</Text>}
          </View>

          {/* Account Holder Name */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Ionicons name="person" size={14} color="#667eea" />
              <Text style={styles.inputLabelText} allowFontScaling={false}>Account Holder Name</Text>
            </View>
            <View style={[styles.inputWrapper, errors.accountHolderName && styles.inputError]}>
              <TextInput style={styles.textInput}
                placeholder="Enter account holder name"
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.accountHolderName}
                onChangeText={(value) => handleInputChange('accountHolderName', value)}
                autoCapitalize="words"
                allowFontScaling={false}
              />
            </View>
            {errors.accountHolderName && <Text style={styles.errorText} allowFontScaling={false}>{errors.accountHolderName}</Text>}
          </View>

          {/* Account Number */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Ionicons name="card" size={14} color="#667eea" />
              <Text style={styles.inputLabelText} allowFontScaling={false}>Account Number (Last 4 digits)</Text>
            </View>
            <View style={[styles.inputWrapper, errors.accountNumber && styles.inputError]}>
              <TextInput style={styles.textInput}
                placeholder="1234"
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.accountNumber}
                onChangeText={(value) => handleInputChange('accountNumber', value)}
                onBlur={() => {
                  if (formData.accountNumber.trim() || formData.nickname.trim()) {
                    checkDuplicateAccount();
                  }
                }}
                keyboardType="numeric"
                maxLength={4}
                allowFontScaling={false}
              />
            </View>
            {errors.accountNumber && <Text style={styles.errorText} allowFontScaling={false}>{errors.accountNumber}</Text>}
          </View>

          {/* Account Type */}
          <View style={styles.inputGroup}>
            <View style={styles.inputLabelRow}>
              <Ionicons name="layers" size={14} color="#667eea" />
              <Text style={styles.inputLabelText} allowFontScaling={false}>Account Type</Text>
            </View>
            <TouchableOpacity
              style={[styles.dropdownButton, errors.accountType && styles.inputError]}
              onPress={() => setShowAccountTypeDropdown(!showAccountTypeDropdown)}
              activeOpacity={0.8}
            >
              <View style={styles.dropdownContent}>
                {selectedAccountType ? (
                  <>
                    <View style={[styles.selectedTypeIcon, { backgroundColor: selectedAccountType.color }]}>
                      <Ionicons name={selectedAccountType.icon as any} size={18} color="#FFFFFF" />
                    </View>
                    <Text style={styles.dropdownText} allowFontScaling={false}>{selectedAccountType.name}</Text>
                  </>
                ) : (
                  <Text style={styles.dropdownPlaceholder} allowFontScaling={false}>Select account type</Text>
                )}
              </View>
              <Ionicons 
                name={showAccountTypeDropdown ? "chevron-up" : "chevron-down"} 
                size={18} 
                color={theme.colors.textSecondary} 
              />
            </TouchableOpacity>
            
            {showAccountTypeDropdown && (
              <View style={styles.dropdownList}>
                {accountTypes.map((type) => (
                  <TouchableOpacity
                    key={type.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      handleInputChange('accountType', type.id);
                      setShowAccountTypeDropdown(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.typeIcon, { backgroundColor: type.color }]}>
                      <Ionicons name={type.icon as any} size={18} color="#FFFFFF" />
                    </View>
                    <Text style={styles.dropdownItemText} allowFontScaling={false}>{type.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {errors.accountType && <Text style={styles.errorText} allowFontScaling={false}>{errors.accountType}</Text>}
          </View>

          {/* Banner Ad */}
          <View style={styles.adContainer}>
            <BannerAdComponent />
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText} allowFontScaling={false}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
              onPress={handleSaveAccount}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" style={styles.saveButtonSpinner} />
                  <Text style={styles.saveButtonText} allowFontScaling={false}>Saving...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="save-outline" size={18} color="#FFFFFF" style={styles.saveButtonIcon} />
                  <Text style={styles.saveButtonText} allowFontScaling={false}>{isEdit ? 'Save Changes' : 'Save Account'}</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
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
  content: {
    flex: 1,
  },
    scrollContent: {
    paddingBottom: 100,
  },
  // Welcome section removed styles
  formContainer: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  firstInputGroup: {
    marginTop: 30,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginLeft: 10,
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  inputError: {
    borderColor: '#FF6B6B',
  },
  textInput: {
    fontSize: 14,
    color: theme.colors.text,
    padding: 0,
    margin: 0,
    includeFontPadding: false,
    lineHeight: Platform.OS === 'android' ? 20 : undefined,
  },
  errorText: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
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
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 16,
    height: 56,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selectedTypeIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  dropdownText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: theme.colors.textSecondary,
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  dropdownItemText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '500',
  },
  adContainer: {
    alignItems: 'center',
    paddingVertical: 4,
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  saveButton: {
    flex: 2,
    backgroundColor: '#764ba2',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  saveButtonDisabled: {
    opacity: 0.7,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  saveButtonSpinner: {
    marginRight: 6,
  },
  saveButtonIcon: {
    marginRight: 6,
  },
});

export default AddAccountScreen;
