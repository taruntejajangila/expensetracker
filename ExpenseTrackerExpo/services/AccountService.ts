// AccountService connected to backend API
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from '../config/api.config';

// For testing - you can get a real token from your backend login
const getAuthToken = async () => {
  try {
    // Try to get token from AsyncStorage or use a test token
    const token = await AsyncStorage.getItem('authToken');
    return token || 'test-token'; // Fallback for testing
  } catch (error) {
    console.log('No auth token found, using test token');
    return 'test-token';
  }
};

export default {
  async getAccounts() {
    try {
      console.log('🔍 AccountService: Attempting to fetch accounts from authenticated endpoint...');
      
      const token = await getAuthToken();
      console.log('🔍 AccountService: Using auth token:', token ? 'Token found' : 'No token');
      
      const response = await fetch(`${API_BASE_URL}/bank-accounts`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 AccountService: Response status:', response.status);
      console.log('🔍 AccountService: Response ok:', response.ok);

      if (!response.ok) {
        console.error('🔍 AccountService: HTTP error! status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('🔍 AccountService: Successfully fetched accounts:', result.data.length);
        return result.data;
      } else {
        console.error('🔍 AccountService: API returned error:', result.message);
        throw new Error(result.message || 'Failed to fetch accounts');
      }
    } catch (error) {
      console.error('🔍 AccountService: Error fetching accounts:', error);
      throw error; // No fallback - cloud storage is required
    }
  },

  async addAccount(account: any) {
    try {
      const token = await getAuthToken();
      
      // Add required fields that backend expects
      const accountData = {
        ...account,
        balance: account.balance || 0, // Default balance to 0
        currency: account.currency || 'INR', // Default currency to INR
      };
      
      console.log('🔍 AccountService: Sending account data:', accountData);
      
      const response = await fetch(`${API_BASE_URL}/bank-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(accountData),
      });

      console.log('🔍 AccountService: Add account response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 AccountService: Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('🔍 AccountService: Add account response:', result);
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.message || 'Failed to add account');
      }
    } catch (error) {
      console.error('Error adding account:', error);
      return { success: false, message: error.message };
    }
  },

  async updateAccount(id: string, account: any) {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/bank-accounts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(account),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.message || 'Failed to update account');
      }
    } catch (error) {
      console.error('Error updating account:', error);
      return { success: false, message: error.message };
    }
  },

  async deleteAccount(id: string) {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/bank-accounts/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        // Try to parse the error message from the response
        try {
          const errorData = await response.json();
          const errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
          return { success: false, message: errorMessage };
        } catch (parseError) {
          // If parsing fails, fall back to generic error
          return { success: false, message: `HTTP error! status: ${response.status}` };
        }
      }

      const result = await response.json();
      
      if (result.success) {
        return result;
      } else {
        return { success: false, message: result.message || 'Failed to delete account' };
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      return { success: false, message: error.message };
    }
  },

  async getAccountById(id: string) {
    try {
      const token = await getAuthToken();
      
      // Check if this is a credit card ID (prefixed with 'credit-')
      if (id.startsWith('credit-')) {
        // For credit cards, use the credit cards endpoint
        const creditCardId = id.replace('credit-', '');
        const response = await fetch(`${API_BASE_URL}/credit-cards/${creditCardId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          // Transform credit card data to match account format
          const creditCard = result.data;
          return {
            id: `credit-${creditCard.id}`,
            name: creditCard.name,
            bankName: creditCard.issuer,
            accountHolderName: creditCard.name,
            type: 'credit',
            balance: parseFloat(creditCard.balance),
            creditLimit: parseFloat(creditCard.credit_limit),
            currency: 'INR',
            icon: 'card',
            color: creditCard.color || '#8B5CF6',
            accountType: 'credit',
            accountNumber: creditCard.card_number || '',
            status: creditCard.is_active,
            lastUpdated: creditCard.updated_at,
            createdAt: creditCard.created_at,
            updatedAt: creditCard.updated_at,
          };
        } else {
          throw new Error(result.message || 'Failed to fetch credit card');
        }
      } else {
        // For regular bank accounts, use the bank accounts endpoint
        const response = await fetch(`${API_BASE_URL}/bank-accounts/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
          return result.data;
        } else {
          throw new Error(result.message || 'Failed to fetch account');
        }
      }
    } catch (error) {
      console.error('Error fetching account:', error);
      return null;
    }
  },

  async ensureDefaultWallet() {
    try {
      console.log('🔍 AccountService: Ensuring default cash wallet exists...');
      
      const token = await getAuthToken();
      if (!token) {
        console.log('🔍 AccountService: No auth token, cannot create default wallet');
        return null;
      }

      // Check if user already has a cash wallet
      const existingAccounts = await this.getAccounts();
      const hasCashWallet = existingAccounts.some(acc => acc.type === 'cash');
      
      if (hasCashWallet) {
        console.log('🔍 AccountService: Cash wallet already exists');
        return existingAccounts.find(acc => acc.type === 'cash');
      }

      // Create default cash wallet
      const defaultWalletData = {
        account_name: 'Cash Wallet',
        bank_name: 'Cash',
        account_holder_name: 'Cash Wallet',
        account_type: 'wallet',
        balance: 0,
        currency: 'INR',
        account_number: '',
      };

      console.log('🔍 AccountService: Creating default cash wallet...');
      const result = await this.addAccount(defaultWalletData);
      
      if (result.success) {
        console.log('🔍 AccountService: Default cash wallet created successfully');
        return {
          id: result.data.id,
          name: 'Cash Wallet',
          bankName: 'Cash',
          accountHolderName: 'Cash Wallet',
          type: 'cash',
          balance: 0,
          currency: 'INR',
          icon: 'wallet',
          color: '#10B981',
          accountType: 'wallet',
          accountNumber: '',
          status: 'Active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      } else {
        console.error('🔍 AccountService: Failed to create default wallet:', result.message);
        return null;
      }
    } catch (error) {
      console.error('🔍 AccountService: Error ensuring default wallet:', error);
      return null;
    }
  },

  async adjustAccountBalance(accountId: string, delta: number) {
    // This should be handled by the backend
    throw new Error('adjustAccountBalance not implemented - use backend API');
  }
};

