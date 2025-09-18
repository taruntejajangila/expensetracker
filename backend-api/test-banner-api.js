const axios = require('axios');

async function testBannerAPI() {
  try {
    console.log('🧪 Testing Banner API...');
    
    // Test public banners endpoint
    console.log('📡 Testing GET /api/banners/public...');
    const response = await axios.get('http://localhost:5000/api/banners/public');
    
    if (response.data.success) {
      console.log('✅ Public banners endpoint working!');
      console.log(`📊 Found ${response.data.data.length} banners`);
      response.data.data.forEach((banner, index) => {
        console.log(`  ${index + 1}. ${banner.title} (${banner.is_active ? 'Active' : 'Inactive'})`);
      });
    } else {
      console.log('❌ Public banners endpoint failed:', response.data.message);
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is not running. Please start it with: npm start');
    } else {
      console.log('❌ Error testing banner API:', error.message);
    }
  }
}

testBannerAPI();
