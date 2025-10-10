import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from '../config/api.config';

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
      console.log('🔍 BudgetService: No auth token found');
      throw new Error('No authentication token available');
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

      if (result.success) {
        console.log('🔍 BudgetService: Successfully fetched budgets:', result.data.length);
        return result.data;
      } else {
        console.error('🔍 BudgetService: API returned error:', result.message);
        throw new Error(result.message || 'Failed to fetch budgets');
      }
    } catch (error) {
      console.error('🔍 BudgetService: Error fetching budgets:', error);
      throw error; // No fallback - cloud storage is required
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

      console.log('🔍 BudgetService: Response status:', response.status);

      const result = await response.json();
      console.log('🔍 BudgetService: Response data:', result);

      if (!response.ok) {
        console.error('🔍 BudgetService: Validation errors:', result.errors || result.message);
        throw new Error(result.message || `HTTP error! status: ${response.status}`);
      }
      
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
        // Try to parse the error message from the response
        try {
          const errorData = await response.json();
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        } catch (parseError) {
          // If parsing fails, fall back to generic error
          throw new Error(`HTTP error! status: ${response.status}`);
        }
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
      throw error; // No fallback - cloud storage is required
    }
  }
};

