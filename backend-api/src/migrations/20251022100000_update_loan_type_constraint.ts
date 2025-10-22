import { PoolClient } from 'pg';

/**
 * Migration: Update loan_type constraint
 * 
 * Adds support for 'home', 'car', and 'other' loan types
 * Previous constraint only allowed: 'personal', 'business', 'student'
 * New constraint allows: 'personal', 'home', 'car', 'business', 'student', 'other'
 */

export const up = async (client: PoolClient): Promise<void> => {
  // Drop the old constraint
  await client.query(`
    ALTER TABLE loans 
    DROP CONSTRAINT IF EXISTS loans_loan_type_check;
  `);
  
  // Add the new constraint with all loan types
  await client.query(`
    ALTER TABLE loans 
    ADD CONSTRAINT loans_loan_type_check 
    CHECK (loan_type IN ('personal', 'home', 'car', 'business', 'student', 'other'));
  `);
};

export const down = async (client: PoolClient): Promise<void> => {
  // Rollback: Restore the old constraint
  await client.query(`
    ALTER TABLE loans 
    DROP CONSTRAINT IF EXISTS loans_loan_type_check;
  `);
  
  await client.query(`
    ALTER TABLE loans 
    ADD CONSTRAINT loans_loan_type_check 
    CHECK (loan_type IN ('personal', 'business', 'student'));
  `);
};

export const description = 'Update loan_type constraint to include home, car, and other types';

