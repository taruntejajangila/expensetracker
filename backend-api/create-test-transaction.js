const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'expense_tracker',
  password: 'password',
  port: 5432,
});

async function createTestTransaction() {
  try {
    console.log('🔍 Creating test transaction...');

    // First, let's get a user ID (assuming user with ID 1 exists)
    const userQuery = 'SELECT id FROM users LIMIT 1';
    const userResult = await pool.query(userQuery);
    
    if (userResult.rows.length === 0) {
      console.error('❌ No users found in database. Please create a user first.');
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log('👤 Using user ID:', userId);

    // Get a category ID
    const categoryQuery = `
      SELECT id FROM categories 
      WHERE is_default = true 
      ORDER BY sort_order ASC 
      LIMIT 1
    `;
    const categoryResult = await pool.query(categoryQuery);
    
    if (categoryResult.rows.length === 0) {
      console.error('❌ No default categories found. Please create categories first.');
      return;
    }
    
    const categoryId = categoryResult.rows[0].id;
    console.log('📂 Using category ID:', categoryId);

    // Create test transaction
    const insertQuery = `
      INSERT INTO transactions (
        user_id, 
        amount, 
        type, 
        category_id, 
        description, 
        date, 
        tags, 
        created_at, 
        updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING id, amount, type, description, date, tags, created_at
    `;
    
    const transactionData = [
      userId,
      150.00, // amount
      'expense', // type
      categoryId, // category_id
      'Coffee Shop Purchase', // description (this will be the title in frontend)
      new Date(), // date
      ['Morning coffee and croissant', 'Business meeting'] // tags (these will be notes in frontend)
    ];

    const result = await pool.query(insertQuery, transactionData);
    const newTransaction = result.rows[0];

    console.log('✅ Transaction created successfully!');
    console.log('📋 Transaction Details:');
    console.log('   ID:', newTransaction.id);
    console.log('   Amount:', newTransaction.amount);
    console.log('   Type:', newTransaction.type);
    console.log('   Description (Title):', newTransaction.description);
    console.log('   Tags (Notes):', newTransaction.tags);
    console.log('   Date:', newTransaction.date);
    console.log('   Created:', newTransaction.created_at);

    // Also create an income transaction for testing
    const incomeTransactionData = [
      userId,
      2500.00, // amount
      'income', // type
      categoryId, // category_id
      'Freelance Project Payment', // description (this will be the title in frontend)
      new Date(), // date
      ['Website development', 'Client: ABC Corp', 'Invoice #12345'] // tags (these will be notes in frontend)
    ];

    const incomeResult = await pool.query(insertQuery, incomeTransactionData);
    const newIncomeTransaction = incomeResult.rows[0];

    console.log('✅ Income transaction created successfully!');
    console.log('📋 Income Transaction Details:');
    console.log('   ID:', newIncomeTransaction.id);
    console.log('   Amount:', newIncomeTransaction.amount);
    console.log('   Type:', newIncomeTransaction.type);
    console.log('   Description (Title):', newIncomeTransaction.description);
    console.log('   Tags (Notes):', newIncomeTransaction.tags);
    console.log('   Date:', newIncomeTransaction.date);
    console.log('   Created:', newIncomeTransaction.created_at);

    console.log('\n🎯 Now you can test in the frontend:');
    console.log('   1. Check if the transaction titles show correctly');
    console.log('   2. Check if the notes appear in the colored notes card');
    console.log('   3. Verify the transaction details screen displays both properly');

  } catch (error) {
    console.error('❌ Error creating transaction:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
createTestTransaction();
