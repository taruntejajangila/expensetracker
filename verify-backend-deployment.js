/**
 * Verify backend API deployment by checking server response
 * and looking for indicators of new code
 */

const https = require('https');

const API_URL = process.env.API_URL || 'https://expensetracker-production-eb9c.up.railway.app';

console.log('🔍 Backend API Deployment Verification\n');
console.log('='.repeat(70));
console.log(`📍 API: ${API_URL}\n`);

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, API_URL);
    
    const req = https.request({
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 10000
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            data: data ? JSON.parse(data) : {},
            headers: res.headers
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            data: { raw: data },
            headers: res.headers
          });
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    req.end();
  });
}

async function verifyDeployment() {
  console.log('📊 Checking Backend API Status...\n');
  
  try {
    // Test 1: Health check
    console.log('1️⃣  Testing Health Endpoint...');
    const health = await makeRequest('/health');
    console.log(`   Status: ${health.statusCode}`);
    console.log(`   Response: ${JSON.stringify(health.data, null, 2)}`);
    
    if (health.statusCode === 200) {
      console.log('   ✅ Backend API is running\n');
    } else {
      console.log('   ❌ Backend API is not responding correctly\n');
      return;
    }
    
    // Test 2: Root endpoint
    console.log('2️⃣  Testing Root Endpoint...');
    try {
      const root = await makeRequest('/');
      console.log(`   Status: ${root.statusCode}`);
      if (root.data.endpoints) {
        console.log(`   Available Endpoints: ${Object.keys(root.data.endpoints).join(', ')}`);
      }
      console.log('   ✅ Root endpoint responding\n');
    } catch (error) {
      console.log(`   ⚠️  Root endpoint: ${error.message}\n`);
    }
    
    // Test 3: Check API info
    console.log('3️⃣  Checking API Information...');
    if (health.data) {
      console.log(`   Environment: ${health.data.environment || 'unknown'}`);
      console.log(`   Version: ${health.data.version || 'unknown'}`);
      console.log(`   Database: ${health.data.database?.status || 'unknown'}`);
    }
    
    // Test 4: Multiple requests to test rate limiting
    console.log('\n4️⃣  Testing Rate Limiting (making 250 requests)...');
    console.log('   (Health endpoint is excluded from rate limiting, so this tests general API handling)');
    
    const requests = [];
    for (let i = 0; i < 250; i++) {
      requests.push(
        makeRequest('/health')
          .catch(() => ({ statusCode: 0, error: true }))
      );
    }
    
    const results = await Promise.all(requests);
    const successful = results.filter(r => r.statusCode === 200).length;
    const failed = results.filter(r => r.statusCode !== 200).length;
    
    console.log(`   ✅ Successful: ${successful}/250`);
    console.log(`   ❌ Failed: ${failed}/250`);
    
    if (successful >= 240) {
      console.log('   ✅ API handles high load well\n');
    } else {
      console.log('   ⚠️  Some requests failed\n');
    }
    
    // Summary
    console.log('='.repeat(70));
    console.log('📋 Deployment Status');
    console.log('='.repeat(70));
    console.log('✅ Backend API is running and responding');
    console.log('✅ API can handle multiple concurrent requests');
    console.log('\n⚠️  Cannot verify commit d649f4f deployment from API tests alone');
    console.log('   because:');
    console.log('   1. Health endpoint is excluded from rate limiting');
    console.log('   2. Per-user rate limiting requires authenticated requests');
    console.log('   3. Need to check Railway dashboard for deployment commit');
    console.log('\n💡 To verify deployment:');
    console.log('   1. Railway Dashboard → Backend Service → Deployments tab');
    console.log('   2. Look for commit: d649f4f or d027bde');
    console.log('   3. Check deployment timestamp (should be recent)');
    console.log('   4. Check Logs tab for build/start messages');
    console.log('='.repeat(70));
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verifyDeployment();

