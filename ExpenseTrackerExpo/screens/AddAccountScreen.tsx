import React, { useState, useEffect, useLayoutEffect } from 'react';
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
} from 'react-native';

import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AccountService from '../services/AccountService';
import { LinearGradient } from 'expo-linear-gradient';

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

  const accountTypes = [
    { id: 'wallet', name: 'Wallet', icon: 'wallet-outline', color: '#FF6B6B' },
    { id: 'savings', name: 'Savings', icon: 'save-outline', color: '#4ECDC4' },
    { id: 'salary', name: 'Salary', icon: 'card-outline', color: '#45B7D1' },
    { id: 'current', name: 'Current', icon: 'business-outline', color: '#96CEB4' },
  ];

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
      setFormData({
        nickname: editingAccount.name || '',
        bankName: editingAccount.bankName || editingAccount.name || '',
        accountHolderName: editingAccount.accountHolderName || '',
        accountNumber: editingAccount.accountNumber || '',
        accountType: mapAccountType(editingAccount.accountType, editingAccount.type),
      });
    }
  }, [isEdit, editingAccount, route.params]);

  useLayoutEffect(() => {
    if (isEdit) {
      navigation.setOptions?.({ title: 'Edit Account' } as any);
    }
  }, [isEdit, navigation]);

  const handleInputChange = (field: keyof AccountFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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
    }

    if (!formData.accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (formData.accountNumber.length !== 4 || !/^\d+$/.test(formData.accountNumber)) {
      newErrors.accountNumber = 'Please enter last 4 digits only';
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
        
        Alert.alert('Success', 'Account updated successfully!', [
          { 
            text: 'OK', 
            onPress: () => {
              // Navigate to BankAccountDetail with updated data instead of going back
              if (updatedAccount) {
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
        await AccountService.addAccount({
          name: formData.nickname, // Backend expects 'name', not 'nickname'
          bankName: formData.bankName,
          accountHolderName: formData.accountHolderName,
          accountNumber: formData.accountNumber,
          accountType: formData.accountType,
        });
        Alert.alert('Success', 'Account added successfully!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save account. Please try again.');
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
    <View style={styles.container}>
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
                autoCapitalize="words"
                allowFontScaling={false}
              />
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
                placeholder="e.g., Chase Bank, Bank of America"
                placeholderTextColor={theme.colors.textSecondary}
                value={formData.bankName}
                onChangeText={(value) => handleInputChange('bankName', value)}
                autoCapitalize="words"
                allowFontScaling={false}
              />
            </View>
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

          {/* Security Section */}
          <View style={styles.securitySection}>
            <LinearGradient
              colors={['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.1)']}
              style={styles.securityGradient}
            >
              <View style={styles.securityHeader}>
                <View style={styles.securityIconContainer}>
                  <Ionicons name="shield-checkmark" size={20} color="#667eea" />
                </View>
                <View style={styles.securityTextContainer}>
                  <Text style={styles.securityTitle} allowFontScaling={false}>Your Security Matters</Text>
                  <Text style={styles.securityText} allowFontScaling={false}>
                    We never store your banking credentials. All connections are encrypted with 256-bit security.
                  </Text>
                </View>
              </View>
            </LinearGradient>
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
              <LinearGradient
                colors={['#667eea', '#764ba2']}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
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
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
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
    paddingBottom: 40,
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
  securitySection: {
    marginTop: 8,
    marginBottom: 32,
  },
  securityGradient: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(102, 126, 234, 0.2)',
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  securityIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  securityTextContainer: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 8,
  },
  securityText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    lineHeight: 20,
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
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  saveButtonGradient: {
    minHeight: 50,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
