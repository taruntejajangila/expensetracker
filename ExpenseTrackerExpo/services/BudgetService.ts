import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.29.14:5001/api';

export interface Budget {
  id: string;
  name: string;
  amount: number;
  spent: number;
  category: string;
  categoryId: string;
  period: string;
  startDate: string;
  endDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

// Helper function to get auth token
const getAuthToken = async (): Promise<string> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      console.log('🔍 BudgetService: Retrieved auth token: Token found');
      return token;
    } else {
      console.log('🔍 BudgetService: No auth token found, using test token');
      // Fallback to test token for development
      return 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NDRmMGExZi1kOTY4LTRmYzUtOGY0Yi01YmMxYTUyN2UxOTEiLCJlbWFpbCI6InNhbWVlcmF0ZXN0aW5nQGdtYWlsLmNvbSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNzU3ODM3NTY1LCJleHAiOjE3NTc5MjM5NjV9.Eced8RqQigeji6jo6QjrvimI4w4AAyv50IMLunADD3Q';
    }
  } catch (error) {
    console.error('🔍 BudgetService: Error retrieving auth token:', error);
    throw error;
  }
};

export default {
  async getBudgets(): Promise<Budget[]> {
    try {
      console.log('🔍 BudgetService: Fetching budgets from backend API...');
      
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/budgets`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 BudgetService: Response status:', response.status);

      if (!response.ok) {
        console.error('🔍 BudgetService: HTTP error! status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 BudgetService: Response data:', result);

      if (result.success) {
        console.log('🔍 BudgetService: Successfully fetched budgets:', result.data.length);
        return result.data;
      } else {
        console.error('🔍 BudgetService: API returned error:', result.message);
        throw new Error(result.message || 'Failed to fetch budgets');
      }
    } catch (error) {
      console.error('🔍 BudgetService: Error fetching budgets:', error);
      
      // Fallback to mock data if backend is not available
      console.log('🔍 BudgetService: Falling back to mock data');
      return [
        {
          id: '1',
          name: 'Monthly Budget',
          amount: 5000,
          spent: 3200,
          category: 'General',
          categoryId: '1',
          period: 'monthly',
          startDate: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
    }
  },

  async addBudget(budget: any) {
    try {
      console.log('🔍 BudgetService: Creating budget:', budget);
      
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/budgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(budget),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('🔍 BudgetService: Budget created successfully');
        return { success: true, id: result.data.id };
      } else {
        throw new Error(result.message || 'Failed to create budget');
      }
    } catch (error) {
      console.error('🔍 BudgetService: Error creating budget:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async updateBudget(id: string, budget: any) {
    try {
      console.log('🔍 BudgetService: Updating budget:', id, budget);
      
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/budgets/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(budget),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('🔍 BudgetService: Budget updated successfully');
        return { success: true };
      } else {
        throw new Error(result.message || 'Failed to update budget');
      }
    } catch (error) {
      console.error('🔍 BudgetService: Error updating budget:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async deleteBudget(id: string) {
    try {
      console.log('🔍 BudgetService: Deleting budget:', id);
      
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/budgets/${id}`, {
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
        console.log('🔍 BudgetService: Budget deleted successfully');
        return { success: true };
      } else {
        throw new Error(result.message || 'Failed to delete budget');
      }
    } catch (error) {
      console.error('🔍 BudgetService: Error deleting budget:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async getBudgetAnalytics(budgetId: string) {
    try {
      console.log('🔍 BudgetService: Fetching budget analytics for:', budgetId);
      
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/budgets/${budgetId}/analytics`, {
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
        console.log('🔍 BudgetService: Budget analytics fetched successfully');
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to fetch budget analytics');
      }
    } catch (error) {
      console.error('🔍 BudgetService: Error fetching budget analytics:', error);
      
      // Fallback to mock data
      return {
        totalBudgeted: 5000,
        totalSpent: 3200,
        remainingAmount: 1800,
        percentageSpent: 64,
        topCategories: [
          { name: 'Bills & Utilities', spent: 1200, percentage: 37.5 },
          { name: 'Food & Dining', spent: 650, percentage: 20.3 },
          { name: 'Transportation', spent: 320, percentage: 10.0 }
        ]
      };
    }
  }
};

