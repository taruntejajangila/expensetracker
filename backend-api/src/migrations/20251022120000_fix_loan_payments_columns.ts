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
  console.log('🔧 Fixing loan_payments column names...');
  
  // Check if loan_payments table exists
  const tableCheck = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'loan_payments'
    );
  `);
  
  if (!tableCheck.rows[0].exists) {
    console.log('⚠️  loan_payments table does not exist, skipping column rename');
    return;
  }
  
  // Check which columns exist and rename only if needed
  const columnsCheck = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'loan_payments' 
    AND column_name IN ('principal_amount', 'principal_paid', 'interest_amount', 'interest_paid', 'total_amount', 'payment_amount');
  `);
  
  const existingColumns = new Set(columnsCheck.rows.map((row: any) => row.column_name));
  
  // Rename principal_amount to principal_paid (if old column exists and new doesn't)
  if (existingColumns.has('principal_amount') && !existingColumns.has('principal_paid')) {
    await client.query(`
      ALTER TABLE loan_payments 
      RENAME COLUMN principal_amount TO principal_paid;
    `);
    console.log('✅ Renamed principal_amount to principal_paid');
  } else if (existingColumns.has('principal_paid')) {
    console.log('✅ principal_paid column already exists with correct name');
  }
  
  // Rename interest_amount to interest_paid (if old column exists and new doesn't)
  if (existingColumns.has('interest_amount') && !existingColumns.has('interest_paid')) {
    await client.query(`
      ALTER TABLE loan_payments 
      RENAME COLUMN interest_amount TO interest_paid;
    `);
    console.log('✅ Renamed interest_amount to interest_paid');
  } else if (existingColumns.has('interest_paid')) {
    console.log('✅ interest_paid column already exists with correct name');
  }
  
  // Rename total_amount to payment_amount (if old column exists and new doesn't)
  if (existingColumns.has('total_amount') && !existingColumns.has('payment_amount')) {
    await client.query(`
      ALTER TABLE loan_payments 
      RENAME COLUMN total_amount TO payment_amount;
    `);
    console.log('✅ Renamed total_amount to payment_amount');
  } else if (existingColumns.has('payment_amount')) {
    console.log('✅ payment_amount column already exists with correct name');
  }
  
  console.log('✅ loan_payments column names fixed successfully');
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

