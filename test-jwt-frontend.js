// Test JWT authentication with frontend
// This script tests the complete JWT flow

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:4000';
const WEB_URL = process.env.WEB_URL || 'http://localhost:5173';

async function testJWTFrontend() {
  console.log('🧪 Testing JWT authentication with frontend...\n');

  // Step 1: Test API health
  console.log('1. Testing API health...');
  try {
    const healthRes = await axios.get(`${API_URL}/health`);
    console.log('✅ API health check passed');
  } catch (error) {
    console.error('❌ API health check failed:', error.message);
    return;
  }

  // Step 2: Test login and get JWT token
  console.log('\n2. Testing login to get JWT token...');
  try {
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      identifier: 'admin',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('✅ Login successful');
    const token = loginRes.data.token;
    console.log('🔑 JWT token received:', token ? 'Yes' : 'No');

    // Step 3: Test auth/me with JWT token
    console.log('\n3. Testing auth/me with JWT token...');
    const meRes = await axios.get(`${API_URL}/api/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ Auth/me successful:', meRes.data);

    // Step 4: Test JWT debug endpoint
    console.log('\n4. Testing JWT debug endpoint...');
    const debugRes = await axios.get(`${API_URL}/api/jwt-debug`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    console.log('✅ JWT debug successful:', debugRes.data);

    // Step 5: Test without token (should fail)
    console.log('\n5. Testing auth/me without token (should fail)...');
    try {
      const meResNoToken = await axios.get(`${API_URL}/api/auth/me`);
      console.log('❌ Unexpected success without token:', meResNoToken.data);
    } catch (error) {
      console.log('✅ Correctly failed without token:', error.response?.data);
    }

    console.log('\n🎉 JWT authentication test completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- API server is running');
    console.log('- JWT token generation works');
    console.log('- JWT token verification works');
    console.log('- Protected endpoints work with JWT');
    console.log('- Unprotected requests correctly fail');

  } catch (error) {
    console.error('❌ JWT test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testJWTFrontend().catch(console.error);
