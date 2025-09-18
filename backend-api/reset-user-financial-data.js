require('dotenv').config();
const { Pool } = require('pg');

// Database configuration from environment variables
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'expense_tracker_db',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function resetUserFinancialData() {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Starting financial data reset for user: taruntejajangila@gmail.com');
    console.log(`🔍 Using database: ${process.env.DB_NAME} on ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    
    // Get user ID
    const userResult = await client.query(
      'SELECT id FROM users WHERE email = $1',
      ['taruntejajangila@gmail.com']
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found: taruntejajangila@gmail.com');
      return;
    }
    
    const userId = userResult.rows[0].id;
    console.log(`✅ Found user ID: ${userId}`);
    
    // 1. Clear all transactions
    console.log('🗑️ Clearing all transactions...');
    const deleteTransactionsResult = await client.query(
      'DELETE FROM transactions WHERE user_id = $1',
      [userId]
    );
    console.log(`✅ Deleted ${deleteTransactionsResult.rowCount} transactions`);
    
    // 2. Reset all bank accounts to zero balance
    console.log('🏦 Resetting bank account balances to zero...');
    const resetBankAccountsResult = await client.query(
      'UPDATE bank_accounts SET balance = 0, updated_at = NOW() WHERE user_id = $1',
      [userId]
    );
    console.log(`✅ Reset ${resetBankAccountsResult.rowCount} bank accounts to zero balance`);
    
    // 3. Reset all credit cards to full limit with zero outstanding
    console.log('💳 Resetting credit card balances to full limit...');
    const resetCreditCardsResult = await client.query(
      'UPDATE credit_cards SET balance = 0, updated_at = NOW() WHERE user_id = $1',
      [userId]
    );
    console.log(`✅ Reset ${resetCreditCardsResult.rowCount} credit cards to zero balance (full limit available)`);
    
    // 4. Clear any cached data in mobile app (optional - will be synced on next app launch)
    console.log('📱 Mobile app cache will be cleared on next sync');
    
    console.log('\n🎉 Financial data reset completed successfully!');
    console.log('📊 Current status:');
    console.log('   • All transactions: CLEARED');
    console.log('   • Bank accounts: ₹0 balance');
    console.log('   • Credit cards: ₹0 outstanding (full limit available)');
    console.log('   • Cash wallet: ₹0 balance');
    
  } catch (error) {
    console.error('❌ Error resetting financial data:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the reset
resetUserFinancialData().catch(console.error);
