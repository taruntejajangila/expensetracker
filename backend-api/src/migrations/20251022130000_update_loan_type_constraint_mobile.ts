import { PoolClient } from 'pg';

export const up = async (client: PoolClient): Promise<void> => {
  // Drop the existing constraint
  await client.query(`
    ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_loan_type_check;
  `);
  
  // Add the new constraint with mobile app values
  await client.query(`
    ALTER TABLE loans ADD CONSTRAINT loans_loan_type_check 
    CHECK (loan_type IN ('Personal Loan', 'Home Loan', 'Car Loan', 'Business Loan', 'Gold Loan', 'Education Loan', 'Private Money Lending', 'Other'));
  `);
  
  // Update the default value to match mobile app
  await client.query(`
    ALTER TABLE loans ALTER COLUMN loan_type SET DEFAULT 'Personal Loan';
  `);
};

export const down = async (client: PoolClient): Promise<void> => {
  // Revert to the old constraint
  await client.query(`
    ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_loan_type_check;
  `);
  
  await client.query(`
    ALTER TABLE loans ADD CONSTRAINT loans_loan_type_check 
    CHECK (loan_type IN ('personal', 'home', 'car', 'business', 'student', 'other'));
  `);
  
  await client.query(`
    ALTER TABLE loans ALTER COLUMN loan_type SET DEFAULT 'personal';
  `);
};
