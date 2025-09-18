require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'expense_tracker_db',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkAllUserAccounts() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking All User Accounts in Database...');
    
    const userId = '060bb3ac-b695-4f46-a543-f728cb2ee733';
    console.log(`✅ Using user ID: ${userId}`);

    // Check ALL bank accounts for this user
    console.log('\n🏦 All Bank Accounts in Database:');
    const allAccountsResult = await client.query(
      'SELECT id, name, account_type, balance, is_active, bank_name, created_at FROM bank_accounts WHERE user_id = $1 ORDER BY created_at',
      [userId]
    );

    if (allAccountsResult.rows.length === 0) {
      console.log('   ❌ No bank accounts found in database');
    } else {
      allAccountsResult.rows.forEach((account, index) => {
        console.log(`   ${index + 1}. ${account.name} (${account.account_type})`);
        console.log(`      ID: ${account.id}`);
        console.log(`      Balance: ₹${account.balance}`);
        console.log(`      Active: ${account.is_active}`);
        console.log(`      Bank Name: ${account.bank_name}`);
        console.log(`      Created: ${account.created_at}`);
        console.log('');
      });
    }

    // Check if there are any accounts with different account_type values
    console.log('\n📋 All Account Types for This User:');
    const accountTypesResult = await client.query(
      'SELECT DISTINCT account_type FROM bank_accounts WHERE user_id = $1 ORDER BY account_type',
      [userId]
    );

    if (accountTypesResult.rows.length === 0) {
      console.log('   • No account types found');
    } else {
      accountTypesResult.rows.forEach((type, index) => {
        console.log(`   ${index + 1}. ${type.account_type}`);
      });
    }

    // Check if there are any accounts with 'cash' in the name
    console.log('\n💵 Accounts with "Cash" in Name:');
    const cashNameResult = await client.query(
      'SELECT id, name, account_type, balance, is_active FROM bank_accounts WHERE user_id = $1 AND name ILIKE $2',
      [userId, '%cash%']
    );

    if (cashNameResult.rows.length === 0) {
      console.log('   • No accounts with "cash" in name found');
    } else {
      cashNameResult.rows.forEach((account, index) => {
        console.log(`   ${index + 1}. ${account.name} (${account.account_type})`);
        console.log(`      Balance: ₹${account.balance}`);
        console.log(`      Active: ${account.is_active}`);
      });
    }

    // Check if there are any accounts with 'wallet' in the name
    console.log('\n👛 Accounts with "Wallet" in Name:');
    const walletNameResult = await client.query(
      'SELECT id, name, account_type, balance, is_active FROM bank_accounts WHERE user_id = $1 AND name ILIKE $2',
      [userId, '%wallet%']
    );

    if (walletNameResult.rows.length === 0) {
      console.log('   • No accounts with "wallet" in name found');
    } else {
      walletNameResult.rows.forEach((account, index) => {
        console.log(`   ${index + 1}. ${account.name} (${account.account_type})`);
        console.log(`      Balance: ₹${account.balance}`);
        console.log(`      Active: ${account.is_active}`);
      });
    }

    // Check if there's a mismatch between mobile app and database
    console.log('\n🔍 Analysis:');
    if (allAccountsResult.rows.length === 0) {
      console.log('   ❌ Database shows NO accounts for this user');
      console.log('   ⚠️  But mobile app shows accounts exist');
      console.log('   💡 This suggests a caching issue or the mobile app is showing fake/sample data');
    } else {
      console.log(`   ✅ Database shows ${allAccountsResult.rows.length} account(s) for this user`);
      console.log('   💡 The mobile app should be showing these accounts');
    }

  } catch (error) {
    console.error('❌ Error during check:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkAllUserAccounts().catch(console.error);
