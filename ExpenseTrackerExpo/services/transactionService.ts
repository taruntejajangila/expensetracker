// TransactionService connected to backend API
import { categoryService } from './CategoryService';
import DailyReminderService from './DailyReminderService';

import { API_BASE_URL } from '../config/api.config';
import { authenticatedFetch } from './authenticatedRequest';

export interface Transaction {
  id: string;
  accountId: string;
  accountType?: 'bank_account' | 'credit_card' | 'cash';
  type: 'income' | 'expense' | 'transfer';
  amount: number;
  title: string;
  category: string;
  description?: string;
  note?: string;
  date: string;
  createdAt?: Date;
  icon?: string;
  color?: string;
  categoryIcon?: string;
  categoryColor?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  fromAccount?: {
    id: string;
    name: string;
    bankName?: string;
    accountNumber?: string;
  };
  toAccount?: {
    id: string;
    name: string;
    bankName?: string;
    accountNumber?: string;
  };
}

// Helper function to normalize account ID (no longer needed for classification)
const normalizeAccountId = (accountId: string | undefined | null): string => {
  return accountId || '1';
};

// Helper function to enrich transactions with category information
const enrichTransactionsWithCategories = async (transactions: any[]): Promise<any[]> => {
  try {
    console.log('🔍 TransactionService: Enriching transactions with category information...');
    const categories = await categoryService.getCategories();
    console.log('🔍 TransactionService: Loaded categories:', categories.length);
    
    // Create a map for quick category lookup
    const categoryMap = new Map();
    categories.forEach(cat => {
      categoryMap.set(cat.name, { icon: cat.icon, color: cat.color });
    });
    
    // Enrich transactions with category icon and color
    const enrichedTransactions = transactions.map(transaction => {
      const categoryInfo = categoryMap.get(transaction.category);
      return {
        ...transaction,
        icon: transaction.icon || categoryInfo?.icon || 'receipt',
        color: transaction.color || categoryInfo?.color || '#6B7280',
        categoryicon: transaction.categoryicon || categoryInfo?.icon || 'receipt',
        categorycolor: transaction.categorycolor || categoryInfo?.color || '#6B7280'
      };
    });
    
    console.log('🔍 TransactionService: Enriched transactions with category icons and colors');
    return enrichedTransactions;
  } catch (error) {
    console.error('🔍 TransactionService: Error enriching transactions with categories:', error);
    // Return transactions with default icons/colors if category enrichment fails
    return transactions.map(transaction => ({
      ...transaction,
      icon: transaction.icon || 'receipt',
      color: transaction.color || '#6B7280',
      categoryicon: transaction.categoryicon || 'receipt',
      categorycolor: transaction.categorycolor || '#6B7280'
    }));
  }
};

export default {
  async getRecentTransactions(limit: number = 10) {
    try {
      console.log('🔍 TransactionService: Fetching recent transactions from cloud database...');
      
      const response = await authenticatedFetch(`${API_BASE_URL}/transactions/recent?limit=${limit}`, {
        method: 'GET',
      });

      console.log('🔍 TransactionService: Response status:', response.status);

      if (!response.ok) {
        console.error('🔍 TransactionService: HTTP error! status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 TransactionService: Successfully fetched transactions:', result.data?.length || 0);
      
      if (result.success && result.data) {
        // Map backend response to expected format
        const mappedTransactions = result.data.map((t: any) => {
          // Debug: Log original transaction data for recent transactions
          console.log('🔍 TransactionService: Processing recent transaction:', {
            id: t.id,
            originalType: t.type,
            description: t.description,
            fromAccount: t.from_account,
            toAccount: t.to_account,
            amount: t.amount
          });
          
          // Determine the correct display type for the frontend
          let displayType = t.type;
          
          // Special handling for credit card payment transfers
          // If it's a transfer with both from and to accounts, and the description suggests it's a credit card payment
          if (t.type === 'transfer' && t.from_account && t.to_account) {
            const description = (t.description || '').toLowerCase();
            console.log('🔍 TransactionService: Checking recent transfer for credit card payment:', {
              id: t.id,
              description: description,
              hasCreditCard: description.includes('credit card'),
              hasBillPayment: description.includes('bill payment'),
              hasCardPayment: description.includes('card payment')
            });
            
            if (description.includes('credit card') || description.includes('bill payment') || description.includes('card payment')) {
              console.log('🔍 TransactionService: Converting recent credit card payment transfer to expense display:', {
                id: t.id,
                originalType: t.type,
                description: t.description,
                newDisplayType: 'expense'
              });
              displayType = 'expense'; // Display as expense for credit card payments
            }
          }
          
          return {
            id: t.id,
            accountId: normalizeAccountId(t.accountId),
            accountType: t.accountType || 'cash', // Use reliable account type from backend
            type: displayType, // Use the corrected display type
            amount: parseFloat(t.amount), // Convert string to number
            title: t.description || 'Transaction', // Use description as title since backend stores title in description field
            category: t.category || 'Other',
            description: t.description || '', // Keep description field for compatibility
            note: (t.tags && t.tags.length > 0) ? t.tags[0] : '', // Get notes from first tag
            date: new Date(t.date), // Convert string to Date object (for date display)
            createdAt: new Date(t.created_at), // Use created_at for time display
            icon: t.categoryIcon || 'receipt',
            color: t.categoryColor || '#6B7280',
          fromAccount: t.fromAccount ? {
            id: t.fromAccount.id,
            name: t.fromAccount.name,
            bankName: t.fromAccount.bankName,
            accountNumber: t.fromAccount.accountNumber
          } : undefined,
          toAccount: t.toAccount ? {
            id: t.toAccount.id,
            name: t.toAccount.name,
            bankName: t.toAccount.bankName,
            accountNumber: t.toAccount.accountNumber
          } : undefined,
          // Set bankAccountName and bankAccountNumber based on transaction type
          bankAccountName: displayType === 'income' ? t.toAccount?.bankName : t.fromAccount?.bankName,
          bankAccountNumber: displayType === 'income' ? t.toAccount?.accountNumber : t.fromAccount?.accountNumber
          };
        });
        
        console.log('🔍 TransactionService: Mapped recent transactions:', mappedTransactions.length);
        
        // Enrich with category information
        const enrichedTransactions = await enrichTransactionsWithCategories(mappedTransactions);
        return enrichedTransactions;
      } else {
        console.error('🔍 TransactionService: API returned error:', result.message);
        throw new Error(result.message || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error('🔍 TransactionService: Error fetching transactions:', error);
      throw error; // No fallback - cloud storage is required
    }
  },
  
  async getTransactions(forceRefresh = false) {
    try {
      console.log('🔍 TransactionService: Fetching all transactions from cloud database...');
      
      // Add cache-busting parameter if force refresh is requested
      const url = forceRefresh ? 
        `${API_BASE_URL}/transactions?t=${Date.now()}` : 
        `${API_BASE_URL}/transactions`;
        
      const response = await authenticatedFetch(url, {
        method: 'GET',
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
        
        // Map backend response to expected format
        const mappedTransactions = transactions.map((t: any) => {
          // Debug: Log original transaction data
          console.log('🔍 TransactionService: Processing transaction:', {
            id: t.id,
            originalType: t.type,
            description: t.description,
            fromAccount: t.from_account,
            toAccount: t.to_account,
            amount: t.amount
          });
          
          // Determine the correct display type for the frontend
          let displayType = t.type;
          
          // Keep transfer transactions as transfers - don't convert them
          // The money manager logic will handle credit card bill payments correctly
          
          return {
            id: t.id,
            accountId: normalizeAccountId(t.accountId),
            accountType: t.accountType || 'cash', // Use reliable account type from backend
            type: displayType, // Use the corrected display type
            amount: parseFloat(t.amount), // Convert string to number
            title: t.description || 'Transaction', // Use description as title since backend stores title in description field
            category: t.category || 'Other',
            description: t.description || '', // Keep description field for compatibility
            note: (t.tags && t.tags.length > 0) ? t.tags[0] : '', // Get notes from first tag
            date: new Date(t.date), // Convert string to Date object (for date display)
            createdAt: new Date(t.created_at), // Use created_at for time display
            icon: t.categoryIcon || 'receipt',
            color: t.categoryColor || '#6B7280',
            fromAccount: t.fromAccount ? {
              id: t.fromAccount.id,
              name: t.fromAccount.name,
              bankName: t.fromAccount.bankName,
              accountNumber: t.fromAccount.accountNumber
            } : undefined,
            toAccount: t.toAccount ? {
              id: t.toAccount.id,
              name: t.toAccount.name,
              bankName: t.toAccount.bankName,
              accountNumber: t.toAccount.accountNumber
            } : undefined,
            // Set bankAccountName and bankAccountNumber based on transaction type
            bankAccountName: displayType === 'income' ? t.toAccount?.bankName : t.fromAccount?.bankName,
            bankAccountNumber: displayType === 'income' ? t.toAccount?.accountNumber : t.fromAccount?.accountNumber
          };
        });
        
        console.log('🔍 TransactionService: Mapped transactions:', mappedTransactions.length);
        
        // Enrich with category information
        const enrichedTransactions = await enrichTransactionsWithCategories(mappedTransactions);
        return enrichedTransactions;
      } else {
        console.error('🔍 TransactionService: API returned error:', result.message);
        throw new Error(result.message || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error('🔍 TransactionService: Error fetching transactions:', error);
      throw error; // No fallback - cloud storage is required
    }
  },

  async getTransactionsByMonth(year: number, month: number) {
    try {
      console.log('🔍 TransactionService: Fetching transactions for month from cloud database...', { year, month });
      
      // Get all transactions and filter by month
      const response = await authenticatedFetch(`${API_BASE_URL}/transactions`, {
        method: 'GET',
      });

      console.log('🔍 TransactionService: Response status:', response.status);

      if (!response.ok) {
        console.error('🔍 TransactionService: HTTP error! status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('🔍 TransactionService: Successfully fetched transactions:', result.data.transactions.length);
        
        // Filter transactions by the specified month and year
        const filteredTransactions = result.data.transactions.filter((transaction: any) => {
          const transactionDate = new Date(transaction.date);
          return transactionDate.getFullYear() === year && transactionDate.getMonth() === month;
        });
        
        console.log('🔍 TransactionService: Filtered transactions for month:', filteredTransactions.length);
        
        // Map backend response to expected format
        const mappedTransactions = filteredTransactions.map((t: any) => ({
          id: t.id,
          accountId: t.accountId || '1', // Default account ID
          type: t.type,
          amount: parseFloat(t.amount), // Convert string to number
          title: t.description || 'Transaction', // Use description as title since backend stores title in description field
          category: t.category || 'Other',
          description: t.description || '', // Keep description field for compatibility
          note: (t.tags && t.tags.length > 0) ? t.tags[0] : '', // Get notes from first tag
          date: new Date(t.date), // Convert string to Date object (for date display)
          createdAt: new Date(t.created_at), // Use created_at for time display
          icon: t.categoryIcon || 'receipt',
          color: t.categoryColor || '#6B7280',
          fromAccount: t.fromAccount ? {
            id: t.fromAccount.id,
            name: t.fromAccount.name,
            bankName: t.fromAccount.bankName,
            accountNumber: t.fromAccount.accountNumber
          } : undefined,
          toAccount: t.toAccount ? {
            id: t.toAccount.id,
            name: t.toAccount.name,
            bankName: t.toAccount.bankName,
            accountNumber: t.toAccount.accountNumber
          } : undefined,
          // Set bankAccountName and bankAccountNumber based on transaction type
          bankAccountName: t.type === 'income' ? t.toAccount?.bankName : t.fromAccount?.bankName,
          bankAccountNumber: t.type === 'income' ? t.toAccount?.accountNumber : t.fromAccount?.accountNumber
        }));
        
        return mappedTransactions;
      } else {
        console.error('🔍 TransactionService: API returned error:', result.message);
        throw new Error(result.message || 'Failed to fetch transactions');
      }
    } catch (error) {
      console.error('🔍 TransactionService: Error fetching transactions by month:', error);
      throw error; // No fallback - cloud storage is required
    }
  },

  async addTransaction(transaction: any) {
    try {
      console.log('🔍 TransactionService: Saving transaction to cloud database...');
      
      const response = await authenticatedFetch(`${API_BASE_URL}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });

      console.log('🔍 TransactionService: Add transaction response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 TransactionService: HTTP error! status:', response.status);
        console.error('🔍 TransactionService: Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('🔍 TransactionService: Successfully saved transaction:', result.data?.id);
      
      if (result.success) {
        // Update daily reminder service when transaction is added
        try {
          await DailyReminderService.getInstance().updateLastTransactionDate();
        } catch (error) {
          console.error('Failed to update daily reminder service:', error);
        }
        
        return { success: true, id: result.data?.id || Date.now().toString() };
      } else {
        console.error('🔍 TransactionService: API returned error:', result.message);
        throw new Error(result.message || 'Failed to add transaction');
      }
    } catch (error) {
      console.error('🔍 TransactionService: Error adding transaction:', error);
      throw error; // No fallback - cloud storage is required
    }
  },

  async updateTransaction(id: string, transaction: any) {
    try {
      console.log('🔍 TransactionService: Updating transaction in cloud database...');
      
      const response = await authenticatedFetch(`${API_BASE_URL}/transactions/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
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
      throw error; // No fallback - cloud storage is required
    }
  },

  async deleteTransaction(id: string) {
    try {
      console.log('🔍 TransactionService: Deleting transaction from cloud database...');
      
      const response = await authenticatedFetch(`${API_BASE_URL}/transactions/${id}`, {
        method: 'DELETE',
      });

      console.log('🔍 TransactionService: Delete transaction response status:', response.status);

      if (!response.ok) {
        console.error('🔍 TransactionService: HTTP error! status:', response.status);
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
      console.log('🔍 TransactionService: Successfully deleted transaction');
      
      if (result.success) {
        return { success: true };
      } else {
        console.error('🔍 TransactionService: API returned error:', result.message);
        throw new Error(result.message || 'Failed to delete transaction');
      }
    } catch (error) {
      console.error('🔍 TransactionService: Error deleting transaction:', error);
      throw error; // No fallback - cloud storage is required
    }
  },

  async saveTransaction(transaction: any) {
    return this.addTransaction(transaction);
  },

  async backfillAccountIds() {
    // This should be handled by the backend
    throw new Error('backfillAccountIds not implemented - use backend API');
  }
};

