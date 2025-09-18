require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'expense_tracker_db',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkDefaultAccounts() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking Default Accounts Setup...');
    
    const userId = '060bb3ac-b695-4f46-a543-f728cb2ee733';
    console.log(`✅ Using user ID: ${userId}`);

    // Check if there are any bank accounts at all for this user
    console.log('\n🏦 All Bank Accounts for User:');
    const allAccountsResult = await client.query(
      'SELECT id, name, account_type, balance, is_active, created_at FROM bank_accounts WHERE user_id = $1 ORDER BY created_at',
      [userId]
    );

    if (allAccountsResult.rows.length === 0) {
      console.log('   ❌ No bank accounts found at all');
    } else {
      allAccountsResult.rows.forEach((account, index) => {
        console.log(`   ${index + 1}. ${account.name} (${account.account_type})`);
        console.log(`      Balance: ₹${account.balance}`);
        console.log(`      Active: ${account.is_active}`);
        console.log(`      Created: ${account.created_at}`);
        console.log('');
      });
    }

    // Check if there are any accounts with 'wallet' type
    console.log('\n💰 Wallet Type Accounts:');
    const walletAccountsResult = await client.query(
      'SELECT id, name, account_type, balance, is_active FROM bank_accounts WHERE user_id = $1 AND account_type = $2',
      [userId, 'wallet']
    );

    if (walletAccountsResult.rows.length === 0) {
      console.log('   ❌ No wallet accounts found');
    } else {
      walletAccountsResult.rows.forEach((account, index) => {
        console.log(`   ${index + 1}. ${account.name} (${account.account_type})`);
        console.log(`      Balance: ₹${account.balance}`);
        console.log(`      Active: ${account.is_active}`);
      });
    }

    // Check if there are any accounts with 'cash' type
    console.log('\n💵 Cash Type Accounts:');
    const cashAccountsResult = await client.query(
      'SELECT id, name, account_type, balance, is_active FROM bank_accounts WHERE user_id = $1 AND account_type = $2',
      [userId, 'cash']
    );

    if (cashAccountsResult.rows.length === 0) {
      console.log('   ❌ No cash accounts found');
    } else {
      cashAccountsResult.rows.forEach((account, index) => {
        console.log(`   ${index + 1}. ${account.name} (${account.account_type})`);
        console.log(`      Balance: ₹${account.balance}`);
        console.log(`      Active: ${account.is_active}`);
      });
    }

    // Check what account types exist in the system
    console.log('\n📋 Available Account Types in System:');
    const accountTypesResult = await client.query(
      'SELECT DISTINCT account_type FROM bank_accounts ORDER BY account_type'
    );

    if (accountTypesResult.rows.length === 0) {
      console.log('   • No account types found in system');
    } else {
      accountTypesResult.rows.forEach((type, index) => {
        console.log(`   ${index + 1}. ${type.account_type}`);
      });
    }

    // Check if there's a default account creation mechanism
    console.log('\n🔧 Checking Default Account Creation Logic:');
    console.log('   • Looking for any default account setup...');
    
    // Check if there are any system-wide default accounts
    const systemDefaultsResult = await client.query(
      'SELECT COUNT(*) as count FROM bank_accounts WHERE user_id IS NULL'
    );
    console.log(`   • System default accounts: ${systemDefaultsResult.rows[0].count}`);

    // Check if there are any accounts for other users
    const otherUsersResult = await client.query(
      'SELECT user_id, COUNT(*) as count FROM bank_accounts GROUP BY user_id ORDER BY count DESC LIMIT 3'
    );
    console.log(`   • Accounts by user:`);
    otherUsersResult.rows.forEach((user, index) => {
      console.log(`     ${index + 1}. User ${user.user_id}: ${user.count} accounts`);
    });

  } catch (error) {
    console.error('❌ Error during check:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDefaultAccounts().catch(console.error);
