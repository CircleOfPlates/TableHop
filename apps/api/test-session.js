// Simple test script to debug session issues
// Run this with: node test-session.js

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:4000';

async function testSession() {
  console.log('Testing session flow...\n');
  
  // Step 1: Test health endpoint
  console.log('1. Testing health endpoint...');
  try {
    const healthRes = await axios.get(`${API_URL}/health`);
    console.log('Health response:', healthRes.data);
  } catch (error) {
    console.error('Health check failed:', error.message);
    return;
  }
  
  // Step 2: Test session debug before login
  console.log('\n2. Testing session debug (before login)...');
  try {
    const debugRes = await axios.get(`${API_URL}/api/session-debug`);
    console.log('Session debug response:', debugRes.data);
  } catch (error) {
    console.error('Session debug failed:', error.message);
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
      const cookies = loginRes.headers['set-cookie'];
      console.log('Login cookies:', cookies);
      
      // Step 4: Test auth/me with cookies
      console.log('\n4. Testing auth/me (with cookies)...');
      const meRes = await axios.get(`${API_URL}/api/auth/me`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      console.log('Auth/me response:', meRes.data);
      
      // Step 5: Test session debug after login
      console.log('\n5. Testing session debug (after login)...');
      const debugRes2 = await axios.get(`${API_URL}/api/session-debug`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      console.log('Session debug response (after login):', debugRes2.data);
    }
  } catch (error) {
    console.error('Login test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testSession().catch(console.error);
