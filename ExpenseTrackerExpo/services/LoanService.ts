// LoanService connected to backend API
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.29.14:5001/api';

const getAuthToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    console.log('🔍 LoanService: Retrieved auth token:', token ? 'Token found' : 'No token');
    if (!token) {
      console.log('🔍 LoanService: No auth token found, using test token');
      return 'test-token';
    }
    return token;
  } catch (error) {
    console.log('🔍 LoanService: Error getting auth token:', error);
    return 'test-token';
  }
};

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
  type: 'personal' | 'mortgage' | 'auto' | 'student' | 'credit_card' | 'home' | 'car' | 'business';
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
      
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/loans`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 LoanService: Response status:', response.status);
      console.log('🔍 LoanService: Response ok:', response.ok);

      if (!response.ok) {
        console.error('🔍 LoanService: HTTP error! status:', response.status);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log('🔍 LoanService: Response data:', result);
      
      if (result.success) {
        console.log('🔍 LoanService: Successfully fetched loans:', result.data.length);
        
        // Map API response to expected format
        const mappedLoans = result.data.map((loan: any) => ({
          id: loan.id,
          name: loan.name,
          principal: parseFloat(loan.amount), // Changed from principalAmount to principal
          interestRate: parseFloat(loan.interestRate),
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
        }));
        
        console.log('🔍 LoanService: Mapped loans:', mappedLoans.length);
        return mappedLoans;
      } else {
        console.error('🔍 LoanService: API returned error:', result.message);
        throw new Error(result.message || 'Failed to fetch loans');
      }
    } catch (error) {
      console.error('🔍 LoanService: Error fetching loans:', error);
      
      // Fallback to mock data if backend is not available
      console.log('🔍 LoanService: Falling back to mock data');
      return [
        {
          id: '1',
          name: 'Car Loan',
          principal: 25000, // Changed from principalAmount to principal
          interestRate: 4.5,
          tenureMonths: 60, // Changed from termMonths to tenureMonths
          monthlyPayment: 465.25,
          remainingBalance: 18500,
          emiStartDate: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString(), // Changed from startDate to emiStartDate
          nextPaymentDate: new Date(Date.now() + 1 * 30 * 24 * 60 * 60 * 1000).toISOString(), // Added nextPaymentDate
          endDate: new Date(Date.now() + 54 * 30 * 24 * 60 * 60 * 1000).toISOString(),
          lender: 'Chase Bank',
          type: 'auto',
          status: 'active',
          color: '#007AFF',
          icon: 'car',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: '2',
          name: 'Student Loan',
          principal: 15000, // Changed from principalAmount to principal
          interestRate: 3.2,
          tenureMonths: 120, // Changed from termMonths to tenureMonths
          monthlyPayment: 145.50,
          remainingBalance: 12000,
          emiStartDate: new Date(Date.now() - 12 * 30 * 24 * 60 * 60 * 1000).toISOString(), // Changed from startDate to emiStartDate
          nextPaymentDate: new Date(Date.now() + 1 * 30 * 24 * 60 * 60 * 1000).toISOString(), // Added nextPaymentDate
          endDate: new Date(Date.now() + 108 * 30 * 24 * 60 * 60 * 1000).toISOString(),
          lender: 'Federal Student Aid',
          type: 'student',
          status: 'active',
          color: '#34C759',
          icon: 'school',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ];
    }
  },

  async addLoan(loan: Omit<StoredLoan, 'id' | 'createdAt' | 'updatedAt'>) {
    try {
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/loans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(loan),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
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
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/loans/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(loan),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
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
      const token = await getAuthToken();
      
      const response = await fetch(`${API_BASE_URL}/loans/${id}`, {
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
    // Mock implementation
    return 0;
  },

  async clearLocalLoans() {
    // Mock implementation
    console.log('Clearing local loans');
    return { success: true };
  }
};

