const axios = require('axios');

const API_BASE_URL = 'http://localhost:5001/api';

async function createTestTransaction() {
  try {
    console.log('🔍 Creating test transaction via API...');

    // First, let's try to create a transaction using the API
    const transactionData = {
      amount: 150.00,
      type: 'expense',
      category: 'Groceries', // Assuming this category exists
      description: 'Coffee Shop Purchase - Morning Coffee and Croissant',
      date: new Date().toISOString(),
      tags: ['Business meeting', 'Client discussion']
    };

    console.log('📤 Sending transaction data:', transactionData);

    // Note: This will likely fail due to authentication, but let's try
    const response = await axios.post(`${API_BASE_URL}/transactions`, transactionData, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token' // Using test token
      }
    });

    console.log('✅ Transaction created successfully via API!');
    console.log('📋 Response:', response.data);

  } catch (error) {
    console.error('❌ Error creating transaction via API:', error.response?.data || error.message);
    
    // Let's try to get existing transactions to see the current structure
    console.log('\n🔍 Trying to fetch existing transactions to see the structure...');
    try {
      const getResponse = await axios.get(`${API_BASE_URL}/transactions`, {
        headers: {
          'Authorization': 'Bearer test-token'
        }
      });
      
      console.log('✅ Successfully fetched transactions:');
      console.log('📋 Sample transaction structure:', JSON.stringify(getResponse.data.data?.transactions?.[0] || getResponse.data.data?.[0] || 'No transactions found', null, 2));
      
    } catch (getError) {
      console.error('❌ Error fetching transactions:', getError.response?.data || getError.message);
    }
  }
}

// Run the test
createTestTransaction();
