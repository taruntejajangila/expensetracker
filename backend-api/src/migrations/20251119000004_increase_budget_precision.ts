import { PoolClient } from 'pg';

export const up = async (client: PoolClient): Promise<void> => {
  console.log('🔧 Increasing budget amount precision to prevent overflow...');
  
  // Check if budgets table exists and has amount column
  const budgetsTableCheck = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'budgets' 
      AND column_name = 'amount'
    );
  `);
  
  if (budgetsTableCheck.rows[0].exists) {
    // Increase precision from DECIMAL(12,2) to DECIMAL(15,2) to support larger amounts
    await client.query(`
      ALTER TABLE budgets 
      ALTER COLUMN amount TYPE DECIMAL(15,2)
    `);
    console.log('✅ Updated budgets.amount column precision');
  } else {
    console.log('⚠️  budgets.amount column does not exist, skipping');
  }
  
  // Also update spent column
  const spentTableCheck = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'budgets' 
      AND column_name = 'spent'
    );
  `);
  
  if (spentTableCheck.rows[0].exists) {
    await client.query(`
      ALTER TABLE budgets 
      ALTER COLUMN spent TYPE DECIMAL(15,2)
    `);
    console.log('✅ Updated budgets.spent column precision');
  }
  
  console.log('✅ Budget precision increased successfully');
};

export const down = async (client: PoolClient): Promise<void> => {
  console.log('🔄 Reverting budget amount precision...');
  
  const budgetsTableCheck = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'budgets' 
      AND column_name = 'amount'
    );
  `);
  
  if (budgetsTableCheck.rows[0].exists) {
    await client.query(`
      ALTER TABLE budgets 
      ALTER COLUMN amount TYPE DECIMAL(12,2)
    `);
    console.log('✅ Reverted budgets.amount column precision');
  }
  
  const spentTableCheck = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'budgets' 
      AND column_name = 'spent'
    );
  `);
  
  if (spentTableCheck.rows[0].exists) {
    await client.query(`
      ALTER TABLE budgets 
      ALTER COLUMN spent TYPE DECIMAL(12,2)
    `);
    console.log('✅ Reverted budgets.spent column precision');
  }
  
  console.log('✅ Budget precision reverted');
};

