import { PoolClient } from 'pg';

/**
 * Migration: Remove old/deprecated columns from loan_payments table
 * 
 * This migration removes old columns that conflict with the new schema:
 * - 'amount' (replaced by 'payment_amount')
 * - 'total_amount' (replaced by 'payment_amount')
 * - 'principal_amount' (replaced by 'principal_paid')
 * - 'interest_amount' (replaced by 'interest_paid')
 */

export const up = async (client: PoolClient): Promise<void> => {
  console.log('🔧 Removing old/deprecated columns from loan_payments table...');
  
  // Check if loan_payments table exists
  const tableCheck = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'loan_payments'
    );
  `);
  
  if (!tableCheck.rows[0].exists) {
    console.log('⚠️  loan_payments table does not exist, skipping column cleanup');
    return;
  }
  
  // Get all existing columns
  const columnsCheck = await client.query(`
    SELECT column_name, is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'loan_payments' 
    AND table_schema = 'public';
  `);
  
  const existingColumns = new Map(
    columnsCheck.rows.map((row: any) => [row.column_name, row.is_nullable === 'YES'])
  );
  
  // Map of old columns to new columns
  const columnReplacements = [
    { old: 'amount', new: 'payment_amount' },
    { old: 'total_amount', new: 'payment_amount' },
    { old: 'principal_amount', new: 'principal_paid' },
    { old: 'interest_amount', new: 'interest_paid' }
  ];
  
  // Remove old columns if new ones exist
  for (const { old, new: newCol } of columnReplacements) {
    if (existingColumns.has(old) && existingColumns.has(newCol)) {
      console.log(`🗑️  Dropping deprecated column: ${old} (replaced by ${newCol})`);
      try {
        await client.query(`
          ALTER TABLE loan_payments 
          DROP COLUMN IF EXISTS ${old} CASCADE;
        `);
        console.log(`✅ Dropped column: ${old}`);
      } catch (error: any) {
        console.log(`⚠️  Could not drop ${old}: ${error.message}`);
        // If we can't drop it, try to make it nullable
        try {
          await client.query(`
            ALTER TABLE loan_payments 
            ALTER COLUMN ${old} DROP NOT NULL;
          `);
          console.log(`✅ Made ${old} nullable (could not drop)`);
        } catch (nullableError: any) {
          console.log(`⚠️  Could not make ${old} nullable: ${nullableError.message}`);
        }
      }
    } else if (existingColumns.has(old) && !existingColumns.has(newCol)) {
      console.log(`⚠️  Old column ${old} exists but new column ${newCol} does not - skipping`);
    }
  }
  
  console.log('✅ Old columns cleanup completed');
};

export const down = async (client: PoolClient): Promise<void> => {
  console.log('🔄 Reverting old columns cleanup...');
  // We don't want to restore old columns, so this is a no-op
  console.log('⚠️  Down migration skipped - old columns should not be restored');
};

export const description = 'Remove old/deprecated columns from loan_payments table';

