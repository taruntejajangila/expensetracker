// LoanService connected to backend API
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://192.168.1.4:5000/api';

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
      
      if (result.success) {
        console.log('🔍 LoanService: Successfully fetched loans:', result.data.length);
        
        // Map API response to expected format
        const mappedLoans = result.data.map((loan: any) => {
          const rawRate = parseFloat(loan.interestRate);
          
          // Smart detection: if rate > 1, it's already a percentage; if <= 1, it's a decimal
          const interestRate = rawRate > 1 ? rawRate : rawRate * 100;
          
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
      const token = await getAuthToken();
      
      // Map frontend fields to backend API expected format
      const backendLoanData = {
        name: loan.name,
        loanType: loan.type === 'personal' ? 'personal' : 
                 loan.type === 'mortgage' || loan.type === 'home' ? 'home' :
                 loan.type === 'auto' || loan.type === 'car' ? 'car' :
                 loan.type === 'business' ? 'business' :
                 loan.type === 'student' ? 'student' : 'other', // Map to valid backend types
        amount: loan.principal, // Map 'principal' to 'amount'
        interestRate: loan.interestRate > 1 ? loan.interestRate / 100 : loan.interestRate, // Convert percentage to decimal (e.g., 26% -> 0.26, but keep 0.26 as 0.26)
        termMonths: loan.tenureMonths, // Map 'tenureMonths' to 'termMonths'
        startDate: loan.emiStartDate, // Map 'emiStartDate' to 'startDate'
        lender: loan.lender,
        // Optional fields
        accountNumber: '',
        notes: ''
      };
      
      console.log('🔍 LoanService: Sending loan data to backend:', backendLoanData);
      
      const response = await fetch(`${API_BASE_URL}/loans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
      const token = await getAuthToken();
      
      // Map frontend fields to backend API expected format
      const backendLoanData: any = {};
      
      if (loan.name !== undefined) backendLoanData.name = loan.name;
      if (loan.type !== undefined) {
        backendLoanData.loanType = loan.type === 'personal' ? 'personal' : 
                                   loan.type === 'mortgage' || loan.type === 'home' ? 'home' :
                                   loan.type === 'auto' || loan.type === 'car' ? 'car' :
                                   loan.type === 'business' ? 'business' :
                                   loan.type === 'student' ? 'student' : 'other';
      }
      if (loan.principal !== undefined) backendLoanData.amount = loan.principal;
      if (loan.interestRate !== undefined) backendLoanData.interestRate = loan.interestRate > 1 ? loan.interestRate / 100 : loan.interestRate; // Smart conversion: percentage -> decimal, decimal stays decimal
      if (loan.tenureMonths !== undefined) backendLoanData.termMonths = loan.tenureMonths;
      if (loan.emiStartDate !== undefined) backendLoanData.startDate = loan.emiStartDate;
      if (loan.lender !== undefined) backendLoanData.lender = loan.lender;
      
      console.log('🔍 LoanService: Sending update loan data to backend:', backendLoanData);
      
      const response = await fetch(`${API_BASE_URL}/loans/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
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
    // This should be handled by the backend
    throw new Error('getLocalLoanCount not implemented - use backend API');
  },

  async clearLocalLoans() {
    // This should be handled by the backend
    throw new Error('clearLocalLoans not implemented - use backend API');
  }
};

