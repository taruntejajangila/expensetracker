// AccountService connected to backend API
import { API_BASE_URL } from '../config/api.config';
import { authenticatedFetch } from './authenticatedRequest';

// Flag to prevent multiple simultaneous wallet creation attempts
let isCreatingWallet = false;

export default {
  async getAccounts() {
    try {
      console.log('🔍 AccountService: Attempting to fetch accounts from authenticated endpoint...');
      
      console.log('🔍 AccountService: Using authenticated request for accounts...');
      
      const response = await authenticatedFetch(`${API_BASE_URL}/bank-accounts`, {
        method: 'GET',
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

  async checkDuplicate(nickname?: string, accountNumber?: string, bankName?: string, excludeId?: string): Promise<{ isDuplicate: boolean; message: string | null }> {
    try {
      const queryParams = new URLSearchParams();
      if (nickname) queryParams.append('nickname', nickname);
      if (accountNumber) queryParams.append('accountNumber', accountNumber);
      if (bankName) queryParams.append('bankName', bankName);
      if (excludeId) queryParams.append('excludeId', excludeId);
      
      const response = await authenticatedFetch(`${API_BASE_URL}/bank-accounts/check-duplicate?${queryParams.toString()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = 'Error checking for duplicates';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = errorText || errorMessage;
        }
        
        return {
          isDuplicate: false,
          message: errorMessage
        };
      }

      const result = await response.json();
      
      return {
        isDuplicate: result.isDuplicate || false,
        message: result.message || null
      };
    } catch (error: any) {
      console.error('🔍 AccountService: Error checking duplicate:', error);
      return {
        isDuplicate: false,
        message: error.message || 'Error checking for duplicates'
      };
    }
  },

  async addAccount(account: any) {
    try {
      // Add required fields that backend expects
      const accountData = {
        ...account,
        balance: account.balance || 0, // Default balance to 0
        currency: account.currency || 'INR', // Default currency to INR
      };
      
      console.log('🔍 AccountService: Sending account data:', accountData);
      
      const response = await authenticatedFetch(`${API_BASE_URL}/bank-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });

      console.log('🔍 AccountService: Add account response status:', response.status);

      if (!response.ok) {
        // Read response as text first (can only read body once)
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        // Try to parse as JSON to get the specific error message
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If not JSON, use the text as error message
          errorMessage = errorText || errorMessage;
        }
        
        console.error('🔍 AccountService: Error response:', errorMessage);
        
        // Return error with specific message
        return { success: false, message: errorMessage };
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
      const response = await authenticatedFetch(`${API_BASE_URL}/bank-accounts/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(account),
      });

      if (!response.ok) {
        // Read response as text first (can only read body once)
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;
        
        // Try to parse as JSON to get the specific error message
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If not JSON, use the text as error message
          errorMessage = errorText || errorMessage;
        }
        
        return { success: false, message: errorMessage };
      }

      const result = await response.json();
      
      if (result.success) {
        return result;
      } else {
        return { success: false, message: result.message || 'Failed to update account' };
      }
    } catch (error: any) {
      console.error('Error updating account:', error);
      return { success: false, message: error.message || 'Failed to update account' };
    }
  },

  async deleteAccount(id: string) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/bank-accounts/${id}`, {
        method: 'DELETE',
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
      // Check if this is a credit card ID (prefixed with 'credit-')
      if (id.startsWith('credit-')) {
        // For credit cards, use the credit cards endpoint
        const creditCardId = id.replace('credit-', '');
        const response = await authenticatedFetch(`${API_BASE_URL}/credit-cards/${creditCardId}`, {
          method: 'GET',
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
        const response = await authenticatedFetch(`${API_BASE_URL}/bank-accounts/${id}`, {
          method: 'GET',
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

      // Check if user already has a cash wallet
      const existingAccounts = await this.getAccounts();
      const hasCashWallet = existingAccounts.some(acc => 
        acc.type === 'cash' || 
        (acc.bankName === 'Cash' && acc.name === 'Cash Wallet')
      );
      
      if (hasCashWallet) {
        console.log('🔍 AccountService: Cash wallet already exists');
        return existingAccounts.find(acc => 
          acc.type === 'cash' || 
          (acc.bankName === 'Cash' && acc.name === 'Cash Wallet')
        );
      }

      // Prevent multiple simultaneous wallet creation attempts
      if (isCreatingWallet) {
        console.log('🔍 AccountService: Wallet creation already in progress, waiting...');
        // Wait a bit and check again
        await new Promise(resolve => setTimeout(resolve, 1000));
        const updatedAccounts = await this.getAccounts();
        const updatedCashWallet = updatedAccounts.find(acc => 
          acc.type === 'cash' || 
          (acc.bankName === 'Cash' && acc.name === 'Cash Wallet')
        );
        if (updatedCashWallet) {
          console.log('🔍 AccountService: Cash wallet found after waiting');
          return updatedCashWallet;
        }
      }

      isCreatingWallet = true;

      // Create default cash wallet with unique account number
      const timestamp = Date.now();
      const defaultWalletData = {
        name: 'Cash Wallet',
        bankName: 'Cash',
        accountHolderName: 'Cash Wallet',
        accountType: 'wallet',
        balance: 0,
        currency: 'INR',
        accountNumber: `CASH${timestamp}`,
      };

      console.log('🔍 AccountService: Creating default cash wallet...');
      try {
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
            accountNumber: `CASH${timestamp}`,
            status: 'Active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
        } else {
          console.error('🔍 AccountService: Failed to create default wallet:', result.message);
          return null;
        }
      } catch (error: any) {
        // If it's a duplicate error, try to find the existing wallet
        if (error.message && error.message.includes('409')) {
          console.log('🔍 AccountService: Wallet already exists, fetching existing wallet...');
          const existingAccounts = await this.getAccounts();
          const existingWallet = existingAccounts.find(acc => 
            acc.bankName === 'Cash' && acc.name === 'Cash Wallet'
          );
          if (existingWallet) {
            console.log('🔍 AccountService: Found existing cash wallet');
            return existingWallet;
          }
        }
        console.error('🔍 AccountService: Failed to create default wallet:', error.message);
        return null;
      }
    } catch (error) {
      console.error('🔍 AccountService: Error ensuring default wallet:', error);
      return null;
    } finally {
      isCreatingWallet = false;
    }
  },

  async adjustAccountBalance(accountId: string, delta: number) {
    // This should be handled by the backend
    throw new Error('adjustAccountBalance not implemented - use backend API');
  }
};

