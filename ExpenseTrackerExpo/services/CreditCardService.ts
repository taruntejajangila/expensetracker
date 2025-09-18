// CreditCardService connected to backend API
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.29.14:5001/api';

const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    console.log('🔍 CreditCardService: Retrieved auth token:', token ? 'Token found' : 'No token');
    if (!token) {
      console.log('🔍 CreditCardService: No auth token found, using test token');
      return 'test-token';
    }
    return token;
  } catch (error) {
    console.log('🔍 CreditCardService: Error getting auth token:', error);
    return 'test-token';
  }
};

export default {
  async getCreditCards() {
    try {
      console.log('🔍 CreditCardService: Fetching credit cards from cloud database...');
      
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/credit-cards`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 CreditCardService: Response status:', response.status);
      console.log('🔍 CreditCardService: Response ok:', response.ok);

      if (!response.ok) {
        console.error('🔍 CreditCardService: HTTP error! status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 CreditCardService: Response data:', result);
      
      if (result.success) {
        console.log('🔍 CreditCardService: Successfully fetched credit cards:', result.data.length);
        
        // Map API response to expected format
        const mappedCards = result.data.map((card: any) => ({
          id: card.id,
          name: card.name,
          cardNumber: card.card_number,
          cardType: card.card_type,
          issuer: card.issuer,
          creditLimit: parseFloat(card.credit_limit),
          currentBalance: parseFloat(card.balance),
          availableCredit: parseFloat(card.credit_limit) - parseFloat(card.balance),
          dueDate: card.due_date,
          minPayment: parseFloat(card.min_payment),
          color: card.color,
          icon: card.icon,
          isActive: card.is_active,
          createdAt: card.created_at,
          updatedAt: card.updated_at,
          // Additional fields for UI compatibility
          type: card.card_type,
          bankName: card.issuer,
          lastFourDigits: card.card_number ? card.card_number.slice(-4) : '0000',
          statementDay: card.statement_day,
          dueDay: card.payment_due_day
        }));
        
        console.log('🔍 CreditCardService: Mapped credit cards:', mappedCards.length);
        return mappedCards;
      } else {
        console.error('🔍 CreditCardService: API returned error:', result.message);
        throw new Error(result.message || 'Failed to fetch credit cards');
      }
    } catch (error) {
      console.error('🔍 CreditCardService: Error fetching credit cards:', error);
      
      // Fallback to mock data if backend is not available
      console.log('🔍 CreditCardService: Falling back to mock data');
      return [
        {
          id: '1',
          name: 'Chase Freedom',
          cardNumber: '****1234',
          bankName: 'Chase Bank',
          creditLimit: 5000,
          currentBalance: 1200,
          availableCredit: 3800,
          interestRate: 18.99,
          minimumPayment: 25,
          dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
          color: '#007AFF',
          icon: 'card',
          type: 'visa',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Capital One Venture',
          cardNumber: '****5678',
          bankName: 'Capital One',
          creditLimit: 8000,
          currentBalance: 0,
          availableCredit: 8000,
          interestRate: 16.99,
          minimumPayment: 0,
          dueDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          color: '#34C759',
          icon: 'card',
          type: 'mastercard',
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
    }
  },

  async getCreditCardById(id: string) {
    try {
      console.log('🔍 CreditCardService: Fetching credit card by ID:', id);
      
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/credit-cards/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 CreditCardService: Response status:', response.status);

      if (!response.ok) {
        console.error('🔍 CreditCardService: HTTP error! status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 CreditCardService: Response data:', result);
      
      if (result.success) {
        console.log('🔍 CreditCardService: Successfully fetched credit card:', result.data);
        
        // Map API response to expected format
        const card = result.data;
        const mappedCard = {
          id: card.id,
          cardName: card.name,
          cardType: card.card_type,
          issuer: card.issuer,
          lastFourDigits: card.card_number ? card.card_number.slice(-4) : '0000',
          creditLimit: parseFloat(card.credit_limit),
          currentBalance: parseFloat(card.balance),
          statementDay: card.statement_day,
          dueDay: card.payment_due_day,
          isActive: card.is_active,
          createdAt: card.created_at,
          updatedAt: card.updated_at,
          // Additional fields for UI compatibility
          name: card.name,
          cardNumber: card.card_number,
          bankName: card.issuer,
          availableCredit: parseFloat(card.credit_limit) - parseFloat(card.balance),
          dueDate: card.due_date,
          minPayment: parseFloat(card.min_payment),
          color: card.color,
          icon: card.icon,
          type: card.card_type
        };
        
        console.log('🔍 CreditCardService: Mapped credit card:', mappedCard);
        return { data: mappedCard };
      } else {
        console.error('🔍 CreditCardService: API returned error:', result.message);
        throw new Error(result.message || 'Failed to fetch credit card');
      }
    } catch (error) {
      console.error('🔍 CreditCardService: Error fetching credit card by ID:', error);
      throw error;
    }
  },

  async addCreditCard(card: any) {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/credit-cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(card),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.message || 'Failed to add credit card');
      }
    } catch (error) {
      console.error('Error adding credit card:', error);
      return { success: false, message: error.message };
    }
  },

  async updateCreditCard(id: string, card: any) {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/credit-cards/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(card),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.message || 'Failed to update credit card');
      }
    } catch (error) {
      console.error('Error updating credit card:', error);
      return { success: false, message: error.message };
    }
  },

  async deleteCreditCard(id: string) {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/credit-cards/${id}`, {
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
        throw new Error(result.message || 'Failed to delete credit card');
      }
    } catch (error) {
      console.error('Error deleting credit card:', error);
      return { success: false, message: error.message };
    }
  },

  async makePayment(cardId: string, amount: number) {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/credit-cards/${cardId}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ amount }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.message || 'Failed to make payment');
      }
    } catch (error) {
      console.error('Error making payment:', error);
      return { success: false, message: error.message };
    }
  }
};

