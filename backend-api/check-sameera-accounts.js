require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'expense_tracker_db',
  password: process.env.DB_PASSWORD || 'password',
  port: parseInt(process.env.DB_PORT || '5432'),
});

async function checkSameeraAccounts() {
  const client = await pool.connect();

  try {
    console.log('🔍 Checking Bank Accounts for sameeratesting@gmail.com...');
    
    // Get user ID for sameeratesting@gmail.com
    const userResult = await client.query(
      'SELECT id, email FROM users WHERE email = $1',
      ['sameeratesting@gmail.com']
    );

    if (userResult.rows.length === 0) {
      console.log('❌ User sameeratesting@gmail.com not found');
      return;
    }

    const userId = userResult.rows[0].id;
    const userEmail = userResult.rows[0].email;
    console.log(`✅ Found user: ${userEmail} (ID: ${userId})`);

    // Check bank accounts for this user
    console.log('\n🏦 Bank Accounts for sameeratesting@gmail.com:');
    const accountsResult = await client.query(
      'SELECT id, name, bank_name, account_number, account_holder_name, account_type, balance, created_at, updated_at FROM bank_accounts WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );

    if (accountsResult.rows.length === 0) {
      console.log('   📭 No bank accounts found for this user');
    } else {
      console.log(`   📊 Total accounts found: ${accountsResult.rows.length}\n`);
      accountsResult.rows.forEach((account, index) => {
        console.log(`📋 Account ${index + 1}:`);
        console.log(`   • ID: ${account.id}`);
        console.log(`   • Name: ${account.name}`);
        console.log(`   • Bank: ${account.bank_name}`);
        console.log(`   • Account Number: ${account.account_number || 'N/A'}`);
        console.log(`   • Account Holder: ${account.account_holder_name}`);
        console.log(`   • Type: ${account.account_type}`);
        console.log(`   • Balance: ₹${account.balance || 0}`);
        console.log(`   • Created: ${account.created_at}`);
        console.log(`   • Updated: ${account.updated_at || 'Never'}`);
        console.log('');
      });
    }

    // Check for potential duplicates
    console.log('🔍 Duplicate Detection Analysis:');
    if (accountsResult.rows.length > 1) {
      const duplicates = [];
      
      // Check for same account number + bank
      for (let i = 0; i < accountsResult.rows.length; i++) {
        for (let j = i + 1; j < accountsResult.rows.length; j++) {
          const acc1 = accountsResult.rows[i];
          const acc2 = accountsResult.rows[j];
          
          // Same account number + bank
          if (acc1.account_number && acc2.account_number && 
              acc1.account_number === acc2.account_number && 
              acc1.bank_name === acc2.bank_name) {
            duplicates.push({
              type: 'EXACT DUPLICATE',
              accounts: [acc1, acc2],
              reason: `Same account number (${acc1.account_number}) at same bank (${acc1.bank_name})`
            });
          }
          
          // Same bank + account holder
          if (acc1.bank_name === acc2.bank_name && 
              acc1.account_holder_name === acc2.account_holder_name) {
            duplicates.push({
              type: 'SIMILAR ACCOUNT',
              accounts: [acc1, acc2],
              reason: `Same account holder (${acc1.account_holder_name}) at same bank (${acc1.bank_name})`
            });
          }
          
          // Same nickname
          if (acc1.name === acc2.name) {
            duplicates.push({
              type: 'NICKNAME DUPLICATE',
              accounts: [acc1, acc2],
              reason: `Same nickname: "${acc1.name}"`
            });
          }
        }
      }
      
      if (duplicates.length > 0) {
        console.log(`   ⚠️  Found ${duplicates.length} potential duplicate(s):`);
        duplicates.forEach((dup, index) => {
          console.log(`\n   ${index + 1}. ${dup.type}:`);
          console.log(`      Reason: ${dup.reason}`);
          dup.accounts.forEach((acc, accIndex) => {
            console.log(`      Account ${accIndex + 1}: ${acc.name} (${acc.bank_name})`);
          });
        });
      } else {
        console.log('   ✅ No duplicates detected');
      }
    } else {
      console.log('   ℹ️  Only one account - no duplicates possible');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkSameeraAccounts();
