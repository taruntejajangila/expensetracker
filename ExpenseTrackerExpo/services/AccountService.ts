// AccountService connected to backend API
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.1.4:5000/api';

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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.message || 'Failed to delete account');
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
    // This should be handled by the backend
    throw new Error('ensureDefaultWallet not implemented - use backend API');
  },

  async adjustAccountBalance(accountId: string, delta: number) {
    // This should be handled by the backend
    throw new Error('adjustAccountBalance not implemented - use backend API');
  }
};

