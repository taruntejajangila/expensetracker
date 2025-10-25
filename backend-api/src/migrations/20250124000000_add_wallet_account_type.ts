import { Pool } from 'pg';

export const up = async (client: Pool): Promise<void> => {
  try {
    console.log('🔄 Adding wallet account type to bank_accounts table...');
    
    // Drop the existing check constraint
    await client.query(`
      ALTER TABLE bank_accounts 
      DROP CONSTRAINT IF EXISTS bank_accounts_account_type_check
    `);
    
    // Add the new check constraint with wallet included
    await client.query(`
      ALTER TABLE bank_accounts 
      ADD CONSTRAINT bank_accounts_account_type_check 
      CHECK (account_type IN ('checking', 'savings', 'investment', 'wallet'))
    `);
    
    console.log('✅ Successfully added wallet account type to bank_accounts table');
  } catch (error) {
    console.error('❌ Error adding wallet account type:', error);
    throw error;
  }
};

export const down = async (client: Pool): Promise<void> => {
  try {
    console.log('🔄 Removing wallet account type from bank_accounts table...');
    
    // Drop the current check constraint
    await client.query(`
      ALTER TABLE bank_accounts 
      DROP CONSTRAINT IF EXISTS bank_accounts_account_type_check
    `);
    
    // Add back the original check constraint without wallet
    await client.query(`
      ALTER TABLE bank_accounts 
      ADD CONSTRAINT bank_accounts_account_type_check 
      CHECK (account_type IN ('checking', 'savings', 'investment'))
    `);
    
    console.log('✅ Successfully removed wallet account type from bank_accounts table');
  } catch (error) {
    console.error('❌ Error removing wallet account type:', error);
    throw error;
  }
};
