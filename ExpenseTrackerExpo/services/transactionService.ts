// TransactionService connected to backend API
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.29.14:5001/api';

export interface Transaction {
  id: string;
  accountId: string;
  type: 'income' | 'expense';
  amount: number;
  title: string;
  category: string;
  description?: string;
  date: string;
  icon?: string;
  color?: string;
}

const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    console.log('🔍 TransactionService: Retrieved auth token:', token ? `Token found: ${token.substring(0, 20)}...` : 'No token');
    if (!token) {
      console.log('🔍 TransactionService: No auth token found, using test token');
      return 'test-token';
    }
    return token;
  } catch (error) {
    console.log('🔍 TransactionService: Error getting auth token:', error);
    return 'test-token';
  }
};

export default {
  async getRecentTransactions(limit: number = 10) {
    try {
      console.log('🔍 TransactionService: Fetching recent transactions from cloud database...');
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/transactions/recent?limit=${limit}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 TransactionService: Response status:', response.status);

      if (!response.ok) {
        console.error('🔍 TransactionService: HTTP error! status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 TransactionService: Successfully fetched transactions:', result.data?.length || 0);
      
      if (result.success && result.data) {
        return result.data;
      } else {
        console.error('🔍 TransactionService: API returned error:', result.message);
        throw new Error(result.message || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error('🔍 TransactionService: Error fetching transactions:', error);
      console.log('🔍 TransactionService: Falling back to mock data');
      
      // Fallback to mock data if cloud database is unavailable
      return [
        {
          id: '1',
          accountId: '1',
          type: 'expense',
          amount: 1200,
          title: 'Lunch at restaurant',
          category: 'Food & Dining',
          description: 'Lunch at restaurant',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          icon: 'restaurant',
          color: '#FF6B6B',
        },
        {
          id: '2',
          accountId: '1',
          type: 'expense',
          amount: 500,
          title: 'Fuel for car',
          category: 'Transportation',
          description: 'Fuel for car',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          icon: 'car',
          color: '#4ECDC4',
        },
        {
          id: '3',
          accountId: '1',
          type: 'income',
          amount: 25000,
          title: 'Freelance work',
          category: 'Freelance',
          description: 'Monthly freelance payment',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          icon: 'laptop',
          color: '#F7DC6F',
        }
      ];
    }
  },
  
  async getTransactions() {
    try {
      console.log('🔍 TransactionService: Fetching all transactions from cloud database...');
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 TransactionService: Response status:', response.status);

      if (!response.ok) {
        console.error('🔍 TransactionService: HTTP error! status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 TransactionService: Successfully fetched all transactions:', result.data?.transactions?.length || result.data?.length || 0);
      
      if (result.success && result.data) {
        // Handle both direct array and nested structure
        const transactions = result.data.transactions || result.data;
        console.log('🔍 TransactionService: Returning transactions:', transactions?.length || 0);
        return transactions;
      } else {
        console.error('🔍 TransactionService: API returned error:', result.message);
        throw new Error(result.message || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error('🔍 TransactionService: Error fetching transactions:', error);
      console.log('🔍 TransactionService: Falling back to mock data');
      
      // Fallback to mock data if cloud database is unavailable
      return [
        {
          id: '1',
          accountId: '1',
          type: 'expense',
          amount: 1200,
          title: 'Lunch at restaurant',
          category: 'Food & Dining',
          description: 'Lunch at restaurant',
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          icon: 'restaurant',
          color: '#FF6B6B',
        },
        {
          id: '3',
          accountId: '1',
          type: 'income',
          amount: 50000,
          title: 'Monthly salary',
          category: 'Salary',
          description: 'Monthly salary',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          icon: 'cash',
          color: '#98D8C8',
        }
      ];
    }
  },

  async getTransactionsByMonth(year: number, month: number) {
    try {
      console.log('🔍 TransactionService: Fetching transactions for month from cloud database...', { year, month });
      
      const token = await getAuthToken();
      
      // Get all transactions and filter by month
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 TransactionService: Response status:', response.status);

      if (!response.ok) {
        console.error('🔍 TransactionService: HTTP error! status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 TransactionService: Response data:', result);
      
      if (result.success) {
        console.log('🔍 TransactionService: Successfully fetched transactions:', result.data.transactions.length);
        
        // Filter transactions by the specified month and year
        const filteredTransactions = result.data.transactions.filter((transaction: any) => {
          const transactionDate = new Date(transaction.date);
          return transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
        });
        
        console.log('🔍 TransactionService: Filtered transactions for month:', filteredTransactions.length);
        return filteredTransactions;
      } else {
        console.error('🔍 TransactionService: API returned error:', result.message);
        throw new Error(result.message || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error('🔍 TransactionService: Error fetching transactions by month:', error);
      
      // Fallback to mock data if backend is not available
      console.log('🔍 TransactionService: Falling back to mock data');
      return [
        {
          id: '1',
          accountId: '1',
          type: 'expense',
          amount: 1200,
          title: 'Lunch at restaurant',
          category: 'Food & Dining',
          description: 'Lunch at restaurant',
          date: new Date(year, month, 15).toISOString(),
          icon: 'restaurant',
          color: '#FF6B6B',
        },
        {
          id: '2',
          accountId: '1',
          type: 'expense',
          amount: 500,
          title: 'Fuel for car',
          category: 'Transportation',
          description: 'Fuel for car',
          date: new Date(year, month, 20).toISOString(),
          icon: 'car',
          color: '#4ECDC4',
        },
        {
          id: '3',
          accountId: '1',
          type: 'income',
          amount: 25000,
          title: 'Freelance work',
          category: 'Freelance',
          description: 'Monthly freelance payment',
          date: new Date(year, month, 1).toISOString(),
          icon: 'laptop',
          color: '#F7DC6F',
        }
      ];
    }
  },

  async addTransaction(transaction: any) {
    try {
      console.log('🔍 TransactionService: Saving transaction to cloud database...');
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(transaction),
      });

      console.log('🔍 TransactionService: Add transaction response status:', response.status);

      if (!response.ok) {
        console.error('🔍 TransactionService: HTTP error! status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 TransactionService: Successfully saved transaction:', result.data?.id);
      
      if (result.success) {
        return { success: true, id: result.data?.id || Date.now().toString() };
      } else {
        console.error('🔍 TransactionService: API returned error:', result.message);
        throw new Error(result.message || 'Failed to add transaction');
      }
    } catch (error) {
      console.error('🔍 TransactionService: Error adding transaction:', error);
      console.log('🔍 TransactionService: Falling back to mock response');
      
      // Fallback to mock response if cloud database is unavailable
      console.log('Adding transaction (mock):', transaction);
      return { success: true, id: Date.now().toString() };
    }
  },

  async updateTransaction(id: string, transaction: any) {
    try {
      console.log('🔍 TransactionService: Updating transaction in cloud database...');
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(transaction),
      });

      console.log('🔍 TransactionService: Update transaction response status:', response.status);

      if (!response.ok) {
        console.error('🔍 TransactionService: HTTP error! status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 TransactionService: Successfully updated transaction');
      
      if (result.success) {
        return { success: true };
      } else {
        console.error('🔍 TransactionService: API returned error:', result.message);
        throw new Error(result.message || 'Failed to update transaction');
      }
    } catch (error) {
      console.error('🔍 TransactionService: Error updating transaction:', error);
      console.log('🔍 TransactionService: Falling back to mock response');
      
      // Fallback to mock response if cloud database is unavailable
      console.log('Updating transaction (mock):', id, transaction);
      return { success: true };
    }
  },

  async deleteTransaction(id: string) {
    try {
      console.log('🔍 TransactionService: Deleting transaction from cloud database...');
      
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 TransactionService: Delete transaction response status:', response.status);

      if (!response.ok) {
        console.error('🔍 TransactionService: HTTP error! status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 TransactionService: Successfully deleted transaction');
      
      if (result.success) {
        return { success: true };
      } else {
        console.error('🔍 TransactionService: API returned error:', result.message);
        throw new Error(result.message || 'Failed to delete transaction');
      }
    } catch (error) {
      console.error('🔍 TransactionService: Error deleting transaction:', error);
      console.log('🔍 TransactionService: Falling back to mock response');
      
      // Fallback to mock response if cloud database is unavailable
      console.log('Deleting transaction (mock):', id);
      return { success: true };
    }
  },

  async saveTransaction(transaction: any) {
    return this.addTransaction(transaction);
  },

  async backfillAccountIds() {
    // Mock implementation
    return Promise.resolve();
  }
};

