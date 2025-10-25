import { Pool } from 'pg';

export async function up(pool: Pool): Promise<void> {
  console.log('🔧 Fixing interest rate precision...');
  
  // Update loans table interest_rate column
  await pool.query(`
    ALTER TABLE loans 
    ALTER COLUMN interest_rate TYPE DECIMAL(8,4)
  `);
  
  // Update loan_payments table interest_paid column for consistency
  await pool.query(`
    ALTER TABLE loan_payments 
    ALTER COLUMN interest_paid TYPE DECIMAL(12,2)
  `);
  
  console.log('✅ Interest rate precision fixed successfully');
}

export async function down(pool: Pool): Promise<void> {
  console.log('🔄 Reverting interest rate precision...');
  
  // Revert loans table interest_rate column
  await pool.query(`
    ALTER TABLE loans 
    ALTER COLUMN interest_rate TYPE DECIMAL(5,2)
  `);
  
  // Revert loan_payments table interest_paid column
  await pool.query(`
    ALTER TABLE loan_payments 
    ALTER COLUMN interest_paid TYPE DECIMAL(10,2)
  `);
  
  console.log('✅ Interest rate precision reverted');
}
