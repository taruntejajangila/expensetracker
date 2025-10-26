const { Pool } = require('pg');
require('dotenv').config();

async function fixTransactionDate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔄 Starting migration: Fix transaction_date column type...');
    
    // Change transaction_date from DATE to TIMESTAMP WITH TIME ZONE
    await pool.query(`
      ALTER TABLE transactions 
      ALTER COLUMN transaction_date 
      TYPE TIMESTAMP WITH TIME ZONE 
      USING transaction_date::timestamp with time zone
    `);
    
    console.log('✅ Successfully changed transaction_date from DATE to TIMESTAMP WITH TIME ZONE');
    console.log('✅ Migration complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

fixTransactionDate();

