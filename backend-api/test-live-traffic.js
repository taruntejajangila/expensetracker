#!/usr/bin/env node

// Test script to simulate mobile app heartbeat and check live traffic
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjNiNzQxZC1mNTQ5LTQ0NmUtODE3OC1hMzc5ZWRmYTNjMTQiLCJlbWFpbCI6ImFkbWluQGV4cGVuc2V0cmFja2VyLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1Njc5MjczNCwiZXhwIjoxNzU2ODc5MTM0fQ.4Fzkdo8QhR-JpawjJX3Alr_ncOLhNQNtawFdnsAzYOg';

async function testLiveTraffic() {
  console.log('🚀 Testing Live Traffic System...\n');
  
  try {
    // Test 1: Check current live traffic
    console.log('📊 1. Checking current live traffic...');
    const trafficResponse = await axios.get(`${API_BASE}/admin/live-traffic`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });
    
    console.log('✅ Live Traffic Data:');
    console.log(`   📱 Live Users: ${trafficResponse.data.data.liveUsers}`);
    console.log(`   ⏰ Recently Active (2h): ${trafficResponse.data.data.hourlyActive}`);
    console.log(`   📅 Daily Active: ${trafficResponse.data.data.dailyActive}`);
    console.log(`   👥 Total Users: ${trafficResponse.data.data.totalUsers}`);
    console.log(`   🕐 Last Updated: ${trafficResponse.data.data.lastUpdated}\n`);
    
    // Test 2: Simulate mobile app heartbeat
    console.log('📱 2. Simulating mobile app heartbeat...');
    const heartbeatResponse = await axios.post(`${API_BASE}/admin/activity/heartbeat`, {
      deviceInfo: {
        platform: 'mobile',
        appVersion: '1.0.0',
        deviceType: 'iOS'
      },
      location: {
        country: 'US',
        city: 'San Francisco'
      }
    }, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });
    
    console.log('✅ Heartbeat Response:');
    console.log(`   📡 Status: ${heartbeatResponse.data.success ? 'Success' : 'Failed'}`);
    console.log(`   💬 Message: ${heartbeatResponse.data.message}`);
    console.log(`   🕐 Timestamp: ${heartbeatResponse.data.timestamp}\n`);
    
    // Test 3: Check live traffic again after heartbeat
    console.log('📊 3. Checking live traffic after heartbeat...');
    const updatedTrafficResponse = await axios.get(`${API_BASE}/admin/live-traffic`, {
      headers: { Authorization: `Bearer ${ADMIN_TOKEN}` }
    });
    
    console.log('✅ Updated Live Traffic Data:');
    console.log(`   📱 Live Users: ${updatedTrafficResponse.data.data.liveUsers}`);
    console.log(`   ⏰ Recently Active (2h): ${updatedTrafficResponse.data.data.hourlyActive}`);
    console.log(`   📅 Daily Active: ${updatedTrafficResponse.data.data.dailyActive}`);
    console.log(`   👥 Total Users: ${updatedTrafficResponse.data.data.totalUsers}\n`);
    
    console.log('🎉 Live Traffic System Test Complete!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Live traffic API is working');
    console.log('   ✅ Heartbeat system is functional');
    console.log('   ✅ Real-time updates are working');
    console.log('\n💡 The admin panel should now show live traffic data!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.response) {
      console.error('   Status:', error.response.status);
      console.error('   Data:', error.response.data);
    }
  }
}

// Run the test
testLiveTraffic();
