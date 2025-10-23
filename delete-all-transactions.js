const axios = require('axios');

const API_BASE_URL = 'https://expensetracker-production-eb9c.up.railway.app/api';

async function deleteAllTransactions() {
  try {
    console.log('🗑️  Starting to delete all transactions...');
    
    // First, let's get all transactions to see what we're working with
    console.log('📊 Fetching all transactions...');
    const response = await axios.get(`${API_BASE_URL}/transactions`, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    const transactions = response.data.data || [];
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
          headers: {
            'Content-Type': 'application/json',
          }
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
