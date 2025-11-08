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
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import TransactionService, { Transaction } from '../services/transactionService';
import AccountService from '../services/AccountService';
// Credit card functionality hidden for v1 release
// import CreditCardService from '../services/CreditCardService';

import { BannerAdComponent } from '../components/AdMobComponents';
import WheelDatePicker from '../components/WheelDatePicker';
import AppOpenAdService from '../services/AppOpenAdService';

import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { categoryService, Category } from '../services/CategoryService';
import { getIconName } from '../utils/iconUtils';
import { formatCurrency, formatIndianNumberInput } from '../utils/currencyFormatter';

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
  
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [date, setDate] = useState(new Date());
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [selectedToAccountId, setSelectedToAccountId] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  // Credit card functionality hidden for v1 release
  // const [creditCards, setCreditCards] = useState<any[]>([]);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const [showToAccountDropdown, setShowToAccountDropdown] = useState(false);
  const [transactionsUntilAd, setTransactionsUntilAd] = useState<number>(5);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);

  // For v1 release, only bank accounts are available (credit cards hidden)
  const getAllAccounts = () => {
    const bankAccounts = accounts.map(acc => ({
      ...acc,
      accountType: 'bank',
      displayName: acc.name,
      displayBank: acc.bankName
    }));
    
    // Credit card functionality hidden for v1 release
    // const creditCardAccounts = creditCards.map(card => ({
    //   ...card,
    //   id: `credit-${card.id}`,
    //   accountType: 'credit',
    //   displayName: card.name,
    //   displayBank: card.issuer,
    //   balance: card.currentBalance,
    //   availableBalance: card.availableCredit
    // }));
    
    // For v1 release, only bank accounts are shown
    return bankAccounts;
  };

  // Get filtered accounts for "From Account" dropdown (v1 - only bank accounts)
  const getFromAccounts = () => {
    const allAccounts = getAllAccounts();
    // For v1 release, only bank accounts are available
    return allAccounts;
  };

  // Get filtered accounts for "To Account" dropdown (v1 - only bank accounts)
  const getToAccounts = () => {
    const allAccounts = getAllAccounts();
    // For v1 release, only bank accounts are available
    return allAccounts;
  };

  // Load accounts for selection (v1 - only bank accounts)
  useEffect(() => {
    (async () => {
      try {
        // Load only bank accounts for v1 release
        const allAccounts = await AccountService.getAccounts();
        
        // Ensure default wallet exists
        let accountsWithWallet = [...allAccounts];
        const hasWallet = allAccounts.some(acc => acc.type === 'cash' || (acc.bankName === 'Cash' && acc.name === 'Cash Wallet'));
        
        if (!hasWallet) {
          const defaultWallet = await AccountService.ensureDefaultWallet();
          if (defaultWallet) {
            // Check if wallet is not already in the list to prevent duplicates
            const walletExists = accountsWithWallet.some(acc => 
              acc.id === defaultWallet.id || 
              (acc.bankName === 'Cash' && acc.name === 'Cash Wallet')
            );
            if (!walletExists) {
              accountsWithWallet = [defaultWallet, ...allAccounts];
            }
          }
        }
        
        // Remove duplicates by ID to prevent React key errors
        const uniqueAccounts = accountsWithWallet.filter((account, index, self) => 
          index === self.findIndex(acc => acc.id === account.id)
        );
        
        // Sort accounts: wallet first, then others
        const sorted = uniqueAccounts.sort((a, b) => {
          const aCash = a.type === 'cash' ? 1 : 0;
          const bCash = b.type === 'cash' ? 0 : 1;
          return bCash - aCash; // cash first
        });
        
        setAccounts(sorted);
        // Credit card functionality hidden for v1 release
        // setCreditCards(allCreditCards);
        
        // Log loaded data for debugging
        console.log('🔍 AddTransactionScreen: Loaded accounts:', sorted.length);
        // console.log('🔍 AddTransactionScreen: Loaded credit cards:', allCreditCards.length);
        
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
        // Clear saved form data after restoring so it doesn't persist for unrelated visits
        await AsyncStorage.removeItem('addTransactionFormData');
        console.log('🗑️ Cleared saved form data after restore');
      }
      
      // Update ad counter
      updateAdCounter();
    })();
  }, []);

  // Load persisted ad counter value on mount
  useEffect(() => {
    const loadAdCounter = async () => {
      try {
        const savedCount = await AsyncStorage.getItem('transactionsUntilAd');
        if (savedCount !== null) {
          const count = parseInt(savedCount, 10);
          setTransactionsUntilAd(count);
          console.log(`📊 Loaded ad counter: ${count}`);
        }
      } catch (error) {
        console.error('❌ Error loading ad counter:', error);
      }
    };
    
    loadAdCounter();
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
      
      // Set a timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Category loading timeout')), 5000)
      );
      
      const fetchedCategories = await Promise.race([
        categoryService.getCategories(),
        timeoutPromise
      ]);
      
      // If we only have 13 categories (old count), try to add missing ones
      const categoriesArray = fetchedCategories as Category[];
      if (categoriesArray.length <= 13) {
        console.log('🔍 Only 13 categories found, attempting to add missing categories...');
        try {
          await categoryService.addMissingCategories();
          // Reload categories after adding missing ones
          const updatedCategories = await categoryService.getCategories();
          setCategories(updatedCategories as Category[]);
          console.log('✅ Categories updated after adding missing ones:', updatedCategories.length);
        } catch (addError) {
          console.error('⚠️ Could not add missing categories (non-critical):', addError);
          // Continue with existing categories
          setCategories(categoriesArray);
        }
      } else {
        setCategories(categoriesArray);
      }
      
      console.log('✅ Categories loaded successfully');
    } catch (error) {
      console.error('❌ Error loading categories:', error);
      // Don't show alert on timeout, just continue with empty categories
      if (!error?.message?.includes('timeout')) {
        Alert.alert('Error', 'Failed to load categories. Please try again.');
      }
    } finally {
      setIsLoadingCategories(false);
    }
  };

  // Function to update ad counter
  const updateAdCounter = async () => {
    try {
      // Always read fresh value from AsyncStorage to avoid stale state
      const savedCount = await AsyncStorage.getItem('transactionsUntilAd');
      const currentCount = savedCount !== null ? parseInt(savedCount, 10) : transactionsUntilAd;
      
      console.log(`📊 Current counter from storage: ${currentCount}`);
      
      // Decrease the counter
      const newCount = currentCount - 1;
      setTransactionsUntilAd(newCount);
      
      // Save to AsyncStorage to persist across app restarts
      await AsyncStorage.setItem('transactionsUntilAd', newCount.toString());
      
      console.log(`📊 Transactions until ad: ${newCount}`);
      
      // Return true if we should show ad (counter reached 0)
      if (newCount <= 0) {
        // Reset counter to 5 for next round
        setTransactionsUntilAd(5);
        await AsyncStorage.setItem('transactionsUntilAd', '5');
        return true; // Indicate ad should be shown
      }
      return false;
    } catch (error) {
      console.error('❌ Error updating ad counter:', error);
      return false;
    }
  };






  // Refresh accounts, credit cards, and categories when screen gains focus (e.g., after adding a new account)
  // Save form data to AsyncStorage before navigating away
  const saveFormData = async () => {
    try {
      const formData = {
        type,
        amount,
        title,
        category,
        note,
        date: date.toISOString(),
        selectedAccountId,
        selectedToAccountId,
      };
      await AsyncStorage.setItem('addTransactionFormData', JSON.stringify(formData));
      console.log('💾 Saved form data before navigation');
    } catch (error) {
      console.error('❌ Error saving form data:', error);
    }
  };

  // Restore form data from AsyncStorage
  const restoreFormData = async () => {
    try {
      const savedData = await AsyncStorage.getItem('addTransactionFormData');
      if (savedData) {
        const formData = JSON.parse(savedData);
        setType(formData.type || 'expense');
        setAmount(formData.amount || '');
        setTitle(formData.title || '');
        setCategory(formData.category || '');
        setNote(formData.note || '');
        setDate(formData.date ? new Date(formData.date) : new Date());
        setSelectedAccountId(formData.selectedAccountId || null);
        setSelectedToAccountId(formData.selectedToAccountId || null);
        setErrors({});
        console.log('✅ Restored form data from storage');
      }
    } catch (error) {
      console.error('❌ Error restoring form data:', error);
    }
  };

  // Clear saved form data
  const clearSavedFormData = async () => {
    try {
      await AsyncStorage.removeItem('addTransactionFormData');
      console.log('🗑️ Cleared saved form data');
    } catch (error) {
      console.error('❌ Error clearing form data:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      let isActive = true;
      // Restore form data if available, otherwise reset form when opening in add mode
      if (!isEditMode) {
        // Try to restore saved form data first
        (async () => {
          const savedData = await AsyncStorage.getItem('addTransactionFormData');
          if (savedData && isActive) {
            await restoreFormData();
          } else if (isActive && !savedData) {
            // Only reset if no saved data exists
        setAmount('');
        setTitle('');
        setCategory('');
        setNote('');
        setErrors({});
        setDate(new Date());
          }
          if (isActive) {
        setShowCategoryDropdown(false);
        setShowAccountDropdown(false);
          }
        })();
      }
      (async () => {
        try {
          console.log('🔍 AddTransactionScreen: Force refreshing data on screen focus...');
          
          // Load fresh accounts and categories (v1 - no credit cards)
          const [allAccounts, allCategories] = await Promise.all([
            AccountService.getAccounts(),
            categoryService.getCategories()
          ]);
          
          // Ensure default wallet exists
          let accountsWithWallet = [...allAccounts];
          const hasWallet = allAccounts.some(acc => acc.type === 'cash' || (acc.bankName === 'Cash' && acc.name === 'Cash Wallet'));
          
          if (!hasWallet) {
            const defaultWallet = await AccountService.ensureDefaultWallet();
            if (defaultWallet) {
              // Check if wallet is not already in the list to prevent duplicates
              const walletExists = accountsWithWallet.some(acc => 
                acc.id === defaultWallet.id || 
                (acc.bankName === 'Cash' && acc.name === 'Cash Wallet')
              );
              if (!walletExists) {
                accountsWithWallet = [defaultWallet, ...allAccounts];
              }
            }
          }
          
          // Remove duplicates by ID to prevent React key errors
          const uniqueAccounts = accountsWithWallet.filter((account, index, self) => 
            index === self.findIndex(acc => acc.id === account.id)
          );
          
          // Sort accounts: wallet first, then others
          const sorted = uniqueAccounts.sort((a, b) => {
            const aCash = a.type === 'cash' ? 1 : 0;
            const bCash = b.type === 'cash' ? 0 : 1;
            return bCash - aCash; // cash first
          });
          
          if (isActive) {
            setAccounts(sorted);
            // Credit card functionality hidden for v1 release
            // setCreditCards(allCreditCards);
            setCategories(allCategories);
            setIsLoadingCategories(false);
            
            console.log('🔍 AddTransactionScreen: Force refreshed - accounts:', sorted.length, 'categories:', allCategories.length);
            console.log('🔍 AddTransactionScreen: Available accounts:', sorted.map(a => ({ id: a.id, name: a.name, type: a.type })));
            
            // Only set default account if not in edit mode or if no account is selected
            if (!isEditMode && !selectedAccountId && sorted.length > 0) {
              const wallet = sorted.find(a => a.type === 'cash');
              setSelectedAccountId(wallet ? wallet.id : sorted[0].id);
            }
          }
        } catch (error) {
          console.error('❌ AddTransactionScreen: Error refreshing data:', error);
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
      console.log('🔍 AddTransactionScreen: Populating edit form with transaction:', {
        type: editTransaction.type,
        fromAccount: editTransaction.fromAccount,
        toAccount: editTransaction.toAccount
      });
      
      setType(editTransaction.type);
      setAmount(editTransaction.amount.toString());
      setTitle(editTransaction.title);
      setCategory(editTransaction.category);
      setDate(new Date(editTransaction.date));
      setNote(editTransaction.note || '');
    }
  }, [isEditMode, editTransaction]);

  // Set account selection after accounts are loaded (separate useEffect to handle timing)
  useEffect(() => {
    if (isEditMode && editTransaction && accounts.length > 0) {
      console.log('🔍 AddTransactionScreen: Setting account selection after accounts loaded');
      
      // Set the correct account based on transaction type
      if (editTransaction.type === 'income' && editTransaction.toAccount) {
        // For income, money goes TO the account
        console.log('🔍 AddTransactionScreen: Setting income account to:', editTransaction.toAccount.id);
        console.log('🔍 AddTransactionScreen: Account exists in list:', accounts.some(a => a.id === editTransaction.toAccount.id));
        setSelectedAccountId(editTransaction.toAccount.id);
      } else if ((editTransaction.type === 'expense' || editTransaction.type === 'transfer') && editTransaction.fromAccount) {
        // For expense/transfer, money comes FROM the account
        console.log('🔍 AddTransactionScreen: Setting expense/transfer account to:', editTransaction.fromAccount.id);
        console.log('🔍 AddTransactionScreen: Account exists in list:', accounts.some(a => a.id === editTransaction.fromAccount.id));
        setSelectedAccountId(editTransaction.fromAccount.id);
      }
      
      // For transfers, also set the destination account
      if (editTransaction.type === 'transfer' && editTransaction.toAccount) {
        console.log('🔍 AddTransactionScreen: Setting transfer destination account to:', editTransaction.toAccount.id);
        setSelectedToAccountId(editTransaction.toAccount.id);
      }
    }
  }, [isEditMode, editTransaction, accounts]);

  // Get categories based on transaction type
  const getCategoriesByType = (transactionType: 'expense' | 'income' | 'transfer') => {
    return categories.filter(cat => cat.type === transactionType);
  };

  const expenseCategories = getCategoriesByType('expense');
  const incomeCategories = getCategoriesByType('income');
  const transferCategories = getCategoriesByType('transfer');

  const availableCategories = type === 'expense' ? expenseCategories : 
                            type === 'income' ? incomeCategories : 
                            transferCategories;

  const selectedCategory = availableCategories.find(cat => cat.name === category);
  // Using centralized currency formatter
  // Removed local formatCurrency function - now imported from utils

  // Validation function
  const isFutureDate = (inputDate: Date) => {
    const normalizedSelected = new Date(inputDate);
    normalizedSelected.setHours(0, 0, 0, 0);
    const normalizedToday = new Date();
    normalizedToday.setHours(0, 0, 0, 0);
    return normalizedSelected.getTime() > normalizedToday.getTime();
  };

  const handleDateChange = (selectedDate: Date) => {
    if (isFutureDate(selectedDate)) {
      Alert.alert(
        'Future Date Selected',
        'You can only record transactions up to today. Please pick today or an earlier date.'
      );
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      setDate(today);
      return;
    }

    setDate(selectedDate);
    if (errors.date) {
      setErrors(prev => ({ ...prev, date: '' }));
    }
  };

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
    } else {
      // Validate that the selected account exists in current data
      const fromAccounts = getFromAccounts();
      if (!fromAccounts.find(acc => acc.id === selectedAccountId)) {
        newErrors.account = 'Selected account is no longer available. Please refresh and try again.';
      }
    }

    // For transfers, also validate "To Account"
    if (type === 'transfer' && !selectedToAccountId) {
      newErrors.toAccount = 'Please select a destination account';
    } else if (type === 'transfer' && selectedToAccountId) {
      // Validate that the selected to account exists in current data
      const toAccounts = getToAccounts();
      if (!toAccounts.find(acc => acc.id === selectedToAccountId)) {
        newErrors.toAccount = 'Selected destination account is no longer available. Please refresh and try again.';
      }
    }

    // Prevent future dates
    if (isFutureDate(date)) {
      newErrors.date = 'Choose today or an earlier date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save transaction
  const handleSaveTransaction = async (saveAndAddAnother = false) => {
    console.log('🔍 AddTransactionScreen: Starting save transaction process...');
    console.log('🔍 AddTransactionScreen: Form data:', {
      type,
      amount,
      title,
      category,
      selectedAccountId,
      selectedToAccountId,
      isEditMode
    });
    
    const isValid = validateForm();
    console.log('🔍 AddTransactionScreen: Form validation result:', isValid);
    console.log('🔍 AddTransactionScreen: Current errors:', errors);

    if (!isValid) {
      console.log('❌ AddTransactionScreen: Form validation failed, not proceeding with save');
      return;
    }

    const parsedAmount = parseFloat(amount);

    const proceedSave = async () => {
      try {
        // Handle account ID formatting (v1 - only bank accounts)
        const getAccountId = (accountId: string | null) => {
          if (!accountId || accountId === 'undefined' || accountId === 'null' || accountId === 'NaN') return '';
          return accountId;
        };

        // Credit card functionality hidden for v1 release
        // const isCreditCardPayment = selectedAccountId?.startsWith('credit-');
        // const isCreditCardTransfer = selectedToAccountId?.startsWith('credit-');

        // Format date as proper ISO string with timezone information
        const formatDateTimeLocal = (date: Date): string => {
          // Always use current time when date is selected
          // WheelDatePicker only selects date without time, so we need to add time
          const now = new Date();
          const dateToFormat = new Date(date);
          
          // Set current time to the selected date
          dateToFormat.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
          
        // Format as ISO string with timezone
        // This converts local time to UTC properly
        return dateToFormat.toISOString();
        };

        const transactionData = {
          type,
          amount: parsedAmount,
          title,
          description: title, // Title goes to description field for backend (backend doesn't have separate title field)
          category,
          date: formatDateTimeLocal(date), // Format with date AND time in local timezone
          note,
          tags: note ? [note] : [], // Store notes in tags field
          accountId: getAccountId(selectedAccountId),
          // Send account information in the format backend expects
          toAccount: (type === 'income' && selectedAccountId) || (type === 'transfer' && selectedToAccountId) ? 
                     getAccountId(type === 'transfer' ? selectedToAccountId : selectedAccountId) : null,
          fromAccount: (type === 'expense' && selectedAccountId) || (type === 'transfer' && selectedAccountId) ? 
                      getAccountId(selectedAccountId) : null,
        };

        // Credit card functionality hidden for v1 release
        // Special handling for credit card payments
        // if (isCreditCardPayment && type === 'expense') {
        //   transactionData.fromAccount = getAccountId(selectedAccountId);
        //   transactionData.toAccount = null;
        // } else if (isCreditCardTransfer && type === 'transfer') {
        //   transactionData.toAccount = getAccountId(selectedToAccountId);
        //   transactionData.fromAccount = getAccountId(selectedAccountId);
        // }

        if (isEditMode && editTransaction) {
          // Update existing transaction
          console.log('🔍 AddTransactionScreen: Updating transaction with data:', transactionData);
          console.log('🔍 AddTransactionScreen: Transaction ID:', editTransaction.id);
          await TransactionService.updateTransaction(editTransaction.id, transactionData);
          console.log('🔍 AddTransactionScreen: Transaction updated successfully');
          
          // Navigate back to transaction detail screen to show updated transaction
          (navigation as any).navigate('TransactionDetail', { 
            transactionId: editTransaction.id 
          });
        } else {
          // Save new transaction
          await TransactionService.saveTransaction(transactionData);
          // Note: Account balance adjustments are now handled by the backend
          
          // Check current count from AsyncStorage BEFORE decrementing
          // Update ad counter after saving new transaction
          const shouldShowAd = await updateAdCounter();
          
          // Show interstitial ad directly if counter reached 0
          if (shouldShowAd) {
            console.log('📱 Showing interstitial ad after 5 transactions');
            try {
              await AppOpenAdService.showInterstitial();
              console.log('✅ Interstitial ad shown successfully');
            } catch (error) {
              console.error('❌ Failed to show interstitial ad:', error);
            }
          }
        }

        // Clear saved form data after successful save
        await clearSavedFormData();

        if (saveAndAddAnother && !isEditMode) {
          // Clear form for new transaction (only available when adding)
          setAmount('');
          setTitle('');
          setCategory('');
          setDate(new Date());
          setNote('');
          setErrors({}); // Clear errors
        } else {
          // Navigate back with refresh flag to trigger data reload
          (navigation as any).navigate('MainTabs', { 
            screen: 'Home',
            params: { refresh: true }
          });
        }
      } catch (error) {
        console.error('❌ AddTransactionScreen: Error saving transaction:', error);
        Alert.alert(
          'Error',
          `Failed to ${isEditMode ? 'update' : 'save'} transaction. Please try again.`,
          [{ text: 'OK' }]
        );
      }
    };

    // Check if only non-financial fields have changed (for edit mode)
    let hasFinancialChanges = true;
    if (isEditMode && editTransaction) {
      // Compare current values with original transaction values
      const originalAmount = parseFloat(editTransaction.amount?.toString() || '0');
      const originalType = editTransaction.type;
      const originalFromAccount = editTransaction.fromAccount?.id;
      const originalToAccount = editTransaction.toAccount?.id;
      
      const currentAmount = parsedAmount;
      const currentType = type;
      const currentFromAccount = selectedAccountId;
      const currentToAccount = selectedToAccountId;
      
      // Normalize values for comparison (treat undefined, null, and empty string as equivalent)
      const normalizeValue = (value: any) => {
        if (value === undefined || value === null || value === '') return null;
        return value;
      };
      
      const normalizedOriginalFromAccount = normalizeValue(originalFromAccount);
      const normalizedCurrentFromAccount = normalizeValue(currentFromAccount);
      const normalizedOriginalToAccount = normalizeValue(originalToAccount);
      const normalizedCurrentToAccount = normalizeValue(currentToAccount);
      
      // Check if any financial fields have changed
      hasFinancialChanges = (
        Math.abs(originalAmount - currentAmount) > 0.01 || // Use tolerance for amount comparison
        originalType !== currentType ||
        normalizedOriginalFromAccount !== normalizedCurrentFromAccount ||
        normalizedOriginalToAccount !== normalizedCurrentToAccount
      );
      
      console.log('🔍 AddTransactionScreen: Financial changes check:', {
        originalAmount,
        currentAmount,
        amountChanged: Math.abs(originalAmount - currentAmount) > 0.01,
        originalType,
        currentType,
        typeChanged: originalType !== currentType,
        originalFromAccount,
        currentFromAccount,
        normalizedOriginalFromAccount,
        normalizedCurrentFromAccount,
        fromAccountChanged: normalizedOriginalFromAccount !== normalizedCurrentFromAccount,
        originalToAccount,
        currentToAccount,
        normalizedOriginalToAccount,
        normalizedCurrentToAccount,
        toAccountChanged: normalizedOriginalToAccount !== normalizedCurrentToAccount,
        hasFinancialChanges
      });
    }

    // Insufficient funds check for expenses and transfers (only if there are financial changes)
    if (hasFinancialChanges && (type === 'expense' || type === 'transfer') && selectedAccountId && selectedAccountId !== 'undefined' && selectedAccountId !== 'null' && selectedAccountId !== 'NaN') {
      console.log('🔍 AddTransactionScreen: Running balance validation (financial changes detected)');
    } else if (isEditMode && !hasFinancialChanges) {
      console.log('🔍 AddTransactionScreen: Skipping balance validation (only non-financial fields changed)');
    }
    
    if (hasFinancialChanges && (type === 'expense' || type === 'transfer') && selectedAccountId && selectedAccountId !== 'undefined' && selectedAccountId !== 'null' && selectedAccountId !== 'NaN') {
      const acc = await AccountService.getAccountById(selectedAccountId);
      
      // For v1 release, only bank accounts are supported
      let currentBalance = acc?.balance || 0;
      let balanceType = 'balance';
      
      // Credit card functionality hidden for v1 release
      // if (selectedAccountId.startsWith('credit-')) {
      //   const creditLimit = acc?.creditLimit || 0;
      //   const outstandingBalance = acc?.balance || 0;
      //   currentBalance = creditLimit - outstandingBalance;
      //   balanceType = 'available credit';
      // }
      
      if (parsedAmount > currentBalance) {
        const projected = currentBalance - parsedAmount;
        Alert.alert(
          'Insufficient funds',
          `This will make ${acc?.name || 'the account'} ${balanceType} ${projected < 0 ? '-' : ''}₹${Math.abs(projected).toLocaleString()}. Continue?`,
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
      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
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
                     { backgroundColor: type === 'expense' ? '#FFF5F5' : type === 'income' ? '#F0F9FF' : '#F3E8FF' }
                   ]}>
                     <View style={styles.editTypeContent}>
                       <View style={[
                         styles.editTypeIcon,
                         { backgroundColor: type === 'expense' ? '#FF4C4C' : type === 'income' ? '#007AFF' : '#8B5CF6' }
                       ]}>
                         <Ionicons 
                           name={type === 'expense' ? 'arrow-up' : type === 'income' ? 'arrow-down' : 'swap-vertical'} 
                           size={20} 
                           color="#FFFFFF" 
                           style={styles.toggleIcon}
                         />
                       </View>
                       <View style={styles.editTypeInfo}>
                         <Text style={[
                           styles.editTypeValue,
                           { color: type === 'expense' ? '#FF4C4C' : type === 'income' ? '#007AFF' : '#8B5CF6' }
                         ]} allowFontScaling={false}>
                           {type === 'expense' ? 'Expense' : type === 'income' ? 'Income' : 'Transfer'}
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
                     type === 'expense' && styles.toggleBackgroundExpense,
                     type === 'transfer' && styles.toggleBackgroundTransfer
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
                     <TouchableOpacity
                       style={[
                         styles.toggleButton,
                         type === 'transfer' && styles.toggleButtonTransfer
                       ]}
                       onPress={() => {
                         setType('transfer');
                         // Clear category if it doesn't exist in transfer categories
                         if (category && !transferCategories.find(cat => cat.name === category)) {
                           setCategory('');
                         }
                       }}
                     >
                       <View style={styles.toggleButtonContent}>
                         <Ionicons 
                           name="swap-vertical" 
                           size={18} 
                           color={type === 'transfer' ? '#FFFFFF' : '#666666'} 
                           style={styles.toggleIcon}
                         />
                         <Text style={[
                           styles.toggleButtonText,
                           type === 'transfer' && styles.toggleButtonTextActive
                         ]} allowFontScaling={false}>
                           Transfer
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
                  value={formatIndianNumberInput(amount)}
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
                    setAmount(normalized);
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
                            
                            // Credit card functionality hidden for v1 release
                            // Auto-set transaction type for Credit Card Bill Payment
                            // if (cat.name === 'Credit Card Bill Payment') {
                            //   setType('transfer');
                            // }
                            
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
                      <Ionicons 
                        name={
                          getFromAccounts().find(a => a.id === selectedAccountId)?.type === 'cash' ? 'wallet' : 'business'
                        } 
                        size={20} 
                        color={theme.colors.text} 
                      />
                      <Text style={styles.dropdownText} allowFontScaling={false}>
                        {getFromAccounts().find(a => a.id === selectedAccountId)?.displayName || 'Select account'}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.dropdownPlaceholder} allowFontScaling={false}>
                      Select account
                    </Text>
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
                    {getFromAccounts().length === 0 ? (
                      <View style={styles.dropdownItem}>
                        <Text style={styles.dropdownItemText} allowFontScaling={false}>No accounts found</Text>
                      </View>
                    ) : (
                      getFromAccounts().map(acc => (
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
                          <Ionicons 
                            name={
                              acc.type === 'cash' ? 'wallet' : 'business'
                            } 
                            size={20} 
                            color={theme.colors.textSecondary} 
                          />
                          <Text style={styles.dropdownItemText} allowFontScaling={false}>
                            {acc.displayName}
                          </Text>
                        </View>
                        <Text style={styles.dropdownAmountText} allowFontScaling={false}>
                          {formatCurrency(acc.balance || 0)}
                        </Text>
                      </TouchableOpacity>
                    ))
                    )}
                    {/* Add Account options at the end */}
                    <TouchableOpacity
                      key="add-bank-account-option"
                      style={styles.dropdownItem}
                      onPress={async () => {
                        setShowAccountDropdown(false);
                        // Save form data before navigating
                        await saveFormData();
                        (navigation as any).navigate('AddAccount');
                      }}
                    >
                      <Ionicons name="add" size={20} color={theme.colors.textSecondary} />
                      <Text style={styles.dropdownItemText} allowFontScaling={false}>Add Bank Account</Text>
                    </TouchableOpacity>
                    {/* Credit card functionality hidden for v1 release */}
                    {/* <TouchableOpacity
                      key="add-credit-card-option"
                      style={styles.dropdownItem}
                      onPress={() => {
                        setShowAccountDropdown(false);
                        (navigation as any).navigate('AddCreditCard');
                      }}
                    >
                      <Ionicons name="card" size={20} color={theme.colors.textSecondary} />
                      <Text style={styles.dropdownItemText} allowFontScaling={false}>Add Credit Card</Text>
                    </TouchableOpacity> */}
                  </ScrollView>
                </View>
              )}
            </View>
            {errors.account && <Text style={styles.errorText} allowFontScaling={false}>{errors.account}</Text>}
          </View>

          {/* To Account Input - Only for Transfer */}
          {type === 'transfer' && (
            <View style={styles.inputGroup}>
              <View style={styles.outlinedInputContainer}>
                <Text style={styles.floatingLabel} allowFontScaling={false}>To Account</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowToAccountDropdown(!showToAccountDropdown)}
                >
                  <View style={styles.dropdownContent}>
                    {selectedToAccountId ? (
                      <>
                        <Ionicons 
                          name={
                            getToAccounts().find(a => a.id === selectedToAccountId)?.accountType === 'credit' ? 'card' : 
                            getToAccounts().find(a => a.id === selectedToAccountId)?.type === 'cash' ? 'wallet' : 'business'
                          } 
                          size={20} 
                          color={theme.colors.text} 
                        />
                        <Text style={styles.dropdownText} allowFontScaling={false}>
                          {getToAccounts().find(a => a.id === selectedToAccountId)?.displayName || 'Select account'}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.dropdownPlaceholder} allowFontScaling={false}>
                        {category === 'Credit Card Bill Payment' ? 'Select credit card' : 'Select destination account'}
                      </Text>
                    )}
                  </View>
                  <Ionicons 
                    name={showToAccountDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={theme.colors.textSecondary} 
                  />
                </TouchableOpacity>
                {/* Simple list below for to account selection */}
                {showToAccountDropdown && (
                  <View style={styles.dropdownList}>
                    <ScrollView showsVerticalScrollIndicator={false} nestedScrollEnabled style={{ maxHeight: 200 }}>
                      {getToAccounts().filter(acc => acc.id !== selectedAccountId).length === 0 ? (
                        <View style={styles.dropdownItem}>
                          <Text style={styles.dropdownItemText} allowFontScaling={false}>
                            {category === 'Credit Card Bill Payment' ? 'No credit cards found' : 'No other accounts found'}
                          </Text>
                        </View>
                      ) : (
                        getToAccounts().filter(acc => acc.id !== selectedAccountId).map(acc => (
                        <TouchableOpacity
                          key={acc.id}
                          style={styles.dropdownItemRow}
                          onPress={() => {
                            setSelectedToAccountId(acc.id);
                            if (errors.toAccount) setErrors(prev => ({ ...prev, toAccount: '' }));
                            setShowToAccountDropdown(false);
                          }}
                        >
                          <View style={styles.dropdownContent}>
                            <Ionicons 
                              name={
                                acc.accountType === 'credit' ? 'card' : 
                                acc.type === 'cash' ? 'wallet' : 'business'
                              } 
                              size={20} 
                              color={theme.colors.textSecondary} 
                            />
                            <Text style={styles.dropdownItemText} allowFontScaling={false}>{acc.name}</Text>
                            {acc.accountType === 'credit' && (
                              <Text style={[styles.dropdownItemText, { fontSize: 12, opacity: 0.7 }]} allowFontScaling={false}>
                                (Credit Card)
                              </Text>
                            )}
                          </View>
                          <Text style={styles.dropdownAmountText} allowFontScaling={false}>
                            {acc.accountType === 'credit' ? 
                              `Available: ${formatCurrency(acc.availableBalance || 0)}` : 
                              formatCurrency(acc.balance || 0)
                            }
                          </Text>
                        </TouchableOpacity>
                      ))
                      )}
                    </ScrollView>
                  </View>
                )}
              </View>
              {errors.toAccount && <Text style={styles.errorText} allowFontScaling={false}>{errors.toAccount}</Text>}
            </View>
          )}

          {/* Date Input - Custom Wheel Date Picker */}
          <View style={styles.inputGroup}>
            <WheelDatePicker
              selectedDate={date}
              onDateChange={handleDateChange}
              label="Date"
              placeholder="Select transaction date"
              buttonStyle={styles.dropdownButton}
              textStyle={styles.dateText}
            />
            {errors.date && <Text style={styles.errorText} allowFontScaling={false}>{errors.date}</Text>}
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
                  backgroundColor: type === 'expense' ? '#FF4C4C' : type === 'transfer' ? '#8B5CF6' : theme.colors.primary,
                  shadowColor: type === 'expense' ? '#FF4C4C' : type === 'transfer' ? '#8B5CF6' : theme.colors.primary,
                }
              ]}
              onPress={() => handleSaveTransaction(false)}
            >
              <Text style={styles.saveButtonText} allowFontScaling={false}>
                {isEditMode
                  ? `Update ${type === 'expense' ? 'Expense' : type === 'income' ? 'Income' : 'Transfer'}`
                  : type === 'transfer'
                    ? 'Transfer'
                    : `Save ${type === 'expense' ? 'Expense' : type === 'income' ? 'Income' : 'Transfer'}`}
              </Text>
            </TouchableOpacity>
            
            {!isEditMode && type !== 'transfer' && (
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

          {/* Bottom Banner Ad */}
        <View style={[styles.bannerAdContainer, { paddingBottom: insets.bottom }]}>
          <BannerAdComponent />
        </View>
      </KeyboardAvoidingView>
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
  toggleBackgroundTransfer: {
    backgroundColor: '#F3E8FF',
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
  toggleButtonTransfer: {
    backgroundColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
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
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  saveAndAddButtonText: {
    fontSize: 12,
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
