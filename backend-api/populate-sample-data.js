const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function populateSampleData() {
  const client = await pool.connect();

  try {
    console.log('🌱 Populating database with sample data...');

    // First, get a user ID (assuming you have at least one user)
    const userResult = await client.query('SELECT id FROM users LIMIT 1');
    
    if (userResult.rows.length === 0) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }

    const userId = userResult.rows[0].id;
    console.log(`👤 Using user ID: ${userId}`);

    // Get category IDs
    const categoriesResult = await client.query('SELECT id, name FROM categories LIMIT 5');
    const categories = categoriesResult.rows;
    
    if (categories.length === 0) {
      console.log('❌ No categories found. Please create categories first.');
      return;
    }

    console.log(`📂 Found ${categories.length} categories`);

    // Sample transactions data
    const sampleTransactions = [
      {
        user_id: userId,
        category_id: categories[0].id,
        amount: 1500.00,
        type: 'expense',
        description: 'Grocery shopping for the week',
        date: '2025-01-20',
        tags: ['food', 'weekly']
      },
      {
        user_id: userId,
        category_id: categories[1].id,
        amount: 500.00,
        type: 'expense',
        description: 'Fuel for car',
        date: '2025-01-19',
        tags: ['transport', 'fuel']
      },
      {
        user_id: userId,
        category_id: categories[2].id,
        amount: 2000.00,
        type: 'expense',
        description: 'Shopping for clothes',
        date: '2025-01-18',
        tags: ['shopping', 'clothes']
      },
      {
        user_id: userId,
        category_id: categories[3].id,
        amount: 800.00,
        type: 'expense',
        description: 'Movie tickets and dinner',
        date: '2025-01-17',
        tags: ['entertainment', 'dining']
      },
      {
        user_id: userId,
        category_id: categories[4].id,
        amount: 5000.00,
        type: 'income',
        description: 'Freelance project payment',
        date: '2025-01-16',
        tags: ['freelance', 'income']
      }
    ];

    // Insert sample transactions
    for (const transaction of sampleTransactions) {
      const result = await client.query(`
        INSERT INTO transactions (user_id, category_id, amount, type, description, date, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [
        transaction.user_id,
        transaction.category_id,
        transaction.amount,
        transaction.type,
        transaction.description,
        transaction.date,
        transaction.tags
      ]);

      console.log(`✅ Created transaction: ${transaction.description} (${transaction.amount})`);
    }

    console.log('🎉 Sample data populated successfully!');
    console.log(`📊 Created ${sampleTransactions.length} sample transactions`);

  } catch (error) {
    console.error('❌ Error populating sample data:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

populateSampleData();
