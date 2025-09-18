#!/usr/bin/env node

// Comprehensive test script for admin panel functionality
const http = require('http');

const API_BASE = 'http://localhost:5000/api';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJlMjNiNzQxZC1mNTQ5LTQ0NmUtODE3OC1hMzc5ZWRmYTNjMTQiLCJlbWFpbCI6ImFkbWluQGV4cGVuc2V0cmFja2VyLmNvbSIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc1Njc5MjczNCwiZXhwIjoxNzU2ODc5MTM0fQ.4Fzkdo8QhR-JpawjJX3Alr_ncOLhNQNtawFdnsAzYOg';

function makeRequest(path, method = 'GET', data = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method: method,
      headers: {
        'Authorization': `Bearer ${ADMIN_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch (error) {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testAdminPanel() {
  console.log('🚀 Testing Admin Panel Functionality...\n');
  
  const tests = [
    {
      name: 'Live Traffic API',
      test: () => makeRequest('/admin/live-traffic'),
      expected: 'success'
    },
    {
      name: 'System Stats API',
      test: () => makeRequest('/admin/stats'),
      expected: 'success'
    },
    {
      name: 'Users List API',
      test: () => makeRequest('/admin/users'),
      expected: 'success'
    },
    {
      name: 'System Health API',
      test: () => makeRequest('/admin/health'),
      expected: 'success'
    },
    {
      name: 'Error Logs API',
      test: () => makeRequest('/admin/logs/errors'),
      expected: 'success'
    },
    {
      name: 'Performance Metrics API',
      test: () => makeRequest('/admin/metrics/performance'),
      expected: 'success'
    },
    {
      name: 'Usage Analytics API',
      test: () => makeRequest('/admin/analytics/usage?days=30'),
      expected: 'success'
    },
    {
      name: 'Financial Summary API',
      test: () => makeRequest('/admin/analytics/financial/summary'),
      expected: 'success'
    },
    {
      name: 'Realtime Monitoring API',
      test: () => makeRequest('/admin/monitoring/transactions/realtime'),
      expected: 'success'
    },
    {
      name: 'Anomaly Detection API',
      test: () => makeRequest('/admin/monitoring/anomalies'),
      expected: 'success'
    },
    {
      name: 'Performance Monitoring API',
      test: () => makeRequest('/admin/monitoring/performance'),
      expected: 'success'
    },
    {
      name: 'User Activity Tracking API',
      test: () => makeRequest('/admin/monitoring/activity'),
      expected: 'success'
    },
    {
      name: 'Financial Reports API',
      test: () => makeRequest('/admin/reports/financial?period=month'),
      expected: 'success'
    },
    {
      name: 'Scheduled Reports API',
      test: () => makeRequest('/admin/reports/scheduled'),
      expected: 'success'
    },
    {
      name: 'Alerts API',
      test: () => makeRequest('/admin/alerts'),
      expected: 'success'
    },
    {
      name: 'Alert Configurations API',
      test: () => makeRequest('/admin/alerts/config'),
      expected: 'success'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`📊 Testing ${test.name}...`);
      const result = await test.test();
      
      if (result.status === 200 && result.data.success) {
        console.log(`   ✅ ${test.name}: PASSED (${result.status})`);
        passed++;
      } else {
        console.log(`   ❌ ${test.name}: FAILED (${result.status})`);
        console.log(`      Response: ${JSON.stringify(result.data).substring(0, 100)}...`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ ${test.name}: ERROR - ${error.message}`);
      failed++;
    }
  }

  console.log('\n📋 Test Results:');
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📊 Total: ${passed + failed}`);
  console.log(`   🎯 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 All Admin Panel APIs are working perfectly!');
  } else {
    console.log('\n⚠️ Some APIs need attention. Check the failed tests above.');
  }
}

// Run the tests
testAdminPanel().catch(console.error);
