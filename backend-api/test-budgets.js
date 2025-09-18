const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'expense_tracker_db',
  password: 'Tarun123@',
  port: 5432,
});

async function createTestBudgets() {
  try {
    console.log('🔍 Connecting to database...');
    
    // Test database connection
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Check if budgets table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'budgets'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Budgets table does not exist. Please run the schema.sql first.');
      return;
    }
    
    console.log('✅ Budgets table found');
    
    // Check if user exists
    const userCheck = await client.query('SELECT id FROM users WHERE id = $1', ['060bb3ac-b695-4f46-a543-f728cb2ee733']);
    
    if (userCheck.rows.length === 0) {
      console.log('❌ User does not exist. Please create the user first.');
      return;
    }
    
    console.log('✅ User found');
    
    // Get categories that the user actually has transactions in
    const userCategoriesQuery = `
      SELECT DISTINCT c.id, c.name, c.icon, c.color
      FROM categories c
      INNER JOIN transactions t ON c.id = t.category_id
      WHERE t.user_id = $1 AND c.type = 'expense'
      ORDER BY c.name
    `;
    
    const userCategoriesResult = await client.query(userCategoriesQuery, ['060bb3ac-b695-4f46-a543-f728cb2ee733']);
    
    if (userCategoriesResult.rows.length === 0) {
      console.log('❌ User has no expense transactions. Please create some transactions first.');
      return;
    }
    
    console.log('✅ Found categories user actually uses:', userCategoriesResult.rows.map(c => c.name).join(', '));
    
    // Create budget data for the user's actual categories
    const sampleBudgets = [
      {
        name: 'Dining Budget',
        amount: 3000,
        spent: 800,
        categoryId: userCategoriesResult.rows.find(c => c.name === 'Dining')?.id,
        period: 'monthly',
        startDate: '2025-08-01',
        endDate: '2025-08-31',
        status: 'under-budget',
        userId: '060bb3ac-b695-4f46-a543-f728cb2ee733'
      },
      {
        name: 'Entertainment Budget',
        amount: 2000,
        spent: 1000,
        categoryId: userCategoriesResult.rows.find(c => c.name === 'Entertainment')?.id,
        period: 'monthly',
        startDate: '2025-08-01',
        endDate: '2025-08-31',
        status: 'under-budget',
        userId: '060bb3ac-b695-4f46-a543-f728cb2ee733'
      },
      {
        name: 'Groceries Budget',
        amount: 5000,
        spent: 2500,
        categoryId: userCategoriesResult.rows.find(c => c.name === 'Groceries')?.id,
        period: 'monthly',
        startDate: '2025-08-01',
        endDate: '2025-08-31',
        status: 'under-budget',
        userId: '060bb3ac-b695-4f46-a543-f728cb2ee733'
      },
      {
        name: 'Shopping Budget',
        amount: 3000,
        spent: 2400,
        categoryId: userCategoriesResult.rows.find(c => c.name === 'Shopping')?.id,
        period: 'monthly',
        startDate: '2025-08-01',
        endDate: '2025-08-31',
        status: 'under-budget',
        userId: '060bb3ac-b695-4f46-a543-f728cb2ee733'
      },
      {
        name: 'Transport Budget',
        amount: 2500,
        spent: 1800,
        categoryId: userCategoriesResult.rows.find(c => c.name === 'Transport')?.id,
        period: 'monthly',
        startDate: '2025-08-01',
        endDate: '2025-08-31',
        status: 'under-budget',
        userId: '060bb3ac-b695-4f46-a543-f728cb2ee733'
      }
    ];
    
    // Clear existing test budgets for this user
    console.log('🧹 Clearing existing test budgets...');
    await client.query('DELETE FROM budgets WHERE user_id = $1', ['060bb3ac-b695-4f46-a543-f728cb2ee733']);
    console.log('✅ Existing test budgets cleared');
    
    // Insert sample budgets
    console.log('📝 Inserting sample budgets...');
    
    for (const budget of sampleBudgets) {
      if (!budget.categoryId) {
        console.log(`⚠️ Skipping ${budget.name} - category not found`);
        continue;
      }
      
      const insertQuery = `
        INSERT INTO budgets (
          user_id, name, amount, spent, category_id, period,
          start_date, end_date, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, name, amount, spent, status
      `;
      
      const values = [
        budget.userId,
        budget.name,
        budget.amount,
        budget.spent,
        budget.categoryId,
        budget.period,
        budget.startDate,
        budget.endDate,
        budget.status
      ];
      
      const result = await client.query(insertQuery, values);
      console.log(`✅ Created budget: ${result.rows[0].name} (ID: ${result.rows[0].id}) - Amount: $${result.rows[0].amount}, Spent: $${result.rows[0].spent}, Status: ${result.rows[0].status}`);
    }
    
    // Verify budgets were created
    console.log('\n🔍 Verifying created budgets...');
    const verifyQuery = await client.query(`
      SELECT b.id, b.name, b.amount, b.spent, b.status, b.period, c.name as category_name
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = $1 
      ORDER BY b.created_at DESC
    `, ['060bb3ac-b695-4f46-a543-f728cb2ee733']);
    
    console.log('\n📊 Created Budgets Summary:');
    verifyQuery.rows.forEach((row, index) => {
      const remaining = row.amount - row.spent;
      const remainingStr = remaining >= 0 ? `$${remaining.toFixed(2)}` : `-$${Math.abs(remaining).toFixed(2)}`;
      console.log(`${index + 1}. ${row.name} (${row.category_name || 'Unknown'}) - Budget: $${row.amount}, Spent: $${row.spent}, Remaining: ${remainingStr}, Status: ${row.status}`);
    });
    
    console.log(`\n🎉 Successfully created ${verifyQuery.rows.length} test budgets!`);
    console.log('\n📱 Now test the mobile app:');
    console.log('1. Open the mobile app');
    console.log('2. Go to Budget Planning screen');
    console.log('3. Pull to refresh');
    console.log('4. You should see the test budgets from the database!');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error creating test budgets:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
createTestBudgets();
