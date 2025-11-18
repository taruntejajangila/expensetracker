import { API_BASE_URL } from '../config/api.config';
import { authenticatedFetch } from './authenticatedRequest';

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon: string;
  color: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export const categoryService = {
  async getCategories(): Promise<Category[]> {
    try {
      console.log('🔍 CategoryService: Fetching categories from backend API...');
      
      const response = await authenticatedFetch(`${API_BASE_URL}/categories`, {
        method: 'GET',
      });

      console.log('🔍 CategoryService: Response status:', response.status);

      if (!response.ok) {
        console.error('🔍 CategoryService: HTTP error! status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('🔍 CategoryService: Successfully fetched categories:', result.data.length);
        
        // Map emoji icons to Ionicons names
        const emojiToIoniconMap: { [key: string]: string } = {
          '💰': 'wallet',
          '🍽️': 'restaurant',
          '🚗': 'car',
          '🛍️': 'bag',
          '🎬': 'film',
          '💡': 'bulb',
          '🏥': 'medical',
          '📚': 'book',
          '✈️': 'airplane',
          '🏠': 'home',
          '🍕': 'pizza',
          '☕': 'cafe',
          '🎵': 'musical-notes',
          '🎮': 'game-controller',
          '💊': 'medical',
          '🚌': 'bus',
          '⛽': 'car',
          '🎯': 'target',
          '🏃': 'fitness',
          '💻': 'laptop',
          '📱': 'phone-portrait',
          '🛒': 'cart',
          '🎨': 'color-palette',
          '🏖️': 'beach',
          '🎪': 'happy',
          '🔧': 'construct',
          '📊': 'bar-chart',
          '💳': 'card',
          '🎁': 'gift',
          '🏆': 'trophy'
        };

        // Map API response to Category interface
        const categories: Category[] = result.data.map((cat: any) => ({
          id: cat.id.toString(),
          name: cat.name,
          type: cat.type,
          icon: emojiToIoniconMap[cat.icon] || cat.icon || 'ellipsis-horizontal',
          color: cat.color || '#A9A9A9',
          isDefault: cat.is_default || false,
          createdAt: cat.created_at,
          updatedAt: cat.updated_at,
        }));

        return categories;
      } else {
        console.error('🔍 CategoryService: API returned error:', result.message);
        throw new Error(result.message || 'Failed to fetch categories');
      }
    } catch (error) {
      console.error('🔍 CategoryService: Error fetching categories:', error);
      throw error; // No fallback - cloud storage is required
    }
  },

  async addCategory(category: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      console.log('🔍 CategoryService: Creating category:', category);
      
      const response = await authenticatedFetch(`${API_BASE_URL}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('🔍 CategoryService: Category created successfully');
        return { success: true, id: result.data.id };
      } else {
        throw new Error(result.message || 'Failed to create category');
      }
    } catch (error) {
      console.error('🔍 CategoryService: Error creating category:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async updateCategory(id: string, category: Partial<Category>) {
    try {
      console.log('🔍 CategoryService: Updating category:', id, category);
      
      const response = await authenticatedFetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(category),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('🔍 CategoryService: Category updated successfully');
        return { success: true };
      } else {
        throw new Error(result.message || 'Failed to update category');
      }
    } catch (error) {
      console.error('🔍 CategoryService: Error updating category:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async deleteCategory(id: string) {
    try {
      console.log('🔍 CategoryService: Deleting category:', id);
      
      const response = await authenticatedFetch(`${API_BASE_URL}/categories/${id}`, {
        method: 'DELETE',
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
        console.log('🔍 CategoryService: Category deleted successfully');
        return { success: true };
      } else {
        throw new Error(result.message || 'Failed to delete category');
      }
    } catch (error) {
      console.error('🔍 CategoryService: Error deleting category:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  },

  async addMissingCategories(): Promise<{ added: number; skipped: number; total: number }> {
    try {
      console.log('🔍 CategoryService: Adding missing categories...');
      
      const response = await authenticatedFetch(`${API_BASE_URL}/categories/add-missing`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ CategoryService: Missing categories added successfully:', result.data);
        return result.data;
      } else {
        throw new Error(result.message || 'Failed to add missing categories');
      }
    } catch (error) {
      console.error('❌ CategoryService: Error adding missing categories:', error);
      throw error;
    }
  }
};

