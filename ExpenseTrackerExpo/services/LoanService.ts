// LoanService connected to backend API
import { API_BASE_URL } from '../config/api.config';
import { authenticatedFetch } from './authenticatedRequest';

export interface StoredLoan {
  id: string;
  name: string;
  principal: number; // Changed from principalAmount to principal
  interestRate: number;
  tenureMonths: number; // Changed from termMonths to tenureMonths
  monthlyPayment: number;
  remainingBalance: number;
  emiStartDate: string; // Changed from startDate to emiStartDate
  nextPaymentDate?: string; // Added nextPaymentDate
  endDate: string;
  lender: string;
  type: 'personal' | 'home' | 'car' | 'business' | 'student' | 'other';
  status: 'active' | 'paid_off' | 'defaulted';
  color: string;
  icon: string;
  createdAt: string;
  updatedAt: string;
}

export const LoanService = {
  async getLoans(): Promise<StoredLoan[]> {
    try {
      console.log('🔍 LoanService: Fetching loans from cloud database...');
      
      const response = await authenticatedFetch(`${API_BASE_URL}/loans`, {
        method: 'GET',
      });

      console.log('🔍 LoanService: Response status:', response.status);
      console.log('🔍 LoanService: Response ok:', response.ok);

      if (!response.ok) {
        console.error('🔍 LoanService: HTTP error! status:', response.status);
        // If still 401 after refresh, throw error to be caught by caller
        if (response.status === 401) {
          throw new Error('Authentication failed. Please login again.');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('🔍 LoanService: Successfully fetched loans:', result.data.length);
        
        // Map API response to expected format
        const mappedLoans = result.data.map((loan: any) => {
          const rawRate = parseFloat(loan.interestRate);
          
          // Backend now sends percentage rates (13.5 for 13.5%), so use directly
          const interestRate = rawRate;
          
          return {
            id: loan.id,
            name: loan.name,
            principal: parseFloat(loan.amount), // Changed from principalAmount to principal
            interestRate: interestRate, // Smart conversion: decimal (0.26) -> 26%, percentage (12.5) -> 12.5%
            tenureMonths: loan.termMonths, // Changed from termMonths to tenureMonths
            monthlyPayment: parseFloat(loan.monthlyPayment),
            remainingBalance: parseFloat(loan.remainingBalance),
            emiStartDate: loan.startDate, // Changed from startDate to emiStartDate
            nextPaymentDate: loan.nextPaymentDate || loan.startDate, // Added nextPaymentDate
            endDate: loan.endDate,
            lender: loan.lender,
            type: loan.loanType,
            status: loan.status,
            color: '#007AFF', // Default color, can be customized
            icon: 'document-text', // Default icon, can be customized
            createdAt: loan.createdAt,
            updatedAt: loan.updatedAt
          };
        });
        
        console.log('🔍 LoanService: Mapped loans:', mappedLoans.length);
        return mappedLoans;
      } else {
        console.error('🔍 LoanService: API returned error:', result.message);
        throw new Error(result.message || 'Failed to fetch loans');
      }
    } catch (error) {
      console.error('🔍 LoanService: Error fetching loans:', error);
      
      throw error; // No fallback - cloud storage is required
    }
  },

  async addLoan(loan: Omit<StoredLoan, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      // Map frontend fields to backend API expected format
      const backendLoanData = {
        name: loan.name,
        loanType: loan.type, // Type is already mapped in AddLoanScreen ('personal', 'home', 'car', etc.)
        amount: loan.principal, // Map 'principal' to 'amount'
        interestRate: loan.interestRate, // Keep as percentage number (e.g., 26 for 26% p.a.)
        termMonths: loan.tenureMonths, // Map 'tenureMonths' to 'termMonths'
        startDate: loan.emiStartDate, // Map 'emiStartDate' to 'startDate'
        lender: loan.lender,
        // Optional fields
        accountNumber: '',
        notes: ''
      };
      
      console.log('🔍 LoanService: Received loan.type:', loan.type);
      console.log('🔍 LoanService: Sending loan data to backend:', backendLoanData);
      
      const response = await authenticatedFetch(`${API_BASE_URL}/loans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendLoanData),
      });

      console.log('🔍 LoanService: Add loan response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 LoanService: Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 LoanService: Add loan response:', result);
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.message || 'Failed to add loan');
      }
    } catch (error) {
      console.error('Error adding loan:', error);
      return { success: false, message: error.message };
    }
  },

  async updateLoan(id: string, loan: Partial<StoredLoan>) {
    try {
      // Map frontend fields to backend API expected format
      const backendLoanData: any = {};
      
      if (loan.name !== undefined) backendLoanData.name = loan.name;
      if (loan.type !== undefined) {
        backendLoanData.loanType = loan.type; // Type is already mapped in AddLoanScreen/EditLoanScreen
      }
      if (loan.principal !== undefined) backendLoanData.amount = loan.principal;
      if (loan.interestRate !== undefined) backendLoanData.interestRate = loan.interestRate; // Send as percentage number (e.g., 26 for 26%)
      if (loan.tenureMonths !== undefined) backendLoanData.termMonths = loan.tenureMonths;
      if (loan.emiStartDate !== undefined) backendLoanData.startDate = loan.emiStartDate;
      if (loan.lender !== undefined) backendLoanData.lender = loan.lender;
      
      console.log('🔍 LoanService: Sending update loan data to backend:', backendLoanData);
      
      const response = await authenticatedFetch(`${API_BASE_URL}/loans/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(backendLoanData),
      });

      console.log('🔍 LoanService: Update loan response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 LoanService: Update loan error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 LoanService: Update loan response:', result);
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.message || 'Failed to update loan');
      }
    } catch (error) {
      console.error('Error updating loan:', error);
      return { success: false, message: error.message };
    }
  },

  async deleteLoan(id: string) {
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/loans/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        return result;
      } else {
        throw new Error(result.message || 'Failed to delete loan');
      }
    } catch (error) {
      console.error('Error deleting loan:', error);
      return { success: false, message: error.message };
    }
  },

  async calculateAmortization(principal: number, rate: number, termMonths: number) {
    const monthlyRate = rate / 100 / 12;
    const monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                          (Math.pow(1 + monthlyRate, termMonths) - 1);
    
    return {
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalInterest: Math.round((monthlyPayment * termMonths - principal) * 100) / 100,
      totalPayment: Math.round(monthlyPayment * termMonths * 100) / 100
    };
  },

  async getLocalLoanCount() {
    // This should be handled by the backend
    throw new Error('getLocalLoanCount not implemented - use backend API');
  },

  async clearLocalLoans() {
    // This should be handled by the backend
    throw new Error('clearLocalLoans not implemented - use backend API');
  }
};

