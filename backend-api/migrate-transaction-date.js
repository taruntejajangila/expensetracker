const { Pool } = require('pg');

// Connect to Railway PostgreSQL database
// Try external connection first, then internal
const connectionString = process.argv[2] || 'postgresql://postgres:BqCzhdXJgDLFWukqiqoHoGlIoMDouoey@postgres.railway.internal:5432/railway';

const pool = new Pool({
  connectionString,
  // Add connection timeout to avoid hanging
  connectionTimeoutMillis: 5000,
});

async function migrateTransactionDate() {
  try {
    console.log('🔄 Starting migration: Change transaction_date from DATE to TIMESTAMP WITH TIME ZONE...');
    
    // First, check current column type
    const checkQuery = `
      SELECT data_type, column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' AND column_name = 'transaction_date'
    `;
    const checkResult = await pool.query(checkQuery);
    console.log('📊 Current transaction_date column type:', checkResult.rows[0]?.data_type);
    
    if (checkResult.rows[0]?.data_type === 'timestamp with time zone') {
      console.log('✅ Column is already TIMESTAMP WITH TIME ZONE! No migration needed.');
      await pool.end();
      return;
    }
    
    // Change transaction_date from DATE to TIMESTAMP WITH TIME ZONE
    console.log('🔄 Running ALTER TABLE command...');
    await pool.query(`
      ALTER TABLE transactions 
      ALTER COLUMN transaction_date 
      TYPE TIMESTAMP WITH TIME ZONE 
      USING transaction_date::timestamp with time zone
    `);
    
    // Verify the change
    const verifyResult = await pool.query(checkQuery);
    console.log('✅ New transaction_date column type:', verifyResult.rows[0]?.data_type);
    console.log('✅ Migration complete!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('💡 The column may already be the correct type');
    }
  } finally {
    await pool.end();
  }
}

migrateTransactionDate();

