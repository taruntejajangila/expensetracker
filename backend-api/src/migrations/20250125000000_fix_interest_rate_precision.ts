import { PoolClient } from 'pg';

export const up = async (client: PoolClient): Promise<void> => {
  console.log('🔧 Fixing interest rate precision...');
  
  // Check if loans table exists and has interest_rate column
  const loansTableCheck = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'loans' 
      AND column_name = 'interest_rate'
    );
  `);
  
  if (loansTableCheck.rows[0].exists) {
    // Update loans table interest_rate column
    await client.query(`
      ALTER TABLE loans 
      ALTER COLUMN interest_rate TYPE DECIMAL(8,4)
    `);
    console.log('✅ Updated loans.interest_rate column');
  } else {
    console.log('⚠️  loans.interest_rate column does not exist, skipping');
  }
  
  // Check if loan_payments table exists and has interest_paid column
  const loanPaymentsTableCheck = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'loan_payments' 
      AND column_name = 'interest_paid'
    );
  `);
  
  if (loanPaymentsTableCheck.rows[0].exists) {
    // Update loan_payments table interest_paid column for consistency
    await client.query(`
      ALTER TABLE loan_payments 
      ALTER COLUMN interest_paid TYPE DECIMAL(12,2)
    `);
    console.log('✅ Updated loan_payments.interest_paid column');
  } else {
    console.log('⚠️  loan_payments.interest_paid column does not exist, skipping');
  }
  
  console.log('✅ Interest rate precision fixed successfully');
};

export const down = async (client: PoolClient): Promise<void> => {
  console.log('🔄 Reverting interest rate precision...');
  
  // Check if loans table exists and has interest_rate column
  const loansTableCheck = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'loans' 
      AND column_name = 'interest_rate'
    );
  `);
  
  if (loansTableCheck.rows[0].exists) {
    // Revert loans table interest_rate column
    await client.query(`
      ALTER TABLE loans 
      ALTER COLUMN interest_rate TYPE DECIMAL(5,2)
    `);
    console.log('✅ Reverted loans.interest_rate column');
  }
  
  // Check if loan_payments table exists and has interest_paid column
  const loanPaymentsTableCheck = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'loan_payments' 
      AND column_name = 'interest_paid'
    );
  `);
  
  if (loanPaymentsTableCheck.rows[0].exists) {
    // Revert loan_payments table interest_paid column
    await client.query(`
      ALTER TABLE loan_payments 
      ALTER COLUMN interest_paid TYPE DECIMAL(10,2)
    `);
    console.log('✅ Reverted loan_payments.interest_paid column');
  }
  
  console.log('✅ Interest rate precision reverted');
};
