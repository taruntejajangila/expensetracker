require('dotenv').config();

const DATABASE_URL = process.env.DATABASE_URL || process.argv[2];

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL required');
  console.log('Usage: node fix-existing-dates.js <DATABASE_URL>');
  process.exit(1);
}

async function fixDates() {
  const { Pool } = require('pg');
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log('🔄 Step 1: Adding time to existing DATE values...');
    
    // Update existing transactions to have current time instead of midnight
    const updateQuery = `
      UPDATE transactions 
      SET transaction_date = transaction_date + INTERVAL '1 day' - INTERVAL '1 second'
      WHERE transaction_date::time = '00:00:00'::time
    `;
    
    const updateResult = await pool.query(updateQuery);
    console.log(`✅ Updated ${updateResult.rowCount} transactions`);
    
    console.log('🔄 Step 2: Changing column type...');
    
    // Now change the column type
    await pool.query(`
      ALTER TABLE transactions 
      ALTER COLUMN transaction_date 
      TYPE TIMESTAMP WITH TIME ZONE 
      USING transaction_date::timestamp with time zone
    `);
    
    console.log('✅ Successfully changed transaction_date to TIMESTAMP WITH TIME ZONE');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('💡 The column may already be TIMESTAMP WITH TIME ZONE');
    }
  } finally {
    await pool.end();
  }
}

fixDates();

