const axios = require('axios');

async function testReportsFix() {
  try {
    console.log('🧪 Testing Reports Page Fix...');
    
    // Login to get token
    const loginResponse = await axios.post('http://localhost:5001/api/auth/login', {
      email: 'admin@expensetracker.com',
      password: 'admin123'
    });
    
    const token = loginResponse.data.data.accessToken;
    console.log('✅ Admin login successful');
    
    // Test financial report
    const reportResponse = await axios.get('http://localhost:5001/api/admin/reports/financial?period=monthly', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    if (reportResponse.data.success) {
      const summary = reportResponse.data.data.summary;
      console.log('\n📊 Financial Report Summary:');
      console.log(`   Total Income: ${summary.total_income} (type: ${typeof summary.total_income})`);
      console.log(`   Total Expenses: ${summary.total_expenses} (type: ${typeof summary.total_expenses})`);
      console.log(`   Total Transactions: ${summary.total_transactions} (type: ${typeof summary.total_transactions})`);
      console.log(`   Active Users: ${summary.active_users} (type: ${typeof summary.active_users})`);
      
      // Test formatCurrency function logic
      const formatCurrency = (amount) => {
        const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(numAmount);
      };
      
      console.log('\n💰 Formatted Values:');
      console.log(`   Total Income: ${formatCurrency(summary.total_income)}`);
      console.log(`   Total Expenses: ${formatCurrency(summary.total_expenses)}`);
      
      // Check if values are valid numbers
      const incomeNum = parseFloat(summary.total_income);
      const expensesNum = parseFloat(summary.total_expenses);
      
      console.log('\n🔍 Validation:');
      console.log(`   Income is valid number: ${!isNaN(incomeNum)} (${incomeNum})`);
      console.log(`   Expenses is valid number: ${!isNaN(expensesNum)} (${expensesNum})`);
      
      if (!isNaN(incomeNum) && !isNaN(expensesNum)) {
        console.log('\n✅ SUCCESS: All values are properly formatted and can be displayed!');
        console.log('   The reports page should now show correct values instead of NaN.');
      } else {
        console.log('\n❌ ERROR: Some values are not valid numbers');
      }
      
    } else {
      console.log('❌ Failed to get financial report');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testReportsFix();
