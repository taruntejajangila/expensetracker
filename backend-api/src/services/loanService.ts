import { getPool } from '../config/database';
import { logger } from '../utils/logger';

export interface Loan {
  id: string;
  userId: string;
  name: string;
  loanType: 'personal' | 'home' | 'car' | 'business' | 'student' | 'other';
  amount: number;
  interestRate: number;
  termMonths: number;
  startDate: Date;
  endDate: Date;
  monthlyPayment: number;
  totalInterest: number;
  totalAmount: number;
  remainingBalance: number;
  status: 'active' | 'paid_off' | 'defaulted' | 'refinanced';
  lender?: string;
  accountNumber?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface LoanPayment {
  id: string;
  loanId: string;
  paymentNumber: number;
  paymentDate: Date;
  paymentAmount: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
  isPaid: boolean;
  actualPaymentDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLoanRequest {
  name: string;
  loanType: 'personal' | 'home' | 'car' | 'business' | 'student' | 'other';
  amount: number;
  interestRate: number;
  termMonths: number;
  startDate: Date;
  lender?: string;
  accountNumber?: string;
  notes?: string;
}

export interface UpdateLoanRequest {
  name?: string;
  loanType?: 'personal' | 'home' | 'car' | 'business' | 'student' | 'other';
  amount?: number;
  interestRate?: number;
  termMonths?: number;
  startDate?: Date;
  status?: 'active' | 'paid_off' | 'defaulted' | 'refinanced';
  lender?: string;
  accountNumber?: string;
  notes?: string;
}

export interface LoanAmortizationSchedule {
  paymentNumber: number;
  paymentDate: Date;
  paymentAmount: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
}

class LoanService {
  private static instance: LoanService;

  private readonly currencyFormatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  private formatCurrency(amount: number | null | undefined): string {
    if (amount === null || amount === undefined || Number.isNaN(amount)) {
      return '₹0';
    }
    return this.currencyFormatter.format(amount);
  }

  static getInstance(): LoanService {
    if (!LoanService.instance) {
      LoanService.instance = new LoanService();
    }
    return LoanService.instance;
  }

  // Calculate loan amortization
  private calculateAmortization(
    principal: number,
    annualRate: number,
    termMonths: number,
    loanType?: string
  ): {
    monthlyPayment: number;
    totalInterest: number;
    totalAmount: number;
    schedule: LoanAmortizationSchedule[];
  } {
    const monthlyRate = annualRate / 100 / 12; // Backend receives percentage (13.5), convert to decimal then divide by 12
    
    // Check if this is an interest-only loan (Gold Loan or Private Money Lending)
    // Note: loanType can be either display name ('Gold Loan', 'Private Money Lending') or mapped code ('other')
    const isInterestOnly = loanType === 'Gold Loan' || 
                          loanType === 'Private Money Lending' || 
                          loanType === 'other'; // 'other' is mapped from Gold/Private in frontend
    
    // Handle zero interest rate case
    let monthlyPayment: number;
    if (isInterestOnly) {
      // Interest-only loans: monthly payment is just the interest
      monthlyPayment = principal * monthlyRate;
    } else if (monthlyRate === 0) {
      monthlyPayment = principal / termMonths;
    } else {
      // Standard EMI calculation
      monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
    }
    
    let remainingBalance = principal;
    let totalInterest = 0;
    const schedule: LoanAmortizationSchedule[] = [];
    
    // For interest-only loans, principal doesn't reduce (isInterestOnly already declared above)
    
    for (let i = 1; i <= termMonths; i++) {
      const interestPaid = remainingBalance * monthlyRate;
      let principalPaid: number;
      
      if (isInterestOnly) {
        // Interest-only: no principal reduction
        principalPaid = 0;
        // remainingBalance stays the same
      } else {
        principalPaid = monthlyPayment - interestPaid;
      remainingBalance -= principalPaid;
      }
      
      totalInterest += interestPaid;
      
      schedule.push({
        paymentNumber: i,
        paymentDate: new Date(), // Will be calculated based on start date
        paymentAmount: monthlyPayment,
        principalPaid,
        interestPaid,
        remainingBalance: Math.max(0, remainingBalance)
      });
    }
    
    return {
      monthlyPayment,
      totalInterest,
      totalAmount: principal + totalInterest,
      schedule
    };
  }

  // Check for duplicate loans before creation or update
  private async checkForDuplicateLoan(userId: string, loanData: Partial<CreateLoanRequest>): Promise<{ isDuplicate: boolean; existingLoan?: Loan; reason?: string }> {
    try {
      const pool = getPool();
      
      // Build dynamic WHERE clause based on available data
      let whereConditions: string[] = ['user_id = $1', 'is_active = true'];
      let queryParams: any[] = [userId];
      let paramIndex = 2;
      
      // Only check fields that are provided
      if (loanData.name) {
        whereConditions.push(`LOWER(loan_name) = LOWER($${paramIndex++})`);
        queryParams.push(loanData.name);
      }
      
      if (loanData.amount !== undefined) {
        whereConditions.push(`principal_amount = $${paramIndex++}`);
        queryParams.push(loanData.amount);
      }
      
      if (loanData.interestRate !== undefined) {
        whereConditions.push(`interest_rate = $${paramIndex++}`);
        queryParams.push(loanData.interestRate);
      }
      
      if (loanData.termMonths !== undefined) {
        whereConditions.push(`loan_term_months = $${paramIndex++}`);
        queryParams.push(loanData.termMonths);
      }
      
      if (loanData.lender !== undefined) {
        whereConditions.push(`COALESCE(lender, '') = COALESCE($${paramIndex++}, '')`);
        queryParams.push(loanData.lender);
      }
      
      // If we don't have enough data to check, return no duplicate
      if (whereConditions.length < 3) { // Only user_id and status
        return { isDuplicate: false };
      }
      
      // Check for exact duplicates (all provided fields match)
      const exactDuplicateQuery = `
        SELECT * FROM loans 
        WHERE ${whereConditions.join(' AND ')}
      `;
      
      const exactResult = await pool.query(exactDuplicateQuery, queryParams);
      
      if (exactResult.rows.length > 0) {
        return {
          isDuplicate: true,
          existingLoan: this.mapDbRowToLoan(exactResult.rows[0]),
          reason: 'exact_duplicate'
        };
      }
      
      // Check for similar loans (same name, similar amount, same lender) - only if we have these fields
      if (loanData.name && loanData.amount !== undefined && loanData.lender !== undefined) {
        const similarQuery = `
          SELECT * FROM loans 
          WHERE user_id = $1 
          AND LOWER(loan_name) = LOWER($2)
          AND COALESCE(lender, '') = COALESCE($3, '')
          AND is_active = true
          AND ABS(principal_amount - $4) / $4 < 0.1  -- Within 10% of amount
        `;
        
        const similarResult = await pool.query(similarQuery, [
          userId, loanData.name, loanData.lender, loanData.amount
        ]);
        
        if (similarResult.rows.length > 0) {
          return {
            isDuplicate: true,
            existingLoan: this.mapDbRowToLoan(similarResult.rows[0]),
            reason: 'similar_loan'
          };
        }
      }
      
      // Check for loans with same name from same lender - only if we have these fields
      if (loanData.name && loanData.lender !== undefined) {
        const nameLenderQuery = `
          SELECT * FROM loans 
          WHERE user_id = $1 
          AND LOWER(loan_name) = LOWER($2)
          AND COALESCE(lender, '') = COALESCE($3, '')
          AND is_active = true
        `;
        
        const nameLenderResult = await pool.query(nameLenderQuery, [
          userId, loanData.name, loanData.lender
        ]);
        
        if (nameLenderResult.rows.length > 0) {
          return {
            isDuplicate: true,
            existingLoan: this.mapDbRowToLoan(nameLenderResult.rows[0]),
            reason: 'same_name_lender'
          };
        }
      }
      
      return { isDuplicate: false };
    } catch (error) {
      logger.error('Error checking for duplicate loans:', error);
      // If duplicate check fails, allow the loan creation to proceed
      return { isDuplicate: false };
    }
  }

  // Generate user-friendly duplicate error messages
  private getDuplicateErrorMessage(reason: string, existingLoan: Loan): string {
    switch (reason) {
      case 'exact_duplicate':
        return `A loan with identical details already exists: "${existingLoan.name}" (${this.formatCurrency(existingLoan.amount)}, ${existingLoan.interestRate * 100}%, ${existingLoan.termMonths} months, ${existingLoan.lender || 'No lender'})`;
      
      case 'similar_loan':
        return `A similar loan already exists: "${existingLoan.name}" from ${existingLoan.lender || 'the same lender'} with amount ${this.formatCurrency(existingLoan.amount)}. Please use a different name or lender.`;
      
      case 'same_name_lender':
        return `A loan named "${existingLoan.name}" already exists from ${existingLoan.lender || 'the same lender'}. Please use a different name or lender.`;
      
      default:
        return 'A similar loan already exists. Please check your existing loans.';
    }
  }

  // Create a new loan
  async createLoan(userId: string, loanData: CreateLoanRequest): Promise<Loan> {
    try {
      const pool = getPool();
      
      // Check for duplicates before creating
      const duplicateCheck = await this.checkForDuplicateLoan(userId, loanData);
      if (duplicateCheck.isDuplicate) {
        const errorMessage = this.getDuplicateErrorMessage(duplicateCheck.reason!, duplicateCheck.existingLoan!);
        throw new Error(errorMessage);
      }
      
      // Calculate loan details
      const amortization = this.calculateAmortization(
        loanData.amount,
        loanData.interestRate,
        loanData.termMonths,
        loanData.loanType
      );
      
      // Calculate end date
      const startDate = new Date(loanData.startDate);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + loanData.termMonths);
      
      const query = `
        INSERT INTO loans (
          user_id, loan_name, loan_type, principal_amount, interest_rate, 
          loan_term_months, start_date, end_date, monthly_payment, 
          outstanding_balance, lender, account_number
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      const result = await pool.query(query, [
        userId,
        loanData.name,
        loanData.loanType,
        loanData.amount,
        loanData.interestRate,
        loanData.termMonths,
        startDate,
        endDate,
        amortization.monthlyPayment,
        loanData.amount, // Initial outstanding balance equals principal
        loanData.lender || null,
        loanData.accountNumber || null
      ]);
      
      // Create payment schedule
      await this.createPaymentSchedule(result.rows[0].id, startDate, amortization.schedule);
      
      logger.info(`Loan created successfully for user: ${userId}`);
      return this.mapDbRowToLoan(result.rows[0]);
    } catch (error) {
      logger.error('Error creating loan:', error);
      throw error;
    }
  }

  // Get all loans for a user
  async getUserLoans(userId: string): Promise<Loan[]> {
    try {
      const pool = getPool();
      const query = 'SELECT * FROM loans WHERE user_id = $1 ORDER BY created_at DESC';
      const result = await pool.query(query, [userId]);
      
      return result.rows.map(row => this.mapDbRowToLoan(row));
    } catch (error) {
      logger.error('Error getting user loans:', error);
      throw error;
    }
  }

  // Get a specific loan by ID
  async getLoanById(loanId: string, userId: string): Promise<Loan | null> {
    try {
      const pool = getPool();
      const query = 'SELECT * FROM loans WHERE id = $1 AND user_id = $2';
      const result = await pool.query(query, [loanId, userId]);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      return this.mapDbRowToLoan(result.rows[0]);
    } catch (error) {
      logger.error('Error getting loan by ID:', error);
      throw error;
    }
  }

  // Update a loan
  async updateLoan(loanId: string, userId: string, updateData: UpdateLoanRequest): Promise<Loan | null> {
    try {
      const pool = getPool();
      
      // Get current loan data
      const currentLoan = await this.getLoanById(loanId, userId);
      if (!currentLoan) {
        return null;
      }
      
      // Check for duplicates if name, amount, rate, term, or lender is being updated
      if (updateData.name || updateData.amount || updateData.interestRate || updateData.termMonths || updateData.lender) {
        const checkData: Partial<CreateLoanRequest> = {};
        
        // Only include fields that are being updated
        if (updateData.name !== undefined) checkData.name = updateData.name;
        if (updateData.amount !== undefined) checkData.amount = updateData.amount;
        if (updateData.interestRate !== undefined) checkData.interestRate = updateData.interestRate;
        if (updateData.termMonths !== undefined) checkData.termMonths = updateData.termMonths;
        if (updateData.lender !== undefined) checkData.lender = updateData.lender;
        
        const duplicateCheck = await this.checkForDuplicateLoan(userId, checkData);
        if (duplicateCheck.isDuplicate && duplicateCheck.existingLoan?.id !== loanId) {
          const errorMessage = this.getDuplicateErrorMessage(duplicateCheck.reason!, duplicateCheck.existingLoan!);
          throw new Error(errorMessage);
        }
      }
      
      // If principal, rate, or term changed, recalculate everything
      let amortization: {
        monthlyPayment: number;
        totalInterest: number;
        totalAmount: number;
        schedule: LoanAmortizationSchedule[];
      } | null = null;
      let endDate = currentLoan.endDate;
      
      if (updateData.amount || updateData.interestRate || updateData.termMonths) {
        const principal = updateData.amount || currentLoan.amount;
        const rate = updateData.interestRate || currentLoan.interestRate;
        const term = updateData.termMonths || currentLoan.termMonths;
        const loanType = updateData.loanType || currentLoan.loanType;
        
        amortization = this.calculateAmortization(principal, rate, term, loanType);
        
        const startDate = updateData.startDate || currentLoan.startDate;
        endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + term);
      }
      
      // Build update query dynamically
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramCount = 1;
      
      if (updateData.name !== undefined) {
        updateFields.push(`loan_name = $${paramCount++}`);
        values.push(updateData.name);
      }
      if (updateData.loanType !== undefined) {
        updateFields.push(`loan_type = $${paramCount++}`);
        values.push(updateData.loanType);
      }
      if (updateData.amount !== undefined) {
        updateFields.push(`principal_amount = $${paramCount++}`);
        values.push(updateData.amount);
      }
      if (updateData.interestRate !== undefined) {
        updateFields.push(`interest_rate = $${paramCount++}`);
        values.push(updateData.interestRate);
      }
      if (updateData.termMonths !== undefined) {
        updateFields.push(`loan_term_months = $${paramCount++}`);
        values.push(updateData.termMonths);
      }
      if (updateData.startDate !== undefined) {
        updateFields.push(`start_date = $${paramCount++}`);
        values.push(updateData.startDate);
      }
      if (endDate !== currentLoan.endDate) {
        updateFields.push(`end_date = $${paramCount++}`);
        values.push(endDate);
      }
      if (amortization) {
        updateFields.push(`monthly_payment = $${paramCount++}`);
        values.push(amortization.monthlyPayment);
        updateFields.push(`outstanding_balance = $${paramCount++}`);
        values.push(updateData.amount || currentLoan.amount);
      }
      if (updateData.status !== undefined) {
        // Map status to is_active: 'paid_off' = false, others = true
        const isActive = updateData.status !== 'paid_off';
        updateFields.push(`is_active = $${paramCount++}`);
        values.push(isActive);
      }
      if (updateData.lender !== undefined) {
        updateFields.push(`lender = $${paramCount++}`);
        values.push(updateData.lender);
      }
      if (updateData.accountNumber !== undefined) {
        updateFields.push(`account_number = $${paramCount++}`);
        values.push(updateData.accountNumber);
      }
      if (updateData.notes !== undefined) {
        updateFields.push(`notes = $${paramCount++}`);
        values.push(updateData.notes);
      }
      
      if (updateFields.length === 0) {
        return currentLoan;
      }
      
      values.push(loanId, userId);
      const query = `
        UPDATE loans 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount++} AND user_id = $${paramCount++}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        return null;
      }
      
      // If amortization changed, update payment schedule
      if (amortization) {
        await this.updatePaymentSchedule(loanId, updateData.startDate || currentLoan.startDate, amortization.schedule);
      }
      
      logger.info(`Loan updated successfully: ${loanId}`);
      return this.mapDbRowToLoan(result.rows[0]);
    } catch (error) {
      logger.error('Error updating loan:', error);
      throw error;
    }
  }

  // Delete a loan
  async deleteLoan(loanId: string, userId: string): Promise<boolean> {
    try {
      const pool = getPool();
      const query = 'DELETE FROM loans WHERE id = $1 AND user_id = $2';
      const result = await pool.query(query, [loanId, userId]);
      
      const deleted = (result.rowCount || 0) > 0;
      if (deleted) {
        logger.info(`Loan deleted successfully: ${loanId}`);
      }
      
      return deleted;
    } catch (error) {
      logger.error('Error deleting loan:', error);
      throw error;
    }
  }

  // Get loan amortization schedule
  async getLoanAmortization(loanId: string, userId: string): Promise<LoanAmortizationSchedule[]> {
    try {
      const pool = getPool();
      const query = `
        SELECT payment_number, payment_date, payment_amount, principal_paid, 
               interest_paid, remaining_balance
        FROM loan_payments 
        WHERE loan_id = $1 
        ORDER BY payment_number ASC
      `;
      
      const result = await pool.query(query, [loanId]);
      
      return result.rows.map(row => ({
        paymentNumber: row.payment_number,
        paymentDate: row.payment_date,
        paymentAmount: parseFloat(row.payment_amount),
        principalPaid: parseFloat(row.principal_paid),
        interestPaid: parseFloat(row.interest_paid),
        remainingBalance: parseFloat(row.remaining_balance)
      }));
    } catch (error) {
      logger.error('Error getting loan amortization:', error);
      throw error;
    }
  }

  // Create payment schedule for a loan
  private async createPaymentSchedule(loanId: string, startDate: Date, schedule: LoanAmortizationSchedule[]): Promise<void> {
    try {
      const pool = getPool();
      
      for (const payment of schedule) {
        const paymentDate = new Date(startDate);
        paymentDate.setMonth(paymentDate.getMonth() + payment.paymentNumber - 1);
        
        const query = `
          INSERT INTO loan_payments (
            loan_id, payment_number, payment_date, payment_amount, 
            principal_paid, interest_paid, remaining_balance
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        `;
        
        await pool.query(query, [
          loanId,
          payment.paymentNumber,
          paymentDate,
          payment.paymentAmount,
          payment.principalPaid,
          payment.interestPaid,
          payment.remainingBalance
        ]);
      }
    } catch (error) {
      logger.error('Error creating payment schedule:', error);
      throw error;
    }
  }

  // Update payment schedule for a loan
  private async updatePaymentSchedule(loanId: string, startDate: Date, schedule: LoanAmortizationSchedule[]): Promise<void> {
    try {
      const pool = getPool();
      
      // Delete existing schedule
      await pool.query('DELETE FROM loan_payments WHERE loan_id = $1', [loanId]);
      
      // Create new schedule
      await this.createPaymentSchedule(loanId, startDate, schedule);
    } catch (error) {
      logger.error('Error updating payment schedule:', error);
      throw error;
    }
  }

  // Map database row to Loan interface
  private mapDbRowToLoan(row: any): Loan {
    return {
      id: row.id,
      userId: row.user_id,
      name: row.loan_name,
      loanType: row.loan_type,
      amount: parseFloat(row.principal_amount),
      interestRate: parseFloat(row.interest_rate),
      termMonths: parseInt(row.loan_term_months),
      startDate: row.start_date,
      endDate: row.end_date,
      monthlyPayment: parseFloat(row.monthly_payment || 0),
      totalInterest: 0, // Calculated field
      totalAmount: parseFloat(row.principal_amount), // Principal amount
      remainingBalance: parseFloat(row.outstanding_balance || row.principal_amount),
      status: row.is_active ? 'active' : 'paid_off',
      lender: row.lender,
      accountNumber: row.account_number,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

export default LoanService;
