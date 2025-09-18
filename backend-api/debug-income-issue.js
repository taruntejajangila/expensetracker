require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'expense_tracker_db',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function debugIncomeIssue() {
  const client = await pool.connect();

  try {
    console.log('🔍 Debugging Income Transaction Issue...');
    
    // Use the exact user ID for taruntejajajangila@gmail.com
    const userId = '060bb3ac-b695-4f46-a543-f728cb2ee733';
    console.log(`✅ Using user ID: ${userId}`);

    // Check current transactions
    console.log('\n📊 Current Transactions:');
    const transactionsResult = await client.query(
      'SELECT id, type, amount, description, to_account, from_account, created_at FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [userId]
    );

    if (transactionsResult.rows.length === 0) {
      console.log('   • No transactions found');
    } else {
      transactionsResult.rows.forEach((txn, index) => {
        console.log(`   ${index + 1}. ${txn.type.toUpperCase()}: ₹${txn.amount} - ${txn.description}`);
        console.log(`      To Account: ${txn.to_account || 'N/A'}`);
        console.log(`      From Account: ${txn.from_account || 'N/A'}`);
        console.log(`      Date: ${txn.created_at}`);
        console.log('');
      });
    }

    // Check current bank accounts (including cash wallet)
    console.log('\n🏦 Current Bank Accounts:');
    const accountsResult = await client.query(
      'SELECT id, name, account_type, balance, is_active FROM bank_accounts WHERE user_id = $1 ORDER BY account_type, name',
      [userId]
    );

    if (accountsResult.rows.length === 0) {
      console.log('   • No bank accounts found');
    } else {
      accountsResult.rows.forEach((account, index) => {
        console.log(`   ${index + 1}. ${account.name} (${account.account_type})`);
        console.log(`      Balance: ₹${account.balance}`);
        console.log(`      Active: ${account.is_active}`);
        console.log('');
      });
    }

    // Check if there's a cash wallet
    console.log('\n💰 Cash Wallet Status:');
    const cashWalletResult = await client.query(
      'SELECT id, name, account_type, balance, is_active FROM bank_accounts WHERE user_id = $1 AND account_type = $2',
      [userId, 'wallet']
    );

    if (cashWalletResult.rows.length === 0) {
      console.log('   ❌ No cash wallet found! This is the issue.');
      console.log('   💡 You need to create a cash wallet first before adding income transactions.');
    } else {
      const wallet = cashWalletResult.rows[0];
      console.log(`   ✅ Cash wallet found: ${wallet.name}`);
      console.log(`      Current balance: ₹${wallet.balance}`);
      console.log(`      Active: ${wallet.is_active}`);
    }

    // Check recent transaction creation
    console.log('\n🔍 Recent Transaction Analysis:');
    const recentTxns = await client.query(
      'SELECT id, type, amount, description, to_account, from_account, created_at FROM transactions WHERE user_id = $1 AND created_at > NOW() - INTERVAL \'1 hour\' ORDER BY created_at DESC',
      [userId]
    );

    if (recentTxns.rows.length === 0) {
      console.log('   • No transactions in the last hour');
    } else {
      console.log(`   • Found ${recentTxns.rows.length} recent transaction(s):`);
      recentTxns.rows.forEach((txn, index) => {
        console.log(`     ${index + 1}. ${txn.type.toUpperCase()}: ₹${txn.amount} to ${txn.to_account || 'N/A'}`);
        if (txn.type === 'income' && txn.to_account === 'cash-wallet') {
          console.log(`        ⚠️  This income should have updated cash wallet balance`);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

debugIncomeIssue().catch(console.error);
