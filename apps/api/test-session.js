// Simple test script to debug session issues
// Run this with: node test-session.js

const fetch = require('node-fetch');

const API_URL = process.env.API_URL || 'http://localhost:4000';

async function testSession() {
  console.log('Testing session flow...\n');
  
  // Step 1: Test health endpoint
  console.log('1. Testing health endpoint...');
  try {
    const healthRes = await fetch(`${API_URL}/health`);
    const healthData = await healthRes.json();
    console.log('Health response:', healthData);
  } catch (error) {
    console.error('Health check failed:', error.message);
    return;
  }
  
  // Step 2: Test session debug before login
  console.log('\n2. Testing session debug (before login)...');
  try {
    const debugRes = await fetch(`${API_URL}/api/session-debug`);
    const debugData = await debugRes.json();
    console.log('Session debug response:', debugData);
  } catch (error) {
    console.error('Session debug failed:', error.message);
  }
  
  // Step 3: Test login
  console.log('\n3. Testing login...');
  try {
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        identifier: 'admin',
        password: 'admin123'
      })
    });
    
    const loginData = await loginRes.json();
    console.log('Login response:', loginData);
    
    if (loginRes.ok) {
      const cookies = loginRes.headers.get('set-cookie');
      console.log('Login cookies:', cookies);
      
      // Step 4: Test auth/me with cookies
      console.log('\n4. Testing auth/me (with cookies)...');
      const meRes = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      const meData = await meRes.json();
      console.log('Auth/me response:', meData);
      
      // Step 5: Test session debug after login
      console.log('\n5. Testing session debug (after login)...');
      const debugRes2 = await fetch(`${API_URL}/api/session-debug`, {
        headers: {
          'Cookie': cookies
        }
      });
      
      const debugData2 = await debugRes2.json();
      console.log('Session debug response (after login):', debugData2);
    }
  } catch (error) {
    console.error('Login test failed:', error.message);
  }
}

testSession().catch(console.error);
