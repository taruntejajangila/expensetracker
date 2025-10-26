import { Request, Response } from 'express';
import { Pool } from 'pg';

// This endpoint can be called ONCE to fix the database schema
export async function fixTransactionDate(req: Request, res: Response) {
  const db = req.app.locals.db as Pool;
  
  try {
    console.log('🔄 Checking transaction_date column type...');
    
    // Check current column type
    const checkResult = await db.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' AND column_name = 'transaction_date'
    `);
    
    const currentType = checkResult.rows[0]?.data_type;
    console.log('📊 Current column type:', currentType);
    
    if (currentType === 'timestamp with time zone') {
      return res.json({ 
        success: true, 
        message: 'Column is already TIMESTAMP WITH TIME ZONE',
        currentType 
      });
    }
    
    if (currentType === 'date') {
      console.log('🔄 Changing column type from DATE to TIMESTAMP WITH TIME ZONE...');
      
      // Change the column type
      await db.query(`
        ALTER TABLE transactions 
        ALTER COLUMN transaction_date 
        TYPE TIMESTAMP WITH TIME ZONE 
        USING transaction_date::timestamp with time zone
      `);
      
      console.log('✅ Column type changed successfully');
      
      return res.json({ 
        success: true, 
        message: 'Migration completed successfully',
        previousType: currentType,
        newType: 'timestamp with time zone'
      });
    }
    
    return res.json({ 
      success: false, 
      message: 'Unknown column type',
      currentType 
    });
    
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}

