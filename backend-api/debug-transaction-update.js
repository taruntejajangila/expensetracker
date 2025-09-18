require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'expense_tracker_db',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function debugTransactionUpdate() {
  const client = await pool.connect();

  try {
    console.log('🔍 Debugging Transaction Update Issue...');
    
    const userId = '060bb3ac-b695-4f46-a543-f728cb2ee733';
    console.log(`✅ Using user ID: ${userId}`);

    // Check the cash wallet account
    console.log('\n💰 Cash Wallet Account Details:');
    const walletResult = await client.query(
      'SELECT id, name, account_type, balance, is_active, bank_name FROM bank_accounts WHERE user_id = $1 AND account_type = $2',
      [userId, 'wallet']
    );

    if (walletResult.rows.length === 0) {
      console.log('   ❌ No cash wallet found');
      return;
    } else {
      const wallet = walletResult.rows[0];
      console.log(`   ✅ Cash wallet found: ${wallet.name}`);
      console.log(`      ID: ${wallet.id}`);
      console.log(`      Type: ${wallet.account_type}`);
      console.log(`      Current balance: ₹${wallet.balance}`);
      console.log(`      Active: ${wallet.is_active}`);
      console.log(`      Bank name: ${wallet.bank_name}`);
    }

    // Check the recent income transaction
    console.log('\n📊 Recent Income Transaction:');
    const transactionResult = await client.query(
      'SELECT id, type, amount, description, to_account, from_account, created_at FROM transactions WHERE user_id = $1 AND type = $2 ORDER BY created_at DESC LIMIT 1',
      [userId, 'income']
    );

    if (transactionResult.rows.length === 0) {
      console.log('   ❌ No income transactions found');
      return;
    } else {
      const transaction = transactionResult.rows[0];
      console.log(`   ✅ Income transaction found: ₹${transaction.amount}`);
      console.log(`      ID: ${transaction.id}`);
      console.log(`      Description: ${transaction.description}`);
      console.log(`      To Account: ${transaction.to_account}`);
      console.log(`      From Account: ${transaction.from_account}`);
      console.log(`      Created: ${transaction.created_at}`);
    }

    // Check if the transaction should have updated the wallet
    console.log('\n🔍 Transaction Analysis:');
    const transaction = transactionResult.rows[0];
    const wallet = walletResult.rows[0];
    
    if (transaction.to_account === 'cash-wallet') {
      console.log(`   ✅ Transaction is correctly pointing to 'cash-wallet'`);
      console.log(`   ✅ Cash wallet exists with ID: ${wallet.id}`);
      console.log(`   ⚠️  Expected balance: ₹${parseFloat(wallet.balance) + parseFloat(transaction.amount)}`);
      console.log(`   ❌ Current balance: ₹${wallet.balance}`);
      console.log(`   💡 The balance should have been updated by ₹${transaction.amount}`);
    } else {
      console.log(`   ❌ Transaction to_account (${transaction.to_account}) doesn't match expected 'cash-wallet'`);
    }

    // Check if there are any other transactions that might have affected the balance
    console.log('\n📊 All Recent Transactions:');
    const allTransactionsResult = await client.query(
      'SELECT id, type, amount, description, to_account, from_account, created_at FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [userId]
    );

    if (allTransactionsResult.rows.length === 0) {
      console.log('   • No transactions found');
    } else {
      allTransactionsResult.rows.forEach((txn, index) => {
        console.log(`   ${index + 1}. ${txn.type.toUpperCase()}: ₹${txn.amount}`);
        console.log(`      To: ${txn.to_account || 'N/A'}`);
        console.log(`      From: ${txn.from_account || 'N/A'}`);
        console.log(`      Date: ${txn.created_at}`);
        console.log('');
      });
    }

    // Check if there's a balance update issue in the backend
    console.log('\n🔧 Backend Transaction Processing Check:');
    console.log('   • The transaction was created successfully');
    console.log('   • The cash wallet account exists');
    console.log('   • But the balance was not updated');
    console.log('   • This suggests a bug in the backend transaction processing logic');
    console.log('   • Specifically in the account balance update after transaction creation');

  } catch (error) {
    console.error('❌ Error during debugging:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

debugTransactionUpdate().catch(console.error);
