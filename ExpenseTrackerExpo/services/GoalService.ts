import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.29.14:5001/api';

// Helper function to get auth token
const getAuthToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      console.log('🔍 GoalService: Retrieved auth token: Token found');
      return token;
    } else {
      console.log('🔍 GoalService: No auth token found');
      return null;
    }
  } catch (error) {
    console.error('🔍 GoalService: Error getting auth token:', error);
    return null;
  }
};

export interface Goal {
  id: string;
  name: string;
  description?: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string;
  status: 'active' | 'completed' | 'paused';
  goalType: string;
  icon: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export default {
  async getGoals(): Promise<Goal[]> {
    try {
      console.log('🔍 GoalService: Fetching goals from cloud database...');
      const token = await getAuthToken();
      
      if (!token) {
        console.log('🔍 GoalService: No auth token, falling back to mock data');
        return this.getMockGoals();
      }

      const response = await fetch(`${API_BASE_URL}/goals`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 GoalService: Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 GoalService: Successfully fetched goals:', data.data?.length || 0);
        
        // Map API response to expected format
        const goals: Goal[] = (data.data || []).map((goal: any) => ({
          id: goal.id,
          name: goal.name,
          description: goal.description,
          targetAmount: parseFloat(goal.target_amount || 0),
          currentAmount: parseFloat(goal.current_amount || 0),
          targetDate: goal.target_date,
          status: goal.status || 'active',
          goalType: goal.goal_type || 'savings',
          icon: goal.icon || 'target',
          color: goal.color || '#007AFF',
          createdAt: goal.created_at,
          updatedAt: goal.updated_at,
        }));

        return goals;
      } else {
        console.error('🔍 GoalService: HTTP error! status:', response.status);
        const errorData = await response.json();
        console.error('🔍 GoalService: Error response:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('🔍 GoalService: Error fetching goals:', error);
      console.log('🔍 GoalService: Falling back to mock data');
      return this.getMockGoals();
    }
  },

  async createGoal(goal: Partial<Goal>): Promise<{ success: boolean; id?: string }> {
    return this.addGoal(goal);
  },

  async addGoal(goal: Partial<Goal>): Promise<{ success: boolean; id?: string }> {
    try {
      console.log('🔍 GoalService: Adding goal to cloud database...');
      const token = await getAuthToken();
      
      if (!token) {
        console.log('🔍 GoalService: No auth token, using mock response');
        return { success: true, id: Date.now().toString() };
      }

      const response = await fetch(`${API_BASE_URL}/goals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: goal.name,
          description: goal.description,
          target_amount: goal.targetAmount,
          current_amount: goal.currentAmount || 0,
          target_date: goal.targetDate,
          goal_type: goal.goalType || 'savings',
          icon: goal.icon || 'target',
          color: goal.color || '#007AFF',
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🔍 GoalService: Successfully added goal:', data.data?.id);
        return { success: true, id: data.data?.id };
      } else {
        const errorData = await response.json();
        console.error('🔍 GoalService: Error adding goal:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('🔍 GoalService: Error adding goal:', error);
      return { success: false };
    }
  },

  async updateGoal(id: string, goal: Partial<Goal>): Promise<{ success: boolean }> {
    try {
      console.log('🔍 GoalService: Updating goal in cloud database...');
      const token = await getAuthToken();
      
      if (!token) {
        console.log('🔍 GoalService: No auth token, using mock response');
        return { success: true };
      }

      const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: goal.name,
          description: goal.description,
          target_amount: goal.targetAmount,
          target_date: goal.targetDate,
          goal_type: goal.goalType,
          icon: goal.icon,
          color: goal.color,
          status: goal.status,
        }),
      });

      if (response.ok) {
        console.log('🔍 GoalService: Successfully updated goal');
        return { success: true };
      } else {
        const errorData = await response.json();
        console.error('🔍 GoalService: Error updating goal:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('🔍 GoalService: Error updating goal:', error);
      return { success: false };
    }
  },

  async updateGoalProgress(id: string, currentAmount: number): Promise<{ success: boolean }> {
    try {
      console.log('🔍 GoalService: Updating goal progress in cloud database...');
      const token = await getAuthToken();
      
      if (!token) {
        console.log('🔍 GoalService: No auth token, using mock response');
        return { success: true };
      }

      const response = await fetch(`${API_BASE_URL}/goals/${id}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: currentAmount,
          operation: 'add', // Default to add operation
        }),
      });

      if (response.ok) {
        console.log('🔍 GoalService: Successfully updated goal progress');
        return { success: true };
      } else {
        const errorData = await response.json();
        console.error('🔍 GoalService: Error updating goal progress:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('🔍 GoalService: Error updating goal progress:', error);
      return { success: false };
    }
  },

  async addToGoal(id: string, amount: number): Promise<{ success: boolean }> {
    try {
      console.log('🔍 GoalService: Adding to goal in cloud database...');
      const token = await getAuthToken();
      
      if (!token) {
        console.log('🔍 GoalService: No auth token, using mock response');
        return { success: true };
      }

      const response = await fetch(`${API_BASE_URL}/goals/${id}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: amount,
          operation: 'add',
        }),
      });

      if (response.ok) {
        console.log('🔍 GoalService: Successfully added to goal');
        return { success: true };
      } else {
        const errorData = await response.json();
        console.error('🔍 GoalService: Error adding to goal:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('🔍 GoalService: Error adding to goal:', error);
      return { success: false };
    }
  },

  async withdrawFromGoal(id: string, amount: number): Promise<{ success: boolean }> {
    try {
      console.log('🔍 GoalService: Withdrawing from goal in cloud database...');
      const token = await getAuthToken();
      
      if (!token) {
        console.log('🔍 GoalService: No auth token, using mock response');
        return { success: true };
      }

      const response = await fetch(`${API_BASE_URL}/goals/${id}/progress`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: amount,
          operation: 'withdraw',
        }),
      });

      if (response.ok) {
        console.log('🔍 GoalService: Successfully withdrew from goal');
        return { success: true };
      } else {
        const errorData = await response.json();
        console.error('🔍 GoalService: Error withdrawing from goal:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('🔍 GoalService: Error withdrawing from goal:', error);
      return { success: false };
    }
  },

  async deleteGoal(id: string): Promise<{ success: boolean }> {
    try {
      console.log('🔍 GoalService: Deleting goal from cloud database...');
      const token = await getAuthToken();
      
      if (!token) {
        console.log('🔍 GoalService: No auth token, using mock response');
        return { success: true };
      }

      const response = await fetch(`${API_BASE_URL}/goals/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log('🔍 GoalService: Successfully deleted goal');
        return { success: true };
      } else {
        const errorData = await response.json();
        console.error('🔍 GoalService: Error deleting goal:', errorData);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (error) {
      console.error('🔍 GoalService: Error deleting goal:', error);
      return { success: false };
    }
  },

  async addContribution(goalId: string, amount: number): Promise<{ success: boolean }> {
    try {
      console.log('🔍 GoalService: Adding contribution to goal...');
      // This would typically be handled by the updateGoalProgress method
      // But we can keep this for backward compatibility
      return await this.updateGoalProgress(goalId, amount);
    } catch (error) {
      console.error('🔍 GoalService: Error adding contribution:', error);
      return { success: false };
    }
  },

  // Mock data fallback
  getMockGoals(): Goal[] {
    return [
      {
        id: '1',
        name: 'Emergency Fund',
        description: 'Build an emergency fund for unexpected expenses',
        targetAmount: 10000,
        currentAmount: 3500,
        targetDate: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        goalType: 'emergency',
        icon: 'shield',
        color: '#FF6B6B',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: '2',
        name: 'Vacation Fund',
        description: 'Save for a dream vacation',
        targetAmount: 5000,
        currentAmount: 1200,
        targetDate: new Date(Date.now() + 3 * 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        goalType: 'travel',
        icon: 'airplane',
        color: '#4ECDC4',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    ];
  }
};

