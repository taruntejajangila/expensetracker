import AsyncStorage from '@react-native-async-storage/async-storage';
import { Reminder } from '../types/PaymentTypes';

// Transaction interface (assuming this exists in your app)
interface Transaction {
  id: string;
  amount: number;
  category: string;
  description: string;
  date: Date;
  type: 'expense' | 'income';
  paymentMethod?: string;
  tags?: string[];
}

// Recurring pattern detection
interface RecurringPattern {
  category: string;
  description: string;
  amount: number;
  frequency: 'monthly' | 'weekly' | 'daily';
  lastOccurrence: Date;
  occurrences: number;
  confidence: number; // 0-1, how confident we are this is recurring
}

class TransactionAnalysisService {
  private TRANSACTIONS_KEY = 'transactions';
  private SMART_REMINDERS_KEY = 'smart_reminders';

  private keyFor(baseKey: string, userId?: string) {
    return userId ? `${baseKey}:${userId}` : baseKey;
  }

  // Get all transactions from backend API
  async getTransactions(userId?: string): Promise<Transaction[]> {
    try {
      console.log('🔍 TransactionAnalysisService: Fetching transactions from backend API...');
      
      // Import the transaction service to get the auth token
      const { default: TransactionService } = await import('./transactionService');
      
      // Get all transactions from backend
      const backendTransactions = await TransactionService.getTransactions();
      
      // Convert backend format to our internal format
      const transactions: Transaction[] = backendTransactions.map((t: any) => ({
        id: t.id,
        amount: parseFloat(t.amount),
        category: t.category,
        description: t.description || '',
        date: new Date(t.date),
        type: t.type,
        paymentMethod: 'bank_transfer' // Default payment method
      }));
      
      console.log('🔍 TransactionAnalysisService: Fetched transactions from backend:', transactions.length);
      
      // Filter for Rent, Utilities, and Loan categories
      const filteredTransactions = transactions.filter(t => 
        t.type === 'expense' && ['Rent', 'Utilities', 'Loan/Debt Payments'].includes(t.category)
      );
      
      console.log('🔍 TransactionAnalysisService: Filtered for Rent/Utilities/Loans:', filteredTransactions.length);
      console.log('🔍 Available categories in backend data:', [...new Set(transactions.map(t => t.category))]);
      console.log('🔍 Available types in backend data:', [...new Set(transactions.map(t => t.type))]);
      
      // If no Rent/Utilities/Loan transactions found, return empty array (no test data)
      if (filteredTransactions.length === 0) {
        console.log(`🔍 No Rent/Utilities/Loan transactions found, returning empty array`);
        return [];
      }
      
      // Use real transactions even if we have just 1 (for Rent/Utilities/Loans)
      console.log(`🔍 Using ${filteredTransactions.length} Rent/Utilities/Loan transactions for pattern detection...`);
      
      return filteredTransactions;
    } catch (error) {
      console.error('Error loading transactions from backend:', error);
      
      // Fallback to empty array if backend fails
      console.log('🔍 Backend failed, returning empty array');
      return [];
    }
  }

  // Create test transactions for demonstration
  private createTestTransactions(): Transaction[] {
    const today = new Date();
    const lastMonth = new Date(today);
    lastMonth.setMonth(today.getMonth() - 1);
    const twoMonthsAgo = new Date(today);
    twoMonthsAgo.setMonth(today.getMonth() - 2);
    
    return [
      // Rent transactions - monthly pattern
      {
        id: 'test_rent_1',
        amount: 15000,
        category: 'Rent',
        description: 'Monthly rent payment',
        date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 15), // 15th of last month
        type: 'expense',
        paymentMethod: 'bank_transfer'
      },
      {
        id: 'test_rent_2',
        amount: 15000,
        category: 'Rent',
        description: 'Monthly rent payment',
        date: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 15), // 15th of two months ago
        type: 'expense',
        paymentMethod: 'bank_transfer'
      },
      {
        id: 'test_rent_3',
        amount: 15000,
        category: 'Rent',
        description: 'Monthly rent payment',
        date: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth() - 1, 15), // 15th of three months ago
        type: 'expense',
        paymentMethod: 'bank_transfer'
      },
      
      // Utilities transactions - monthly pattern
      {
        id: 'test_utilities_1',
        amount: 2500,
        category: 'Utilities',
        description: 'Electricity bill payment',
        date: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 5), // 5th of last month
        type: 'expense',
        paymentMethod: 'upi'
      },
      {
        id: 'test_utilities_2',
        amount: 2500,
        category: 'Utilities',
        description: 'Electricity bill payment',
        date: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth(), 5), // 5th of two months ago
        type: 'expense',
        paymentMethod: 'upi'
      },
      {
        id: 'test_utilities_3',
        amount: 2500,
        category: 'Utilities',
        description: 'Electricity bill payment',
        date: new Date(twoMonthsAgo.getFullYear(), twoMonthsAgo.getMonth() - 1, 5), // 5th of three months ago
        type: 'expense',
        paymentMethod: 'upi'
      }
    ];
  }

  // Analyze transactions for recurring patterns
  async analyzeRecurringPatterns(userId?: string): Promise<RecurringPattern[]> {
    const transactions = await this.getTransactions(userId);
    console.log('🔍 Analyzing', transactions.length, 'transactions for patterns');
    console.log('🔍 Transaction details:', transactions.map(t => ({
      category: t.category,
      amount: t.amount,
      date: t.date.toDateString(),
      description: t.description
    })));
    
    const patterns: RecurringPattern[] = [];
    
    // Group transactions by category and description
    const groupedTransactions = this.groupTransactions(transactions);
    console.log('📊 Grouped into', Object.keys(groupedTransactions).length, 'groups');
    
    for (const [key, group] of Object.entries(groupedTransactions)) {
      console.log('🔍 Analyzing group:', key, 'with', group.length, 'transactions');
      
      // Don't skip groups with empty descriptions - we have fallback logic in detectPattern
      const pattern = this.detectPattern(group);
      if (pattern && pattern.confidence > 0.5) { // Lower confidence threshold for demo
        console.log('✅ Pattern detected:', pattern.category, 'confidence:', pattern.confidence);
        patterns.push(pattern);
      } else {
        console.log('❌ No pattern detected for:', key, 'confidence:', pattern?.confidence || 0);
      }
    }
    
    console.log('🎯 Total patterns found:', patterns.length);
    return patterns;
  }

  // Group transactions by category and description
  private groupTransactions(transactions: Transaction[]): { [key: string]: Transaction[] } {
    const grouped: { [key: string]: Transaction[] } = {};
    
    // Only track Rent, Utilities, and Loan categories for reminders
    const allowedCategories = ['Rent', 'Utilities', 'Loan/Debt Payments'];
    
    transactions.forEach(transaction => {
      if (transaction.type === 'expense' && allowedCategories.includes(transaction.category)) {
        // Handle empty descriptions by using a default description
        const description = transaction.description && transaction.description.trim() !== '' 
          ? transaction.description 
          : `${transaction.category} payment`;
        
        const normalizedDesc = this.normalizeDescription(description);
        const key = `${transaction.category}_${normalizedDesc}`;
        console.log(`🔍 Grouping: "${transaction.description}" -> "${description}" -> "${normalizedDesc}" -> key: "${key}"`);
        
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(transaction);
      } else if (transaction.type === 'expense') {
        console.log(`🚫 Skipping category: ${transaction.category} (not in allowed list: ${allowedCategories.join(', ')})`);
      }
    });
    
    console.log('📊 Final groups:', Object.keys(grouped).map(k => `${k}: ${grouped[k].length} transactions`));
    console.log(`🎯 Only tracking categories: ${allowedCategories.join(', ')}`);
    return grouped;
  }

  // Normalize description for pattern matching
  private normalizeDescription(description: string): string {
    return description
      .toLowerCase()
      .replace(/\s+(august|july|june|september|october|november|december|january|february|march|april|may)\s*/g, '') // Remove month names
      .replace(/[0-9]/g, 'X') // Replace numbers with X
      .replace(/[^a-z\s]/g, '') // Remove special characters
      .trim();
  }

  // Detect recurring pattern in a group of transactions
  private detectPattern(transactions: Transaction[]): RecurringPattern | null {
    if (transactions.length < 1) {
      console.log('❌ No transactions found');
      return null;
    }
    
    // Sort by date
    const sorted = transactions.sort((a, b) => a.date.getTime() - b.date.getTime());
    console.log('📅 Sorted transactions:', sorted.map(t => ({ date: t.date.toDateString(), amount: t.amount, category: t.category })));
    
    // Calculate average amount
    const totalAmount = sorted.reduce((sum, t) => sum + t.amount, 0);
    const avgAmount = totalAmount / sorted.length;
    console.log('💰 Average amount:', avgAmount);
    
    // For Rent and Utilities, assume monthly pattern if we have at least 1 transaction
    if (sorted.length >= 1) {
      const lastTransaction = sorted[sorted.length - 1];
      
      // Find the most descriptive transaction (longest description that's not empty)
      const mostDescriptive = sorted.reduce((best, current) => {
        if (!best.description || best.description.trim() === '') return current;
        if (!current.description || current.description.trim() === '') return best;
        return current.description.length > best.description.length ? current : best;
      });
      
      // Use the most descriptive transaction's description, or create a meaningful title
      let description = mostDescriptive.description;
      if (!description || description.trim() === '') {
        // Create a meaningful title based on category and average amount
        description = `${lastTransaction.category} payment (₹${Math.round(avgAmount).toLocaleString()})`;
      } else {
        // If using an existing description, make sure it reflects the average amount if it contains an amount
        // Replace any amount in the description with the average amount
        description = description.replace(/₹[0-9,]+/g, `₹${Math.round(avgAmount).toLocaleString()}`);
      }
      
      const pattern = {
        category: lastTransaction.category,
        description: description,
        amount: Math.round(avgAmount),
        frequency: 'monthly' as const,
        lastOccurrence: lastTransaction.date,
        occurrences: sorted.length,
        confidence: 1.0 // High confidence for Rent/Utilities
      };
      console.log('✅ Monthly pattern assumed for Rent/Utilities:', pattern);
      console.log('📝 Using description from:', mostDescriptive.description, '(amount: ₹' + mostDescriptive.amount + ')');
      return pattern;
    }
    
    // Check for weekly pattern
    const weeklyPattern = this.checkWeeklyPattern(sorted);
    console.log('📅 Weekly pattern confidence:', weeklyPattern);
    
    if (weeklyPattern > 0.7) {
      const lastTransaction = sorted[sorted.length - 1];
      
      // Find the most descriptive transaction (longest description that's not empty)
      const mostDescriptive = sorted.reduce((best, current) => {
        if (!best.description || best.description.trim() === '') return current;
        if (!current.description || current.description.trim() === '') return best;
        return current.description.length > best.description.length ? current : best;
      });
      
      // Use the most descriptive transaction's description, or create a meaningful title
      let description = mostDescriptive.description;
      if (!description || description.trim() === '') {
        // Create a meaningful title based on category and average amount
        description = `${lastTransaction.category} payment (₹${Math.round(avgAmount).toLocaleString()})`;
      } else {
        // If using an existing description, make sure it reflects the average amount if it contains an amount
        // Replace any amount in the description with the average amount
        description = description.replace(/₹[0-9,]+/g, `₹${Math.round(avgAmount).toLocaleString()}`);
      }
      
      const pattern = {
        category: lastTransaction.category,
        description: description,
        amount: Math.round(avgAmount),
        frequency: 'weekly' as const,
        lastOccurrence: lastTransaction.date,
        occurrences: sorted.length,
        confidence: weeklyPattern
      };
      console.log('✅ Weekly pattern detected:', pattern);
      console.log('📝 Using description from:', mostDescriptive.description, '(amount: ₹' + mostDescriptive.amount + ')');
      return pattern;
    }
    
    console.log('❌ No pattern detected');
    return null;
  }

  // Check for monthly pattern
  private checkMonthlyPattern(transactions: Transaction[]): number {
    if (transactions.length < 3) return 0;
    
    const intervals: number[] = [];
    for (let i = 1; i < transactions.length; i++) {
      const diff = transactions[i].date.getTime() - transactions[i - 1].date.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      intervals.push(days);
    }
    
    console.log('📅 Monthly intervals:', intervals);
    
    // Check if intervals are around 30 days (20-40 days for more flexibility)
    const monthlyIntervals = intervals.filter(days => days >= 20 && days <= 40);
    const confidence = monthlyIntervals.length / intervals.length;
    console.log('📅 Monthly confidence:', confidence, 'intervals:', monthlyIntervals);
    return confidence;
  }

  // Check for weekly pattern
  private checkWeeklyPattern(transactions: Transaction[]): number {
    if (transactions.length < 3) return 0;
    
    const intervals: number[] = [];
    for (let i = 1; i < transactions.length; i++) {
      const diff = transactions[i].date.getTime() - transactions[i - 1].date.getTime();
      const days = diff / (1000 * 60 * 60 * 24);
      intervals.push(days);
    }
    
    // Check if intervals are around 7 days (5-9 days)
    const weeklyIntervals = intervals.filter(days => days >= 5 && days <= 9);
    return weeklyIntervals.length / intervals.length;
  }


  // Calculate due day from last occurrence
  private calculateDueDay(lastOccurrence: Date): number {
    return lastOccurrence.getDate();
  }

  // Generate reminders from active loans (public method for RemindersScreen)
  async generateLoanEMIReminders(userId?: string): Promise<Reminder[]> {
    try {
      console.log('🏦 Generating loan EMI reminders...');
      
      // Import LoanService dynamically to avoid circular dependencies
      const { LoanService } = await import('./LoanService');
      
      // Get all active loans
      const loans = await LoanService.getLoans();
      console.log('🏦 Found loans:', loans.length);
      
      const reminders: Reminder[] = [];
      const today = new Date();
      
      for (const loan of loans) {
        // Only process active loans
        if (loan.status !== 'active') {
          console.log(`🏦 Skipping inactive loan: ${loan.name} (status: ${loan.status})`);
          continue;
        }
        
        // Calculate next EMI date
        const emiStartDate = new Date(loan.emiStartDate);
        const monthsSinceStart = Math.floor((today.getTime() - emiStartDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
        const nextEMIMonth = emiStartDate.getMonth() + monthsSinceStart + 1;
        const nextEMIDate = new Date(emiStartDate.getFullYear(), nextEMIMonth, emiStartDate.getDate());
        
        // If next EMI date is in the past, find the next one
        while (nextEMIDate <= today) {
          nextEMIDate.setMonth(nextEMIDate.getMonth() + 1);
        }
        
        // Check if we're within the 8-day reminder window
        const daysUntilEMI = Math.ceil((nextEMIDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log(`🏦 ${loan.name}: Next EMI on ${nextEMIDate.toLocaleDateString()}, ${daysUntilEMI} days away`);
        
        if (daysUntilEMI <= 8 && daysUntilEMI >= 0) {
          // Create reminder 8 days before due date
          const reminderDate = new Date(nextEMIDate);
          reminderDate.setDate(reminderDate.getDate() - 8);
          
          // Adjust reminder date to today if it's in the past
          if (reminderDate < today) {
            reminderDate.setTime(today.getTime());
          }
          
          const reminder: Reminder = {
            id: `loan_${loan.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: `${loan.name} EMI`,
            description: `EMI payment of ₹${loan.monthlyPayment.toLocaleString()} is due on ${nextEMIDate.toLocaleDateString()}`,
            type: 'payment',
            date: reminderDate,
            time: '09:00',
            isEnabled: true,
            repeat: 'monthly',
            category: 'Loan/Debt Payments',
            amount: loan.monthlyPayment,
            isAutoGenerated: true,
            dueDate: nextEMIDate,
            reminderType: daysUntilEMI <= 1 ? 'due' : daysUntilEMI <= 3 ? 'upcoming' : 'upcoming',
            originalAmount: loan.monthlyPayment,
            createdAt: new Date(),
            updatedAt: new Date()
          };
          
          reminders.push(reminder);
          console.log(`✅ Created reminder for ${loan.name}: ${daysUntilEMI} days until due`);
        }
      }
      
      console.log(`🏦 Generated ${reminders.length} loan EMI reminders`);
      return reminders;
      
    } catch (error) {
      console.error('❌ Error generating loan EMI reminders:', error);
      return [];
    }
  }

  // Generate smart reminders from transaction patterns only (loan EMIs handled separately)
  async generateSmartReminders(userId?: string): Promise<Reminder[]> {
    console.log('🔍 Generating smart reminders from transaction patterns for user:', userId);
    
    // Clear existing smart reminders to prevent duplicates
    await AsyncStorage.removeItem(this.keyFor(this.SMART_REMINDERS_KEY, userId));
    
    const reminders: Reminder[] = [];
    
    // Generate from real transaction patterns
    const patterns = await this.analyzeRecurringPatterns(userId);
    console.log('📊 Transaction patterns detected:', patterns.length);
    
    if (patterns.length > 0) {
      // Generate reminders from real patterns
      for (const pattern of patterns) {
        if (pattern.frequency === 'monthly') {
          const nextDueDate = new Date(pattern.lastOccurrence);
          nextDueDate.setMonth(nextDueDate.getMonth() + 1);
          
          // Ensure due date is in the future
          const today = new Date();
          console.log(`📅 ${pattern.category} - Last occurrence: ${pattern.lastOccurrence.toDateString()}, Initial next due: ${nextDueDate.toDateString()}, Today: ${today.toDateString()}`);
          
          while (nextDueDate <= today) {
            nextDueDate.setMonth(nextDueDate.getMonth() + 1);
            console.log(`📅 ${pattern.category} - Adjusted next due: ${nextDueDate.toDateString()}`);
          }
          
          // Create only 1 reminder per payment (8 days before due date)
          const reminderDate = new Date(nextDueDate);
          reminderDate.setDate(reminderDate.getDate() - 8); // 8 days before due date
          
          // Create reminder if we're within the 8-day window (from 8 days before until due date)
          const currentDate = new Date();
          const daysUntilDue = Math.ceil((nextDueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilDue <= 8 && daysUntilDue >= 0) {
            const reminder: Reminder = {
              id: `smart_${pattern.category.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: pattern.description, // Use actual transaction description
              description: `Payment of ₹${pattern.amount.toLocaleString()} is due on ${nextDueDate.toLocaleDateString()}`,
              type: 'payment',
              date: reminderDate,
              time: '09:00',
              isEnabled: true,
              repeat: 'monthly',
              category: pattern.category,
              amount: pattern.amount,
              isAutoGenerated: true,
              dueDate: nextDueDate,
              reminderType: 'upcoming',
              originalAmount: pattern.amount,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            reminders.push(reminder);
          }
        } else if (pattern.frequency === 'weekly') {
          const nextDueDate = new Date(pattern.lastOccurrence);
          nextDueDate.setDate(nextDueDate.getDate() + 7);
          
          // Ensure due date is in the future
          const today = new Date();
          console.log(`📅 ${pattern.category} - Last occurrence: ${pattern.lastOccurrence.toDateString()}, Initial next due: ${nextDueDate.toDateString()}, Today: ${today.toDateString()}`);
          
          while (nextDueDate <= today) {
            nextDueDate.setDate(nextDueDate.getDate() + 7);
            console.log(`📅 ${pattern.category} - Adjusted next due: ${nextDueDate.toDateString()}`);
          }
          
          // Create only 1 reminder per payment (2 days before due date for weekly)
          const reminderDate = new Date(nextDueDate);
          reminderDate.setDate(reminderDate.getDate() - 2); // 2 days before due date
          
          // Create reminder if we're within the 2-day window (from 2 days before until due date)
          const currentDate = new Date();
          const daysUntilDue = Math.ceil((nextDueDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
          
          if (daysUntilDue <= 2 && daysUntilDue >= 0) {
            const reminder: Reminder = {
              id: `smart_${pattern.category.toLowerCase().replace(/\s+/g, '_')}_weekly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              title: pattern.description, // Use actual transaction description
              description: `Payment of ₹${pattern.amount.toLocaleString()} is due on ${nextDueDate.toLocaleDateString()}`,
              type: 'payment',
              date: reminderDate,
              time: '09:00',
              isEnabled: true,
              repeat: 'weekly',
              category: pattern.category,
              amount: pattern.amount,
              isAutoGenerated: true,
              dueDate: nextDueDate,
              reminderType: 'upcoming',
              originalAmount: pattern.amount,
              createdAt: new Date(),
              updatedAt: new Date()
            };
            
            reminders.push(reminder);
          }
        }
      }
      
      console.log('✅ Generated reminders from transaction patterns:', patterns.length);
    }
    
    
    console.log('✅ Total transaction pattern reminders generated:', reminders.length);
    
    // Save smart reminders
    await AsyncStorage.setItem(this.keyFor(this.SMART_REMINDERS_KEY, userId), JSON.stringify(reminders));
    
    return reminders;
  }

  // Get smart reminders
  async getSmartReminders(userId?: string): Promise<Reminder[]> {
    try {
      const remindersJson = await AsyncStorage.getItem(this.keyFor(this.SMART_REMINDERS_KEY, userId));
      if (remindersJson) {
        const reminders = JSON.parse(remindersJson);
        return reminders.map((r: any) => ({
          ...r,
          date: new Date(r.date),
          dueDate: new Date(r.dueDate),
          createdAt: new Date(r.createdAt),
          updatedAt: new Date(r.updatedAt)
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading smart reminders:', error);
      return [];
    }
  }

  // Clear cached data for user
  async clearUserData(userId?: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.keyFor(this.TRANSACTIONS_KEY, userId));
      await AsyncStorage.removeItem(this.keyFor(this.SMART_REMINDERS_KEY, userId));
    } catch (error) {
      console.error('Error clearing user data:', error);
    }
  }

}

export default new TransactionAnalysisService();
