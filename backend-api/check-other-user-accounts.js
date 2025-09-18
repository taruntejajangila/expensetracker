require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'expense_tracker_db',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkOtherUserAccounts() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking Other User Accounts for Reference...');
    
    // Check the user who has 4 accounts
    const otherUserId = '7f8f6b4f-9a72-48e4-ad7a-c8c4aa3d9301';
    console.log(`✅ Checking user ID: ${otherUserId}`);

    // Get all accounts for this user
    const accountsResult = await client.query(
      'SELECT id, name, account_type, balance, is_active, created_at FROM bank_accounts WHERE user_id = $1 ORDER BY created_at',
      [otherUserId]
    );

    console.log('\n🏦 Accounts for Other User:');
    if (accountsResult.rows.length === 0) {
      console.log('   • No accounts found');
    } else {
      accountsResult.rows.forEach((account, index) => {
        console.log(`   ${index + 1}. ${account.name} (${account.account_type})`);
        console.log(`      Balance: ₹${account.balance}`);
        console.log(`      Active: ${account.is_active}`);
        console.log(`      Created: ${account.created_at}`);
        console.log('');
      });
    }

    // Check if this user has a cash wallet
    console.log('\n💰 Cash Wallet Check for Other User:');
    const walletResult = await client.query(
      'SELECT id, name, account_type, balance, is_active FROM bank_accounts WHERE user_id = $1 AND account_type = $2',
      [otherUserId, 'wallet']
    );

    if (walletResult.rows.length === 0) {
      console.log('   ❌ No cash wallet found for other user either');
    } else {
      const wallet = walletResult.rows[0];
      console.log(`   ✅ Cash wallet found: ${wallet.name}`);
      console.log(`      Balance: ₹${wallet.balance}`);
      console.log(`      Active: ${wallet.is_active}`);
    }

    // Check if there's a default account creation script or mechanism
    console.log('\n🔧 Checking for Default Account Creation:');
    console.log('   • Looking for any initialization scripts...');
    
    // Check if there are any default categories (which might indicate default setup)
    const categoriesResult = await client.query(
      'SELECT COUNT(*) as count FROM categories WHERE is_default = true'
    );
    console.log(`   • Default categories: ${categoriesResult.rows[0].count}`);

    // Check if there's a user registration trigger or default account creation
    console.log('   • Checking if there are any database triggers...');
    const triggersResult = await client.query(`
      SELECT trigger_name, event_manipulation, event_object_table 
      FROM information_schema.triggers 
      WHERE event_object_table = 'users' OR event_object_table = 'bank_accounts'
    `);
    
    if (triggersResult.rows.length === 0) {
      console.log('     • No relevant triggers found');
    } else {
      triggersResult.rows.forEach((trigger, index) => {
        console.log(`     ${index + 1}. ${trigger.trigger_name} on ${trigger.event_object_table}`);
      });
    }

  } catch (error) {
    console.error('❌ Error during check:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkOtherUserAccounts().catch(console.error);
