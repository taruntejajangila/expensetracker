const axios = require('axios');

async function testBudgetAPI() {
  try {
    console.log('🔍 Testing budget API endpoint...');
    
    // First, login as a regular user to get token
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'taruntejajangila@gmail.com',
      password: 'Tarun123@'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ User login successful, token:', token.substring(0, 20) + '...');
    
    // Test the budgets endpoint
    const budgetsResponse = await axios.get('http://localhost:5000/api/budgets', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Budgets response:');
    console.log('Success:', budgetsResponse.data.success);
    console.log('Message:', budgetsResponse.data.message);
    console.log('Budgets count:', budgetsResponse.data.data?.length || 0);
    
    if (budgetsResponse.data.data && budgetsResponse.data.data.length > 0) {
      console.log('\n💳 Budgets data:');
      budgetsResponse.data.data.forEach((budget, index) => {
        console.log(`${index + 1}. ${budget.name}: ₹${budget.amount} budget, ₹${budget.spent} spent, ${budget.status}`);
        console.log(`   Category: ${budget.category} (ID: ${budget.categoryId})`);
        console.log(`   Period: ${budget.period}`);
      });
    } else {
      console.log('\n❌ No budgets found');
    }
    
  } catch (error) {
    console.error('❌ Error testing budget API:', error.response?.data || error.message);
  }
}

testBudgetAPI();
