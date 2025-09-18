const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function checkDatabase() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking database tables and data...\n');

    // Check categories table
    console.log('📂 Categories table:');
    const categoriesResult = await client.query('SELECT COUNT(*) as count FROM categories');
    console.log(`Total categories: ${categoriesResult.rows[0].count}`);
    
    const sampleCategories = await client.query('SELECT id, name, type FROM categories LIMIT 5');
    console.log('Sample categories:', sampleCategories.rows);
    console.log('');

    // Check transactions table
    console.log('💰 Transactions table:');
    const transactionsResult = await client.query('SELECT COUNT(*) as count FROM transactions');
    console.log(`Total transactions: ${transactionsResult.rows[0].count}`);
    
    const sampleTransactions = await client.query('SELECT id, amount, type, description, user_id FROM transactions LIMIT 5');
    console.log('Sample transactions:', sampleTransactions.rows);
    console.log('');

    // Check users table
    console.log('👤 Users table:');
    const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`Total users: ${usersResult.rows[0].count}`);
    
    const sampleUsers = await client.query('SELECT id, name, email FROM users LIMIT 3');
    console.log('Sample users:', sampleUsers.rows);
    console.log('');

    // Test the JOIN query that the API uses
    console.log('🔗 Testing JOIN query (transactions + categories):');
    try {
      const joinResult = await client.query(`
        SELECT 
          t.id,
          t.amount,
          t.type,
          t.description,
          t.date,
          t.created_at,
          c.name as category,
          c.icon as categoryIcon,
          c.color as categoryColor
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        LIMIT 3
      `);
      console.log('JOIN query result:', joinResult.rows);
    } catch (error) {
      console.error('❌ JOIN query failed:', error.message);
    }

  } catch (error) {
    console.error('❌ Error checking database:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDatabase();
