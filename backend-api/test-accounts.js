const { Pool } = require('pg');

// Database configuration
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'expense_tracker_db',
  password: 'Tarun123@',
  port: 5432,
});

// Sample bank accounts data
const sampleAccounts = [
  {
    name: 'Chase Checking',
    bank_name: 'Chase Bank',
    account_type: 'current',
    balance: 2500.00,
    currency: 'USD',
    account_number: '1234',
    is_active: true,
    user_id: '060bb3ac-b695-4f46-a543-f728cb2ee733' // Use Tarun's user ID
  },
  {
    name: 'Wells Fargo Savings',
    bank_name: 'Wells Fargo',
    account_type: 'savings',
    balance: 15000.00,
    currency: 'USD',
    account_number: '5678',
    is_active: true,
    user_id: '060bb3ac-b695-4f46-a543-f728cb2ee733'
  },
  {
    name: 'Bank of America Credit',
    bank_name: 'Bank of America',
    account_type: 'credit',
    balance: -1250.00,
    currency: 'USD',
    account_number: '9012',
    is_active: true,
    user_id: '060bb3ac-b695-4f46-a543-f728cb2ee733'
  },
  {
    name: 'Cash Wallet',
    bank_name: 'Cash',
    account_type: 'wallet',
    balance: 500.00,
    currency: 'USD',
    account_number: '',
    is_active: true,
    user_id: '060bb3ac-b695-4f46-a543-f728cb2ee733'
  }
];

async function createTestAccounts() {
  try {
    console.log('🔍 Connecting to database...');
    
    // Test database connection
    const client = await pool.connect();
    console.log('✅ Database connected successfully');
    
    // Check if accounts table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'bank_accounts'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('❌ Bank accounts table does not exist. Please run the schema.sql first.');
      return;
    }
    
    console.log('✅ Bank accounts table found');
    
    // Check if user exists (we need a user to link accounts to)
    const userCheck = await client.query('SELECT id FROM users WHERE id = $1', ['060bb3ac-b695-4f46-a543-f728cb2ee733']);
    
    if (userCheck.rows.length === 0) {
      console.log('⚠️ User with ID 1 does not exist. Creating a test user...');
      
      // Create a test user
      const createUserQuery = `
        INSERT INTO users (id, name, email, password_hash, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `;
      
      const testUser = await client.query(createUserQuery, [
        '060bb3ac-b695-4f46-a543-f728cb2ee733',
        'Test User',
        'test@example.com',
        '$2b$12$test_hash_for_testing_purposes_only',
        new Date().toISOString(),
        new Date().toISOString()
      ]);
      
      console.log('✅ Test user created with ID:', testUser.rows[0].id);
    } else {
      console.log('✅ User with ID 1 exists');
    }
    
    // Clear existing test accounts for this user
    console.log('🧹 Clearing existing test accounts...');
    await client.query('DELETE FROM bank_accounts WHERE user_id = $1', ['060bb3ac-b695-4f46-a543-f728cb2ee733']);
    console.log('✅ Existing test accounts cleared');
    
    // Insert sample accounts
    console.log('📝 Inserting sample bank accounts...');
    
    for (const account of sampleAccounts) {
      const insertQuery = `
        INSERT INTO bank_accounts (
          user_id, name, bank_name, account_type, balance, currency,
          account_number, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name, balance
      `;
      
      const values = [
        account.user_id,
        account.name,
        account.bank_name,
        account.account_type,
        account.balance,
        account.currency,
        account.account_number,
        account.is_active
      ];
      
      const result = await client.query(insertQuery, values);
      console.log(`✅ Created account: ${result.rows[0].name} (ID: ${result.rows[0].id}) - Balance: $${result.rows[0].balance}`);
    }
    
    // Verify accounts were created
    console.log('\n🔍 Verifying created accounts...');
    const verifyQuery = await client.query(`
      SELECT id, name, bank_name, balance, currency, account_type, is_active
      FROM bank_accounts 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `, ['060bb3ac-b695-4f46-a543-f728cb2ee733']);
    
    console.log('\n📊 Created Accounts Summary:');
    verifyQuery.rows.forEach((row, index) => {
      const balanceStr = row.balance >= 0 ? `$${row.balance.toFixed(2)}` : `-$${Math.abs(row.balance).toFixed(2)}`;
      console.log(`${index + 1}. ${row.name} (${row.bank_name}) - ${balanceStr} ${row.currency} - Type: ${row.account_type}`);
    });
    
    console.log(`\n🎉 Successfully created ${verifyQuery.rows.length} test accounts!`);
    console.log('\n📱 Now test the mobile app:');
    console.log('1. Open the mobile app');
    console.log('2. Go to Accounts screen');
    console.log('3. Pull to refresh');
    console.log('4. You should see the test accounts from the database!');
    
    client.release();
    
  } catch (error) {
    console.error('❌ Error creating test accounts:', error);
  } finally {
    await pool.end();
  }
}

// Run the script
createTestAccounts();
