require('dotenv').config();

// Get DATABASE_URL from Railway environment or .env
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  console.log('Please set DATABASE_URL environment variable');
  process.exit(1);
}

// Connect to database and run ALTER TABLE
async function runMigration() {
  const { Pool } = require('pg');
  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔄 Starting migration: Change transaction_date from DATE to TIMESTAMP WITH TIME ZONE...');
    
    // First, let's check current column type
    const checkQuery = `
      SELECT data_type, column_name 
      FROM information_schema.columns 
      WHERE table_name = 'transactions' AND column_name = 'transaction_date'
    `;
    const result = await pool.query(checkQuery);
    console.log('📊 Current transaction_date column type:', result.rows[0]?.data_type);

    // Change transaction_date from DATE to TIMESTAMP WITH TIME ZONE
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
    if (error.code === '42804') {
      console.log('❌ Error: Cannot convert existing DATE values to TIMESTAMP');
      console.log('💡 Solution: First update all DATE values to have a time component');
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();

