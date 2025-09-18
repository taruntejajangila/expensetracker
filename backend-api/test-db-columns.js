// Test script to check database columns
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'expense_tracker_db',
  password: 'Tarun@123',
  port: 5432,
});

async function testColumns() {
  try {
    console.log('🔍 Testing database columns...\n');
    
    // Check users table structure
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      AND column_name LIKE '%active%' OR column_name LIKE '%transaction%'
      ORDER BY column_name
    `);
    
    console.log('📊 Users table columns related to activity:');
    result.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type}`);
    });
    
    // Check actual user data
    const userResult = await pool.query(`
      SELECT id, name, last_active_at, last_transaction_at, created_at
      FROM users 
      WHERE role = 'user' 
      LIMIT 3
    `);
    
    console.log('\n👥 Sample user data:');
    userResult.rows.forEach(user => {
      console.log(`   ${user.name}:`);
      console.log(`     last_active_at: ${user.last_active_at}`);
      console.log(`     last_transaction_at: ${user.last_transaction_at}`);
      console.log(`     created_at: ${user.created_at}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

testColumns();
