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

export default router;