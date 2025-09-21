const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function createTestTransaction() {
  const client = await pool.connect();

  try {
    console.log('🔍 Creating test transaction for verification...\n');

    // Get first available user ID
    const userResult = await client.query("SELECT id FROM users LIMIT 1");
    
    if (userResult.rows.length === 0) {
      console.log('❌ No users found');
      return;
    }

    const userId = userResult.rows[0].id;
    console.log(`👤 Using user ID: ${userId}`);

    // Get a category ID
    const categoryResult = await client.query("SELECT id, name FROM categories WHERE type = 'expense' LIMIT 1");
    
    if (categoryResult.rows.length === 0) {
      console.log('❌ No expense categories found');
      return;
    }

    const categoryId = categoryResult.rows[0].id;
    const categoryName = categoryResult.rows[0].name;
    console.log(`📂 Using category: ${categoryName} (ID: ${categoryId})`);

    // Create test transactions with proper title and notes structure
    const testTransactions = [
      {
        user_id: userId,
        category_id: categoryId,
        amount: 150.00,
        type: 'expense',
        description: 'Coffee Shop Purchase - Morning Coffee', // This will be the TITLE in frontend
        date: new Date().toISOString(),
        tags: ['Business meeting', 'Client discussion', 'Important notes'] // These will be NOTES in frontend
      },
      {
        user_id: userId,
        category_id: categoryId,
        amount: 2500.00,
        type: 'income',
        description: 'Freelance Project Payment - Website Development', // This will be the TITLE in frontend
        date: new Date().toISOString(),
        tags: ['Client: ABC Corp', 'Invoice #12345', 'Payment received', 'Project completed'] // These will be NOTES in frontend
      }
    ];

    console.log('\n📝 Creating test transactions:');
    
    // Insert test transactions
    for (const transaction of testTransactions) {
      const result = await client.query(`
        INSERT INTO transactions (user_id, category_id, amount, type, description, date, tags)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, description, tags
      `, [
        transaction.user_id,
        transaction.category_id,
        transaction.amount,
        transaction.type,
        transaction.description,
        transaction.date,
        transaction.tags
      ]);

      const createdTransaction = result.rows[0];
      console.log(`\n✅ Created ${transaction.type} transaction:`);
      console.log(`   📋 ID: ${createdTransaction.id}`);
      console.log(`   💰 Amount: ₹${transaction.amount}`);
      console.log(`   📝 Title (description): "${createdTransaction.description}"`);
      console.log(`   🏷️  Notes (tags): [${createdTransaction.tags.map(tag => `"${tag}"`).join(', ')}]`);
    }

    console.log('\n🎯 Now you can verify in the frontend:');
    console.log('   1. Check TransactionDetailScreen shows the TITLE correctly');
    console.log('   2. Check the NOTES card shows the tags as notes');
    console.log('   3. Verify the #E8988A colored notes card displays properly');

  } catch (error) {
    console.error('❌ Error creating test transaction:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createTestTransaction();
