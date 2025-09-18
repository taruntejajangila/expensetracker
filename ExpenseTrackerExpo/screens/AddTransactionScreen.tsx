import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  TextInput,
  ScrollView,
  StatusBar,
  Platform,
  Modal,
  Alert,
} from 'react-native';
import TransactionService from '../services/transactionService';
import AccountService from '../services/AccountService';

import { InterstitialAdModal } from '../components/InterstitialAdModal';
import { BannerAd } from '../components/AdMobComponents';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { categoryService, Category } from '../services/CategoryService';
import { getIconName } from '../utils/iconUtils';

const AddTransactionScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  
  // Get transaction data if editing
  const routeParams = route.params as { transaction?: Transaction; isEdit?: boolean } | undefined;
  const editTransaction = routeParams?.transaction;
  const isEditMode = routeParams?.isEdit || false;
  
  // Route params for transaction editing
  
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [transactionsUntilAd, setTransactionsUntilAd] = useState<number>(5);
  const [showInterstitialAd, setShowInterstitialAd] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // Load accounts for selection and ensure default wallet exists
  useEffect(() => {
    (async () => {
      try {
        // Use AccountService to get accounts and ensure default wallet exists
        const allAccounts = await AccountService.getAccounts();
        
        // Ensure default wallet exists
        let accountsWithWallet = [...allAccounts];
        const hasWallet = allAccounts.some(acc => acc.type === 'cash');
        
        if (!hasWallet) {
          const defaultWallet = await AccountService.ensureDefaultWallet();
          if (defaultWallet) {
            accountsWithWallet = [defaultWallet, ...allAccounts];
          }
        }
        
        // Sort accounts: wallet first, then others
        const sorted = accountsWithWallet.sort((a, b) => {
          const aCash = a.type === 'cash' ? 1 : 0;
          const bCash = b.type === 'cash' ? 0 : 1;
          return bCash - aCash; // cash first
        });
        
        setAccounts(sorted);
        
        // Set selected account to wallet if available, otherwise first account
        if (sorted.length > 0) {
          const wallet = sorted.find(a => a.type === 'cash');
          const selectedId = wallet ? wallet.id : sorted[0].id;
          
          // Validate the selected ID before setting it
          if (selectedId && selectedId !== 'undefined' && selectedId !== 'null' && selectedId !== 'NaN') {
            setSelectedAccountId(selectedId);
          } else {
            console.log('Invalid account ID generated, using fallback');
            setSelectedAccountId(sorted[0].id);
          }
        }
        
      } catch (error) {
        // Fallback: create a basic cash wallet
        const fallbackWallet = {
          id: `cash-wallet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name: 'Cash Wallet',
          bankName: 'Wallet',
          accountHolderName: 'Cash',
          type: 'cash',
          balance: 0,
          currency: 'INR',
          icon: 'wallet-outline',
          color: '#FF9500',
          accountType: 'Wallet',
          status: 'Active',
          lastUpdated: 'Just now',
        };
        
        // Validate the fallback wallet ID
        if (fallbackWallet.id && fallbackWallet.id !== 'undefined' && fallbackWallet.id !== 'null' && fallbackWallet.id !== 'NaN') {
          setAccounts([fallbackWallet]);
          setSelectedAccountId(fallbackWallet.id);
        } else {
          console.log('Fallback wallet ID invalid, creating new one');
          const newWallet = { ...fallbackWallet, id: `cash-wallet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` };
          setAccounts([newWallet]);
          setSelectedAccountId(newWallet.id);
        }
      }
      
      // Update ad counter
      updateAdCounter();
    })();
  }, []);

  // Load categories when component mounts
  useEffect(() => {
    loadCategories();
  }, []);

  // Categories are loaded once when component mounts - no need to refresh on every focus

  // Removed forceRefreshCategories - no longer needed with simplified category loading

  const loadCategories = async () => {
    try {
      setIsLoadingCategories(true);
      const fetchedCategories = await categoryService.getCategories();
      setCategories(fetchedCategories);
    } catch (error) {
      Alert.alert('Error', 'Failed to load categories. Please try again.');
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Set up interstitial ad callback
  useEffect(() => {
    const { interstitialAd } = require('../services/AdMobService');
    interstitialAd.setShowAdCallback(() => {
      setShowInterstitialAd(true);
    });
  }, []);

  // Function to update ad counter
  const updateAdCounter = async () => {
    try {
      const count = await TransactionAdService.getTransactionsUntilAd();
      setTransactionsUntilAd(count);
    } catch (error) {
      // Silent fail for ad counter update
    }
  };





  // Refresh accounts when screen gains focus (e.g., after adding a new account)
  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      // Reset form when opening in add mode
      if (!isEditMode) {
        setAmount('');
        setTitle('');
        setCategory('');
        setNote('');
        setErrors({});
        setDate(new Date());
        setShowCategoryDropdown(false);
        setShowAccountDropdown(false);
      }
      (async () => {
        const list = await AccountService.getAccounts();
        const sorted = [...list].sort((a, b) => {
          const aCash = a.type === 'cash' ? 1 : 0;
          const bCash = b.type === 'cash' ? 1 : 0;
          return bCash - aCash;
        });
        if (isActive) {
          setAccounts(sorted);
          if (!selectedAccountId && sorted.length > 0) {
            const wallet = sorted.find(a => a.type === 'cash');
            setSelectedAccountId(wallet ? wallet.id : sorted[0].id);
          }
        }
      })();
      return () => {
        isActive = false;
      };
    }, [isEditMode])
  );

  // Populate form when editing
  useEffect(() => {
    if (isEditMode && editTransaction) {
      setType(editTransaction.type);
      setAmount(editTransaction.amount.toString());
      setTitle(editTransaction.title);
      setCategory(editTransaction.category);
      setDate(new Date(editTransaction.date));
      setNote(editTransaction.note || '');
    }
  }, [isEditMode, editTransaction]);

  // Get categories based on transaction type
  const getCategoriesByType = (transactionType: 'expense' | 'income') => {
    return categories.filter(cat => cat.type === transactionType);
  };

  const expenseCategories = getCategoriesByType('expense');
  const incomeCategories = getCategoriesByType('income');

  const availableCategories = type === 'expense' ? expenseCategories : incomeCategories;

  const selectedCategory = availableCategories.find(cat => cat.name === category);
  const formatCurrency = (amount: number) => {
    const isNegative = amount < 0;
    const abs = Math.abs(amount);
    return `${isNegative ? '-' : ''}₹${abs.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  // Validation function
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};

    // Check amount
    if (!amount || amount.trim() === '') {
      newErrors.amount = 'Amount is required';
    } else if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    }

    // Check title
    if (!title || title.trim() === '') {
      newErrors.title = 'Title is required';
    }

    // Check category
    if (!category) {
      newErrors.category = 'Please select a category';
    }

    if (!selectedAccountId) {
      newErrors.account = 'Please select an account';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save transaction
  const handleSaveTransaction = async (saveAndAddAnother = false) => {
    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    const parsedAmount = parseFloat(amount);

    const proceedSave = async () => {
      try {
        const transactionData = {
          type,
          amount: parsedAmount,
          title,
          category,
          date,
          note,
          accountId: selectedAccountId && selectedAccountId !== 'undefined' && selectedAccountId !== 'null' && selectedAccountId !== 'NaN' ? selectedAccountId : '',
        };

        if (isEditMode && editTransaction) {
          // Update existing transaction
          await TransactionService.updateTransaction(editTransaction.id, transactionData);
          // Adjust account if needed (skipping complex diff for now)
        } else {
          // Save new transaction
          await TransactionService.saveTransaction(transactionData);
                  // Adjust account balance
        const delta = type === 'income' ? parsedAmount : -parsedAmount;
        if (selectedAccountId && selectedAccountId !== 'undefined' && selectedAccountId !== 'null' && selectedAccountId !== 'NaN') {
          await AccountService.adjustAccountBalance(selectedAccountId, delta);
        }
          
          // Update ad counter after saving new transaction
          updateAdCounter();
        }

        if (saveAndAddAnother && !isEditMode) {
          // Clear form for new transaction (only available when adding)
          setAmount('');
          setTitle('');
          setCategory('');
          setDate(new Date());
          setNote('');
          setErrors({}); // Clear errors
        } else {
          // Navigate back immediately
          navigation.goBack();
        }
      } catch (error) {
        // Silent failure
      }
    };

    // Insufficient funds check for expenses
    if (type === 'expense' && selectedAccountId && selectedAccountId !== 'undefined' && selectedAccountId !== 'null' && selectedAccountId !== 'NaN') {
      const acc = await AccountService.getAccountById(selectedAccountId);
      const currentBalance = acc?.balance || 0;
      if (parsedAmount > currentBalance) {
        const projected = currentBalance - parsedAmount;
        Alert.alert(
          'Insufficient funds',
          `This will make ${acc?.name || 'the account'} balance ${projected < 0 ? '-' : ''}₹${Math.abs(projected).toLocaleString()}. Continue?`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Proceed', style: 'destructive', onPress: () => { void proceedSave(); } },
          ]
        );
        return;
      }
    }

    await proceedSave();
  };

  const styles = createStyles(theme, insets);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar 
        barStyle="dark-content" 
        backgroundColor={Platform.OS === 'android' ? theme.colors.background : 'auto'}
        translucent={Platform.OS === 'android' ? false : true}
      />
      {/* Custom Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? insets.top + 10 : 0 }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} allowFontScaling={false}>{isEditMode ? 'Edit Transaction' : 'Add Transaction'}</Text>
        <View style={styles.placeholder} />
      </View>





      {/* Transaction Type Section */}
               {isEditMode ? (
                 // Edit Mode: Show transaction type as an info card
                 <View style={styles.editTypeContainer}>
                   <View style={[
                     styles.editTypeCard,
                     { backgroundColor: type === 'expense' ? '#FFF5F5' : '#F0F9FF' }
                   ]}>
                     <View style={styles.editTypeContent}>
                       <View style={[
                         styles.editTypeIcon,
                         { backgroundColor: type === 'expense' ? '#FF4C4C' : '#007AFF' }
                       ]}>
                         <Ionicons 
                           name={type === 'expense' ? 'arrow-up' : 'arrow-down'} 
                           size={20} 
                           color="#FFFFFF" 
                           style={styles.toggleIcon}
                         />
                       </View>
                       <View style={styles.editTypeInfo}>
                         <Text style={[
                           styles.editTypeValue,
                           { color: type === 'expense' ? '#FF4C4C' : '#007AFF' }
                         ]} allowFontScaling={false}>
                           {type === 'expense' ? 'Expense' : 'Income'}
                         </Text>
                       </View>
                     </View>
                   </View>
                 </View>
               ) : (
                 // Add Mode: Show toggle buttons
                 <View style={styles.toggleContainer}>
                   <View style={[
                     styles.toggleBackground,
                     type === 'expense' && styles.toggleBackgroundExpense
                   ]}>
                     <TouchableOpacity
                       style={[
                         styles.toggleButton,
                         type === 'expense' && styles.toggleButtonExpense
                       ]}
                       onPress={() => {
                         setType('expense');
                         // Clear category if it doesn't exist in expense categories
                         if (category && !expenseCategories.find(cat => cat.name === category)) {
                           setCategory('');
                         }
                       }}
                     >
                       <View style={styles.toggleButtonContent}>
                         <Ionicons 
                           name="arrow-up" 
                           size={18} 
                           color={type === 'expense' ? '#FFFFFF' : '#666666'} 
                           style={styles.toggleIcon}
                         />
                         <Text style={[
                           styles.toggleButtonText,
                           type === 'expense' && styles.toggleButtonTextActive
                         ]} allowFontScaling={false}>
                           Expense
                         </Text>
                       </View>
                     </TouchableOpacity>
                     <TouchableOpacity
                       style={[
                         styles.toggleButton,
                         type === 'income' && styles.toggleButtonActive
                       ]}
                       onPress={() => {
                         setType('income');
                         // Clear category if it doesn't exist in income categories
                         if (category && !incomeCategories.find(cat => cat.name === category)) {
                           setCategory('');
                         }
                       }}
                     >
                       <View style={styles.toggleButtonContent}>
                         <Ionicons 
                           name="arrow-down" 
                           size={18} 
                           color={type === 'income' ? '#FFFFFF' : '#666666'} 
                           style={styles.toggleIcon}
                         />
                         <Text style={[
                           styles.toggleButtonText,
                           type === 'income' && styles.toggleButtonTextActive
                         ]} allowFontScaling={false}>
                           Income
                         </Text>
                       </View>
                     </TouchableOpacity>
                   </View>
                 </View>
               )}

               {/* Form Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Amount Input */}
          <View style={[styles.inputGroup, styles.amountInputGroup]}>
            <View style={styles.outlinedInputContainer}>
                             <Text style={styles.floatingLabel} allowFontScaling={false}>Amount</Text>
              <View style={styles.amountContainer}>
                <Text style={styles.currencySymbol} allowFontScaling={false}>₹</Text>
                <TextInput style={styles.amountInput}
                  value={amount}
                  onChangeText={(text) => {
                    setAmount(text);
                    if (errors.amount) {
                      setErrors(prev => ({ ...prev, amount: ''}));
                    }
                  }}
                  placeholder="0.00"
                  placeholderTextColor={theme.colors.textSecondary}
                  keyboardType="numeric"
                  textAlignVertical="center"
                  allowFontScaling={false}
                />
              </View>
            </View>
            {errors.amount && <Text style={styles.errorText} allowFontScaling={false}>{errors.amount}</Text>}
          </View>

          {/* Title Input */}
          <View style={styles.inputGroup}>
            <View style={styles.outlinedInputContainer}>
                             <Text style={styles.floatingLabel} allowFontScaling={false}>Title</Text>
              <TextInput style={styles.textInput}
                value={title}
                onChangeText={(text) => {
                  setTitle(text);
                  if (errors.title) {
                    setErrors(prev => ({ ...prev, title: ''}));
                  }
                }}
                placeholder="Enter transaction title"
                placeholderTextColor={theme.colors.textSecondary}
                textAlignVertical="center"
                allowFontScaling={false}
              />
            </View>
            {errors.title && <Text style={styles.errorText} allowFontScaling={false}>{errors.title}</Text>}
          </View>

          {/* Category Dropdown */}
          <View style={styles.inputGroup}>
            <View style={styles.outlinedInputContainer}>
              <Text style={styles.floatingLabel} allowFontScaling={false}>Category</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
                disabled={isLoadingCategories}
              >
                <View style={styles.dropdownContent}>
                  {selectedCategory ? (
                    <>
                      <Ionicons 
                        name={selectedCategory ? getIconName(selectedCategory.icon) as any : 'ellipsis-horizontal'} 
                        size={20} 
                        color={selectedCategory ? selectedCategory.color : theme.colors.textSecondary} 
                      />
                      <Text style={styles.dropdownText} allowFontScaling={false}>{selectedCategory.name}</Text>
                    </>
                  ) : (
                    <Text style={styles.dropdownPlaceholder} allowFontScaling={false}>
                      {isLoadingCategories ? 'Loading categories...' : 'Select category'}
                    </Text>
                  )}
                </View>
                <Ionicons 
                  name={showCategoryDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={theme.colors.textSecondary} 
                />
              </TouchableOpacity>
              

              
              {/* Category Dropdown */}
              {showCategoryDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled style={{ maxHeight: 280 }}>
                    {isLoadingCategories ? (
                      <View style={styles.loadingContainer}>
                        <Text style={styles.loadingText} allowFontScaling={false}>Loading categories...</Text>
                      </View>
                    ) : availableCategories.length === 0 ? (
                      <View style={styles.emptyContainer}>
                        <Text style={styles.emptyText} allowFontScaling={false}>No {type} categories available</Text>
                      </View>
                    ) : (
                      availableCategories.map((cat) => (
                        <TouchableOpacity
                          key={cat.id}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setCategory(cat.name);
                            setShowCategoryDropdown(false);
                            if (errors.category) {
                              setErrors(prev => ({ ...prev, category: '' }));
                            }
                          }}
                        >
                          <Ionicons 
                            name={getIconName(cat.icon) as any} 
                            size={20} 
                            color={cat.color} 
                          />
                          <Text style={styles.dropdownItemText} allowFontScaling={false}>{cat.name}</Text>
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              )}
            </View>
            {errors.category && <Text style={styles.errorText} allowFontScaling={false}>{errors.category}</Text>}
            

          </View>

          {/* Account Dropdown */}
          <View style={styles.inputGroup}>
            
        
        

        
        <View style={styles.outlinedInputContainer}>
                             <Text style={styles.floatingLabel} allowFontScaling={false}>Account</Text>
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowAccountDropdown(!showAccountDropdown)}
              >
                <View style={styles.dropdownContent}>
                  {selectedAccountId ? (
                    <>
                      <Ionicons name="card" size={20} color={theme.colors.text} />
                      <Text style={styles.dropdownText} allowFontScaling={false}>
                        {accounts.find(a => a.id === selectedAccountId)?.name || 'Select account'}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.dropdownPlaceholder} allowFontScaling={false}>Select account</Text>
                  )}
                </View>
                <Ionicons 
                  name={showAccountDropdown ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={theme.colors.textSecondary} 
                />
              </TouchableOpacity>
              {/* Simple list below for account selection */}
              {showAccountDropdown && (
                <View style={styles.dropdownList}>
                  <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled style={{ maxHeight: 200 }}>
                    {accounts.length === 0 ? (
                      <View style={styles.dropdownItem}>
                        <Text style={styles.dropdownItemText} allowFontScaling={false}>No accounts found</Text>
                      </View>
                    ) : (
                      accounts.map(acc => (
                      <TouchableOpacity
                        key={acc.id}
                        style={styles.dropdownItemRow}
                        onPress={() => {
                          setSelectedAccountId(acc.id);
                          if (errors.account) setErrors(prev => ({ ...prev, account: '' }));
                          setShowAccountDropdown(false);
                        }}
                      >
                        <View style={styles.dropdownContent}>
                          <Ionicons name={acc.type === 'cash' ? 'wallet' : 'business'} size={20} color={theme.colors.textSecondary} />
                          <Text style={styles.dropdownItemText} allowFontScaling={false}>{acc.name}</Text>
                        </View>
                        <Text style={styles.dropdownAmountText} allowFontScaling={false}>{formatCurrency(acc.balance || 0)}</Text>
                      </TouchableOpacity>
                    ))
                    )}
                    {/* Add Bank Account option at the end */}
                    <TouchableOpacity
                      key="add-account-option"
                      style={styles.dropdownItem}
                      onPress={() => {
                        setShowAccountDropdown(false);
                        (navigation as any).navigate('AddAccount');
                      }}
                    >
                      <Ionicons name="add" size={20} color={theme.colors.textSecondary} />
                      <Text style={styles.dropdownItemText} allowFontScaling={false}>Add Bank Account</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>
              )}
            </View>
            {errors.account && <Text style={styles.errorText} allowFontScaling={false}>{errors.account}</Text>}
          </View>

          {/* Date Input */}
          <View style={styles.inputGroup}>
            <View style={styles.outlinedInputContainer}>
                             <Text style={styles.floatingLabel} allowFontScaling={false}>Date</Text>
              <TouchableOpacity
                style={styles.dateWrapper}
                onPress={() => setShowDatePicker(!showDatePicker)}
                activeOpacity={0.8}
              >
                <Text style={styles.dateText} allowFontScaling={false}>
                  {date.getDate().toString().padStart(2, '0')}, {date.toLocaleDateString('en-US', { month: 'long' })} {date.getFullYear()}
                </Text>
              </TouchableOpacity>
              
              {showDatePicker && (
                <View style={styles.datePickerContainer}>
                  {/* Date Picker */}
                  <DateTimePicker
                    value={date}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'inline' : 'default'}
                    onChange={(event: any, selectedDate?: Date) => {
                      if (selectedDate) {
                        setDate(selectedDate);
                      }
                      // Close after any selection, even if it's the same date (iOS inline or Android set)
                      const action = event?.type;
                      if (action === 'set' || Platform.OS === 'ios') {
                        setShowDatePicker(false);
                      }
                    }}
                    style={styles.picker}
                  />
                  
                  <Text style={styles.selectedDateText} allowFontScaling={false}>
                    Selected: {date.getDate().toString().padStart(2, '0')}, {date.toLocaleDateString('en-US', { month: 'long' })} {date.getFullYear()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Note Input */}
          <View style={styles.inputGroup}>
            <View style={styles.outlinedInputContainer}>
                             <Text style={styles.floatingLabel} allowFontScaling={false}>Note (Optional)</Text>
              <TextInput style={[styles.textInput, styles.noteInput]}
                value={note}
                onChangeText={setNote}
                placeholder="Add a note..."
                placeholderTextColor={theme.colors.textSecondary}
                multiline
                numberOfLines={3}
                textAlignVertical="top" allowFontScaling={false} />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button, 
                styles.saveButton,
                {
                  backgroundColor: type === 'expense' ? '#FF4C4C' : theme.colors.primary,
                  shadowColor: type === 'expense' ? '#FF4C4C' : theme.colors.primary,
                }
              ]}
              onPress={() => handleSaveTransaction(false)}
            >
              <Text style={styles.saveButtonText} allowFontScaling={false}>
                {isEditMode ? `Update ${type === 'expense' ? 'Expense' : 'Income'}` : `Save ${type === 'expense' ? 'Expense' : 'Income'}`}
              </Text>
            </TouchableOpacity>
            
            {!isEditMode && (
              <TouchableOpacity
                style={[
                  styles.button, 
                  styles.saveAndAddButton,
                  {
                    backgroundColor: type === 'expense' ? '#FF4C4C' : theme.colors.primary,
                    shadowColor: type === 'expense' ? '#FF4C4C' : theme.colors.primary,
                  }
                ]}
                onPress={() => handleSaveTransaction(true)}
              >
                <Text style={styles.saveAndAddButtonText} allowFontScaling={false}>Save and Add Another</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Bottom Spacer */}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Interstitial Ad Modal */}
        <InterstitialAdModal
          visible={showInterstitialAd}
          onClose={() => setShowInterstitialAd(false)}
                  onAdClicked={() => setShowInterstitialAd(false)}
        />

        {/* Bottom Banner Ad */}
        <View style={[styles.bannerAdContainer, { paddingBottom: insets.bottom }]}>
          <BannerAd 
            size="smartBannerPortrait"
            position="bottom"
                    onAdLoaded={() => {}}
        onAdFailed={() => {}}
          />
        </View>
      </SafeAreaView>
  );
};

const createStyles = (theme: any, insets: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: Platform.OS === 'android' ? 20 : 15,
    paddingBottom: Platform.OS === 'android' ? 15 : 15,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  placeholder: {
    width: 50,
  },


  toggleContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  toggleBackground: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleBackgroundExpense: {
    backgroundColor: '#FFF5F5',
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 1,
  },
  toggleButtonActive: {
    backgroundColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleButtonExpense: {
    backgroundColor: '#FF4C4C',
    shadowColor: '#FF4C4C',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
    letterSpacing: 0.3,
  },
  toggleButtonTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  // Edit Mode Styles
  editTypeContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  editTypeCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editTypeIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  editTypeInfo: {
    flex: 1,
  },
  editTypeLabel: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '500',
    marginBottom: 4,
  },
  editTypeValue: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  toggleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleIcon: {
    marginRight: 4,
    transform: [{ rotate: '45deg' }],
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  amountInputGroup: {
    marginTop: 30,
  },
  outlinedInputContainer: {
    position: 'relative',
  },
  dateWrapper: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'android' ? 8 : 12,
    height: 56,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
  },
  inputWrapper: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E9ECEF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  floatingLabel: {
    position: 'absolute',
    top: -8,
    left: 12,
    backgroundColor: theme.colors.background,
    paddingHorizontal: 4,
    fontSize: 14,
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
    fontSize: 24,
    fontWeight: '600',
    color: theme.colors.text,
    marginRight: 8,
    lineHeight: Platform.OS === 'android' ? 32 : undefined,
    textAlignVertical: Platform.OS === 'android' ? 'center' : 'auto',
  },
  amountInput: {
    flex: 1,
    fontSize: 24,
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
  textInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'android' ? 8 : 12,
    fontSize: 14,
    color: '#000000',
    height: 56,
    textAlignVertical: 'center',
    includeFontPadding: false,
    lineHeight: Platform.OS === 'android' ? 20 : undefined,
  },
  noteInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 8,
    includeFontPadding: false,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'android' ? 8 : 16,
    height: 56,
  },
  dropdownContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dropdownText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#000000',
    lineHeight: Platform.OS === 'android' ? 20 : undefined,
    includeFontPadding: false,
  },
  dropdownPlaceholder: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: Platform.OS === 'android' ? 20 : undefined,
    includeFontPadding: false,
  },
  dropdownList: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 300,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  dropdownItemText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#000000',
  },
  dropdownAmountText: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
  },
  bottomSpacer: {
    height: 120, // Increased to account for banner ad
  },
  dateInput: {
    borderWidth: 0,
    paddingVertical: 6,
    height: 56,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  dateText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: Platform.OS === 'android' ? 20 : undefined,
    includeFontPadding: false,
  },
  datePickerContainer: {
    backgroundColor: '#F8F8F8',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    padding: 16,
    marginTop: 4,
  },
  picker: {
    marginVertical: 10,
  },
  selectedDateText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '500',
  },
  // Button Styles
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 20,
    gap: 12,
  },
  ctaButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaGradient: {
    minHeight: 54,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  button: {
    flex: 1,
    minHeight: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  saveButton: {
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  saveAndAddButton: {
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  saveAndAddButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 18,
  },
  errorText: {
    color: '#FF4C4C',
    fontSize: 12,
    marginTop: 4,
    marginLeft: 12,
    fontWeight: '500',
  },
  // Banner Ad Styles
  bannerAdContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    zIndex: 1000,
    paddingTop: 8, // Add some top padding for the ad
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },






});

export default AddTransactionScreen;
