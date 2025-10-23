const fetch = require('node-fetch');

async function simpleTest() {
  try {
    console.log('🧪 Simple API Test...\n');

    // Test login
    console.log('1️⃣ Testing login...');
    const loginResponse = await fetch('https://expensetracker-production-eb9c.up.railway.app/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'tarun2022@gmail.com',
        password: 'Tarunteja1422@'
      })
    });

    console.log('Login status:', loginResponse.status);
    
    if (loginResponse.ok) {
      const loginData = await loginResponse.json();
      console.log('✅ Login successful');
      
      const token = loginData.data.token;
      
      // Test support ticket creation
      console.log('\n2️⃣ Testing support ticket creation...');
      const ticketResponse = await fetch('https://expensetracker-production-eb9c.up.railway.app/api/support-tickets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          subject: 'Test Ticket',
          description: 'Testing the API',
          category: 'technical',
          priority: 'medium'
        })
      });

      console.log('Ticket creation status:', ticketResponse.status);
      
      if (ticketResponse.ok) {
        const ticketData = await ticketResponse.json();
        console.log('✅ Ticket created successfully!');
        console.log('Ticket number:', ticketData.data.ticket_number);
        console.log('Ticket ID:', ticketData.data.id);
      } else {
        const errorText = await ticketResponse.text();
        console.log('❌ Ticket creation failed');
        console.log('Error:', errorText);
      }
    } else {
      console.log('❌ Login failed');
    }

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

simpleTest();