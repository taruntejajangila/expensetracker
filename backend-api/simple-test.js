// Simple test to check live traffic
const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/admin/live-traffic',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjNiNzQxZC1mNTQ5LTQ0NmUtODE3OC1hMzc5ZWRmYTNjMTQiLCJlbWFpbCI6ImFkbWluQGV4cGVuc2V0cmFja2VyLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1Njc5MjczNCwiZXhwIjoxNzU2ODc5MTM0fQ.4Fzkdo8QhR-JpawjJX3Alr_ncOLhNQNtawFdnsAzYOg'
  }
};

console.log('🚀 Testing Live Traffic API...\n');

const req = http.request(options, (res) => {
  console.log(`📊 Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      console.log('✅ Live Traffic Data:');
      console.log(`   📱 Live Users: ${response.data.liveUsers}`);
      console.log(`   ⏰ Recently Active (2h): ${response.data.hourlyActive}`);
      console.log(`   📅 Daily Active: ${response.data.dailyActive}`);
      console.log(`   👥 Total Users: ${response.data.totalUsers}`);
      console.log(`   🕐 Last Updated: ${response.data.lastUpdated}`);
      console.log('\n🎉 Live Traffic System is Working!');
    } catch (error) {
      console.log('❌ Error parsing response:', error.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.end();
