import { PoolClient } from 'pg';

/**
 * Migration: Fix loan_payments column names
 * 
 * The previous migration created columns with wrong names.
 * This migration renames them to match what the code expects.
 * 
 * Code expects: principal_paid, interest_paid, payment_amount
 * Table had: principal_amount, interest_amount, total_amount
 */

export const up = async (client: PoolClient): Promise<void> => {
  // Rename columns to match the code expectations
  await client.query(`
    ALTER TABLE loan_payments 
    RENAME COLUMN principal_amount TO principal_paid;
  `);
  
  await client.query(`
    ALTER TABLE loan_payments 
    RENAME COLUMN interest_amount TO interest_paid;
  `);
  
  await client.query(`
    ALTER TABLE loan_payments 
    RENAME COLUMN total_amount TO payment_amount;
  `);
};

export const down = async (client: PoolClient): Promise<void> => {
  // Revert the column names
  await client.query(`
    ALTER TABLE loan_payments 
    RENAME COLUMN principal_paid TO principal_amount;
  `);
  
  await client.query(`
    ALTER TABLE loan_payments 
    RENAME COLUMN interest_paid TO interest_amount;
  `);
  
  await client.query(`
    ALTER TABLE loan_payments 
    RENAME COLUMN payment_amount TO total_amount;
  `);
};

export const description = 'Fix loan_payments column names to match code expectations';

