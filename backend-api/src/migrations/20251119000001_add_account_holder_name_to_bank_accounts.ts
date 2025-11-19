import { PoolClient } from 'pg';

export const up = async (client: PoolClient): Promise<void> => {
  console.log('🔧 Adding account_holder_name column to bank_accounts table...');
  
  // Check if column already exists
  const columnCheck = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'bank_accounts' 
      AND column_name = 'account_holder_name'
    );
  `);
  
  if (!columnCheck.rows[0].exists) {
    // Add account_holder_name column
    await client.query(`
      ALTER TABLE bank_accounts 
      ADD COLUMN account_holder_name VARCHAR(255)
    `);
    console.log('✅ account_holder_name column added to bank_accounts table');
  } else {
    console.log('✅ account_holder_name column already exists');
  }
};

export const down = async (client: PoolClient): Promise<void> => {
  console.log('🔄 Removing account_holder_name column from bank_accounts table...');
  
  await client.query(`
    ALTER TABLE bank_accounts 
    DROP COLUMN IF EXISTS account_holder_name
  `);
  
  console.log('✅ account_holder_name column removed');
};

