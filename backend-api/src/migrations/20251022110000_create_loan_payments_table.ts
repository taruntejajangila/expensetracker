import { PoolClient } from 'pg';

/**
 * Migration: Create loan_payments table
 * 
 * This table is needed to track EMI payments for loans.
 * It was added to database.ts schema but never created on Railway
 * because schema initialization only runs for new databases.
 */

export const up = async (client: PoolClient): Promise<void> => {
  await client.query(`
    CREATE TABLE IF NOT EXISTS loan_payments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
      payment_number INTEGER NOT NULL,
      payment_date DATE NOT NULL,
      principal_amount DECIMAL(12,2) NOT NULL,
      interest_amount DECIMAL(12,2) NOT NULL,
      total_amount DECIMAL(12,2) NOT NULL,
      remaining_balance DECIMAL(12,2) NOT NULL,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'partial')),
      actual_payment_date DATE,
      actual_amount_paid DECIMAL(12,2),
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(loan_id, payment_number)
    );
  `);
  
  // Create indexes for better performance
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_loan_payments_loan_id 
    ON loan_payments(loan_id);
  `);
  
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_loan_payments_payment_date 
    ON loan_payments(payment_date);
  `);
  
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_loan_payments_status 
    ON loan_payments(status);
  `);
};

export const down = async (client: PoolClient): Promise<void> => {
  // Drop indexes first
  await client.query(`DROP INDEX IF EXISTS idx_loan_payments_status;`);
  await client.query(`DROP INDEX IF EXISTS idx_loan_payments_payment_date;`);
  await client.query(`DROP INDEX IF EXISTS idx_loan_payments_loan_id;`);
  
  // Drop table
  await client.query(`DROP TABLE IF EXISTS loan_payments;`);
};

export const description = 'Create loan_payments table for tracking EMI payments';

