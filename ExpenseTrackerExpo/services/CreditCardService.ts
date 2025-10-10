// CreditCardService connected to backend API
import AsyncStorage from '@react-native-async-storage/async-storage';

import { API_BASE_URL } from '../config/api.config';

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
      throw error; // No fallback - cloud storage is required
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
      
      // Map mobile app fields to backend API expected format
      const cardData = {
        name: card.cardName || card.name,
        cardNumber: card.lastFourDigits || card.cardNumber || `000000000000${Math.random().toString().slice(2, 6)}`,
        cardType: card.cardType,
        issuer: card.issuer,
        creditLimit: card.creditLimit,
        balance: card.currentBalance || card.balance || 0,
        dueDate: (() => {
          const dueDay = card.dueDay ? parseInt(card.dueDay) : 15;
          const validDueDay = Math.max(1, Math.min(31, dueDay)); // Ensure day is between 1-31
          return `2024-01-${String(validDueDay).padStart(2, '0')}`;
        })(), // Convert day to full date with validation
        minPayment: card.minPayment || Math.round((card.currentBalance || 0) * 0.05), // 5% of balance
        statementDay: card.statementDay || 1,
        paymentDueDay: card.dueDay || 15,
        color: card.color || '#007AFF',
        icon: card.icon || 'card'
      };
      
      console.log('🔍 CreditCardService: Sending card data:', cardData);
      
      const response = await fetch(`${API_BASE_URL}/credit-cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(cardData),
      });

      console.log('🔍 CreditCardService: Add card response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 CreditCardService: Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('🔍 CreditCardService: Add card response:', result);
      
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

