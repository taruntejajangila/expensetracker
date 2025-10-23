const axios = require('axios');

const API_BASE_URL = 'https://expensetracker-production-eb9c.up.railway.app/api';

async function deleteTarunTransactions() {
  try {
    console.log('🗑️  Starting to delete transactions for taruntejajangila@gmail.com...');
    
    // Login with the existing user
    console.log('🔐 Logging in as taruntejajangila@gmail.com...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: 'taruntejajangila@gmail.com',
      password: 'Tarun123@'
    });
    
    const authToken = loginResponse.data.data?.accessToken;
    if (!authToken) {
      throw new Error('Failed to get auth token');
    }
    console.log('✅ Login successful');
    
    // Set up auth headers
    const authHeaders = {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    };
    
    // Get all transactions
    console.log('📊 Fetching all transactions...');
    const response = await axios.get(`${API_BASE_URL}/transactions`, {
      headers: authHeaders
    });
    
    const transactions = response.data.data.transactions || [];
    console.log(`📊 Found ${transactions.length} transactions to delete`);
    
    if (transactions.length === 0) {
      console.log('✅ No transactions found. Database is already clean!');
      return;
    }
    
    // Show what we're about to delete
    console.log('\n📋 Transactions to delete:');
    transactions.forEach((transaction, index) => {
      console.log(`${index + 1}. ${transaction.description} - ₹${transaction.amount} (${transaction.originalType})`);
    });
    
    // Delete all transactions
    console.log('\n🗑️  Deleting all transactions...');
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const transaction of transactions) {
      try {
        await axios.delete(`${API_BASE_URL}/transactions/${transaction.id}`, {
          headers: authHeaders
        });
        deletedCount++;
        console.log(`✅ Deleted transaction ${deletedCount}/${transactions.length}: ${transaction.description || 'Untitled'}`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Failed to delete transaction ${transaction.id}:`, error.response?.data?.message || error.message);
      }
    }
    
    console.log('\n📊 Deletion Summary:');
    console.log(`✅ Successfully deleted: ${deletedCount} transactions`);
    console.log(`❌ Failed to delete: ${errorCount} transactions`);
    console.log(`📊 Total processed: ${transactions.length} transactions`);
    
    if (deletedCount > 0) {
      console.log('\n🎉 All transactions have been successfully deleted!');
    }
    
  } catch (error) {
    console.error('❌ Error deleting transactions:', error.response?.data?.message || error.message);
  }
}

// Run the deletion
deleteTarunTransactions();
