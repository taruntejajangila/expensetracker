import { PoolClient } from 'pg';

/**
 * Migration: Fix loan_payments table columns
 * 
 * This migration ensures the loan_payments table has all required columns
 * with correct names. It handles cases where the table exists but has
 * incorrect or missing columns.
 */

export const up = async (client: PoolClient): Promise<void> => {
  console.log('🔧 Fixing loan_payments table columns...');
  
  // Check if loan_payments table exists
  const tableCheck = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'loan_payments'
    );
  `);
  
  if (!tableCheck.rows[0].exists) {
    console.log('⚠️  loan_payments table does not exist, creating it...');
    // Create the table with correct schema
    await client.query(`
      CREATE TABLE loan_payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
        payment_number INTEGER NOT NULL,
        payment_date DATE NOT NULL,
        principal_paid DECIMAL(12,2) NOT NULL,
        interest_paid DECIMAL(12,2) NOT NULL,
        payment_amount DECIMAL(12,2) NOT NULL,
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
    
    // Create indexes
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
    
    console.log('✅ loan_payments table created successfully');
    return;
  }
  
  // Table exists, check and add missing columns
  const columnsCheck = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'loan_payments' 
    AND table_schema = 'public';
  `);
  
  const existingColumns = new Set(columnsCheck.rows.map((row: any) => row.column_name));
  const requiredColumns = [
    { name: 'payment_number', type: 'INTEGER NOT NULL' },
    { name: 'payment_date', type: 'DATE NOT NULL' },
    { name: 'principal_paid', type: 'DECIMAL(12,2) NOT NULL' },
    { name: 'interest_paid', type: 'DECIMAL(12,2) NOT NULL' },
    { name: 'payment_amount', type: 'DECIMAL(12,2) NOT NULL' },
    { name: 'remaining_balance', type: 'DECIMAL(12,2) NOT NULL' },
    { name: 'status', type: "VARCHAR(20) DEFAULT 'pending'" },
    { name: 'actual_payment_date', type: 'DATE' },
    { name: 'actual_amount_paid', type: 'DECIMAL(12,2)' },
    { name: 'notes', type: 'TEXT' }
  ];
  
  // Remove old/deprecated columns that conflict with new ones
  const deprecatedColumns = ['amount', 'total_amount', 'principal_amount', 'interest_amount'];
  for (const oldCol of deprecatedColumns) {
    if (existingColumns.has(oldCol)) {
      // Check if the new column exists
      const newColName = oldCol === 'amount' ? 'payment_amount' :
                        oldCol === 'total_amount' ? 'payment_amount' :
                        oldCol === 'principal_amount' ? 'principal_paid' :
                        oldCol === 'interest_amount' ? 'interest_paid' : null;
      
      if (newColName && existingColumns.has(newColName)) {
        console.log(`🗑️  Dropping deprecated column: ${oldCol} (replaced by ${newColName})`);
        try {
          await client.query(`
            ALTER TABLE loan_payments 
            DROP COLUMN IF EXISTS ${oldCol};
          `);
          console.log(`✅ Dropped column: ${oldCol}`);
        } catch (error: any) {
          console.log(`⚠️  Could not drop ${oldCol}: ${error.message}`);
          // If we can't drop it (maybe has data), make it nullable
          try {
            await client.query(`
              ALTER TABLE loan_payments 
              ALTER COLUMN ${oldCol} DROP NOT NULL;
            `);
            console.log(`✅ Made ${oldCol} nullable`);
          } catch (nullableError: any) {
            console.log(`⚠️  Could not make ${oldCol} nullable: ${nullableError.message}`);
          }
        }
      }
    }
  }
  
  // Add missing columns
  for (const column of requiredColumns) {
    if (!existingColumns.has(column.name)) {
      console.log(`➕ Adding missing column: ${column.name}`);
      await client.query(`
        ALTER TABLE loan_payments 
        ADD COLUMN ${column.name} ${column.type};
      `);
      console.log(`✅ Added column: ${column.name}`);
    }
  }
  
  // Ensure unique constraint exists
  const constraintCheck = await client.query(`
    SELECT constraint_name 
    FROM information_schema.table_constraints 
    WHERE table_name = 'loan_payments' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name LIKE '%loan_id%payment_number%';
  `);
  
  if (constraintCheck.rows.length === 0) {
    console.log('➕ Adding unique constraint on (loan_id, payment_number)');
    await client.query(`
      ALTER TABLE loan_payments 
      ADD CONSTRAINT loan_payments_loan_id_payment_number_unique 
      UNIQUE (loan_id, payment_number);
    `);
    console.log('✅ Unique constraint added');
  }
  
  // Ensure indexes exist
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
  
  console.log('✅ loan_payments table columns fixed successfully');
};

export const down = async (client: PoolClient): Promise<void> => {
  console.log('🔄 Reverting loan_payments table columns fix...');
  // This migration only adds columns, so down migration would remove them
  // But we'll keep it simple and not remove columns in case they have data
  console.log('⚠️  Down migration skipped - columns preserved');
};

export const description = 'Fix loan_payments table to ensure all required columns exist';

