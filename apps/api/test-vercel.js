// Simple test to verify the API structure
const express = require('express');
const app = express();

// Basic middleware
app.use(express.json());

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'TableHop API Test', 
    version: '1.0.0',
    health: '/health'
  });
});

// Test auth endpoint
app.post('/api/auth/login', (req, res) => {
  res.json({ 
    message: 'Login endpoint reached',
    data: req.body
  });
});

// Export for Vercel
module.exports = app;
