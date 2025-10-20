import express from 'express';
import pool from '../config/database';
import { logger } from '../utils/logger';

const router = express.Router();

// Emergency migration endpoint - should be removed after use
router.post('/add-account-holder-name', async (req: express.Request, res: express.Response) => {
  try {
    logger.info('🔧 Running migration: add account_holder_name column');

    // Check if column exists
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bank_accounts' 
      AND column_name = 'account_holder_name';
    `;
    
    const checkResult = await pool.query(checkQuery);
    
    if (checkResult.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Column account_holder_name already exists',
        alreadyExists: true
      });
    }

    // Add column
    await pool.query(`
      ALTER TABLE bank_accounts 
      ADD COLUMN account_holder_name VARCHAR(100);
    `);
    
    logger.info('✅ Column added successfully');

    // Update existing records
    const updateResult = await pool.query(`
      UPDATE bank_accounts 
      SET account_holder_name = account_name 
      WHERE account_holder_name IS NULL;
    `);
    
    logger.info(`✅ Updated ${updateResult.rowCount} existing records`);

    return res.json({
      success: true,
      message: 'Migration completed successfully',
      rowsUpdated: updateResult.rowCount
    });

  } catch (error: any) {
    logger.error('❌ Migration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Migration failed',
      error: error.message
    });
  }
});

// Fix account type constraint to allow 'salary'
router.post('/fix-account-type-constraint', async (req: express.Request, res: express.Response) => {
  try {
    logger.info('🔧 Running migration: fix account_type constraint');

    // Drop the existing constraint
    await pool.query(`
      ALTER TABLE bank_accounts 
      DROP CONSTRAINT IF EXISTS bank_accounts_account_type_check;
    `);
    
    logger.info('✅ Dropped old constraint');

    // Add new constraint that allows salary
    await pool.query(`
      ALTER TABLE bank_accounts 
      ADD CONSTRAINT bank_accounts_account_type_check 
      CHECK (account_type IN ('checking', 'savings', 'investment', 'salary'));
    `);
    
    logger.info('✅ Added new constraint with salary support');

    return res.json({
      success: true,
      message: 'Account type constraint updated successfully - now supports salary'
    });

  } catch (error: any) {
    logger.error('❌ Constraint fix error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fix constraint',
      error: error.message
    });
  }
});

// Debug endpoint to check account_holder_name column
router.post('/check-account-holder-name-column', async (req: express.Request, res: express.Response) => {
  try {
    logger.info('🔍 Checking account_holder_name column');

    // Check if column exists
    const checkQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'bank_accounts' 
      AND column_name = 'account_holder_name';
    `;
    
    const checkResult = await pool.query(checkQuery);
    
    if (checkResult.rows.length === 0) {
      return res.json({
        success: false,
        message: 'Column account_holder_name does not exist'
      });
    }

    // Check sample data
    const sampleQuery = `
      SELECT id, account_name, account_holder_name, bank_name
      FROM bank_accounts 
      ORDER BY created_at DESC 
      LIMIT 5;
    `;
    
    const sampleResult = await pool.query(sampleQuery);

    return res.json({
      success: true,
      message: 'Column exists',
      columnInfo: checkResult.rows[0],
      sampleData: sampleResult.rows
    });

  } catch (error: any) {
    logger.error('❌ Debug error:', error);
    return res.status(500).json({
      success: false,
      message: 'Debug failed',
      error: error.message
    });
  }
});

// Debug endpoint to check raw account data
router.post('/check-raw-account-data', async (req: express.Request, res: express.Response) => {
  try {
    const { accountId } = req.body;
    
    if (!accountId) {
      return res.status(400).json({
        success: false,
        message: 'Account ID required'
      });
    }

    const query = `
      SELECT id, account_name, account_holder_name, bank_name, account_type, balance
      FROM bank_accounts 
      WHERE id = $1;
    `;
    
    const result = await pool.query(query, [accountId]);
    
    if (result.rows.length === 0) {
      return res.json({
        success: false,
        message: 'Account not found'
      });
    }

    return res.json({
      success: true,
      message: 'Raw data retrieved',
      data: result.rows[0]
    });

  } catch (error: any) {
    logger.error('❌ Raw data debug error:', error);
    return res.status(500).json({
      success: false,
      message: 'Raw data debug failed',
      error: error.message
    });
  }
});

// Fix goals constraint to allow 'emergency' goal type
router.post('/fix-goals-constraint', async (req: express.Request, res: express.Response) => {
  try {
    logger.info('🔧 Running migration: fix goals goal_type constraint');

    // Drop the existing constraint
    await pool.query(`
      ALTER TABLE goals 
      DROP CONSTRAINT IF EXISTS goals_goal_type_check;
    `);
    
    logger.info('✅ Dropped old goals constraint');

    // Add new constraint that allows emergency
    await pool.query(`
      ALTER TABLE goals 
      ADD CONSTRAINT goals_goal_type_check 
      CHECK (goal_type IN ('vacation', 'car', 'house', 'education', 'retirement', 'emergency', 'other'));
    `);
    
    logger.info('✅ Added new goals constraint with emergency support');

    return res.json({
      success: true,
      message: 'Goals constraint updated successfully - now supports emergency goal type'
    });

  } catch (error: any) {
    logger.error('❌ Goals constraint fix error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fix goals constraint',
      error: error.message
    });
  }
});

export default router;