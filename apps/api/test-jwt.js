// JWT authentication test script
// Run this with: node test-jwt.js

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:4000';

async function testJWT() {
  console.log('Testing JWT authentication flow...\n');
  
  // Step 1: Test health endpoint
  console.log('1. Testing health endpoint...');
  try {
    const healthRes = await axios.get(`${API_URL}/health`);
    console.log('Health response:', healthRes.data);
  } catch (error) {
    console.error('Health check failed:', error.message);
    return;
  }
  
  // Step 2: Test JWT debug before login
  console.log('\n2. Testing JWT debug (before login)...');
  try {
    const debugRes = await axios.get(`${API_URL}/api/jwt-debug`);
    console.log('JWT debug response:', debugRes.data);
  } catch (error) {
    console.error('JWT debug failed:', error.message);
  }
  
  // Step 3: Test login
  console.log('\n3. Testing login...');
  try {
    const loginRes = await axios.post(`${API_URL}/api/auth/login`, {
      identifier: 'admin',
      password: 'admin123'
    }, {
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Login response:', loginRes.data);
    
    if (loginRes.status === 200) {
      const token = loginRes.data.token;
      console.log('JWT token received:', token ? 'Yes' : 'No');
      
      // Step 4: Test auth/me with JWT token
      console.log('\n4. Testing auth/me (with JWT token)...');
      const meRes = await axios.get(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Auth/me response:', meRes.data);
      
      // Step 5: Test JWT debug after login
      console.log('\n5. Testing JWT debug (after login)...');
      const debugRes2 = await axios.get(`${API_URL}/api/jwt-debug`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('JWT debug response (after login):', debugRes2.data);
      
      // Step 6: Test without token (should fail)
      console.log('\n6. Testing auth/me without token (should fail)...');
      try {
        const meResNoToken = await axios.get(`${API_URL}/api/auth/me`);
        console.log('Unexpected success without token:', meResNoToken.data);
      } catch (error) {
        console.log('Correctly failed without token:', error.response?.data);
      }
    }
  } catch (error) {
    console.error('Login test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testJWT().catch(console.error);
