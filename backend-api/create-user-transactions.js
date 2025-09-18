const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function createUserTransactions() {
  const client = await pool.connect();

  try {
    console.log('🌱 Creating sample transactions for Tarun...\n');

    // Get Tarun's user ID
    const userResult = await client.query("SELECT id FROM users WHERE email = 'taruntejajangila@gmail.com'");
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }

    const userId = userResult.rows[0].id;
    console.log(`👤 Using user ID: ${userId}`);

    // Get some category IDs
    const categoriesResult = await client.query('SELECT id, name FROM categories WHERE type IN (\'expense\', \'income\') LIMIT 8');
    const categories = categoriesResult.rows;
    
    console.log(`📂 Found ${categories.length} categories`);

    // Sample transactions for Tarun
    const sampleTransactions = [
      {
        user_id: userId,
        category_id: categories.find(c => c.name === 'Groceries')?.id || categories[0].id,
        amount: 2500.00,
        type: 'expense',
        description: 'Monthly grocery shopping',
        date: '2025-01-20',
        tags: ['food', 'monthly']
      },
      {
        user_id: userId,
        category_id: categories.find(c => c.name === 'Transport')?.id || categories[2].id,
        amount: 800.00,
        type: 'expense',
        description: 'Fuel and parking for the week',
        date: '2025-01-19',
        tags: ['transport', 'weekly']
      },
      {
        user_id: userId,
        category_id: categories.find(c => c.name === 'Shopping')?.id || categories[3].id,
        amount: 3500.00,
        type: 'expense',
        description: 'New clothes and accessories',
        date: '2025-01-18',
        tags: ['shopping', 'clothes']
      },
      {
        user_id: userId,
        category_id: categories.find(c => c.name === 'Entertainment')?.id || categories[4].id,
        amount: 1200.00,
        type: 'expense',
        description: 'Movie night and dinner',
        date: '2025-01-17',
        tags: ['entertainment', 'dining']
      },
      {
        user_id: userId,
        category_id: categories.find(c => c.name === 'Salary')?.id || categories.find(c => c.type === 'income')?.id,
        amount: 75000.00,
        type: 'income',
        description: 'Monthly salary payment',
        date: '2025-01-15',
        tags: ['salary', 'income']
      },
      {
        user_id: userId,
        category_id: categories.find(c => c.name === 'Freelance')?.id || categories.find(c => c.type === 'income')?.id,
        amount: 15000.00,
        type: 'income',
        description: 'Freelance project payment',
        date: '2025-01-14',
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

      console.log(`✅ Created transaction: ${transaction.description} (₹${transaction.amount})`);
    }

    console.log('\n🎉 Sample transactions created successfully for Tarun!');
    console.log(`📊 Created ${sampleTransactions.length} sample transactions`);

  } catch (error) {
    console.error('❌ Error creating transactions:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createUserTransactions();
