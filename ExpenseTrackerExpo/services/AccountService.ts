// AccountService connected to backend API
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.29.14:5001/api';

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
      console.log('🔍 AccountService: Response data:', result);
      
      if (result.success) {
        console.log('🔍 AccountService: Successfully fetched accounts:', result.data.length);
        return result.data;
      } else {
        console.error('🔍 AccountService: API returned error:', result.message);
        throw new Error(result.message || 'Failed to fetch accounts');
      }
    } catch (error) {
      console.error('🔍 AccountService: Error fetching accounts:', error);
      
      // Fallback to mock data if backend is not available
      console.log('🔍 AccountService: Falling back to mock data');
      return [
        {
          id: '1',
          name: 'Main Checking',
          type: 'bank',
          balance: 5000,
          accountNumber: '****1234',
          bankName: 'Chase Bank',
          color: '#007AFF',
          icon: 'card',
          lastUpdated: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Savings Account',
          type: 'bank',
          balance: 15000,
          accountNumber: '****5678',
          bankName: 'Wells Fargo',
          color: '#34C759',
          icon: 'wallet',
          lastUpdated: new Date().toISOString(),
        }
      ];
    }
  },

  async addAccount(account: any) {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/bank-accounts`, {
        method: 'POST',
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
    } catch (error) {
      console.error('Error fetching account:', error);
      return null;
    }
  },

  async ensureDefaultWallet() {
    // Mock implementation - return a default wallet
    return {
      id: 'default-wallet',
      name: 'Default Wallet',
      type: 'wallet',
      balance: 0
    };
  },

  async adjustAccountBalance(accountId: string, delta: number) {
    // Mock implementation
    console.log(`Adjusting account ${accountId} balance by ${delta}`);
    return { success: true };
  }
};

