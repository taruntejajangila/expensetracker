const axios = require('axios');

const API_BASE_URL = 'https://expensetracker-production-eb9c.up.railway.app/api';

async function deleteAllTransactions() {
  try {
    console.log('🗑️  Starting to delete all transactions...');
    
    // First, let's register a temporary user for this operation
    const testEmail = `delete-test-${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log('👤 Registering temporary user...');
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, {
        email: testEmail,
        password: testPassword,
        name: 'Delete Test User',
        firstName: 'Delete',
        lastName: 'Test'
      });
      console.log('✅ User registered successfully');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️  User already exists, proceeding with login...');
      } else {
        throw error;
      }
    }
    
    // Login to get auth token
    console.log('🔐 Logging in...');
    const loginResponse = await axios.post(`${API_BASE_URL}/auth/login`, {
      email: testEmail,
      password: testPassword
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
    
    // Delete all transactions
    console.log('🗑️  Deleting all transactions...');
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const transaction of transactions) {
      try {
        await axios.delete(`${API_BASE_URL}/transactions/${transaction.id}`, {
          headers: authHeaders
        });
        deletedCount++;
        console.log(`✅ Deleted transaction ${deletedCount}/${transactions.length}: ${transaction.title || 'Untitled'}`);
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
deleteAllTransactions();
