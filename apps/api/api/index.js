// Vercel serverless function entry point
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const app = express();

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Health check
app.get('/health', (_req, res) => res.json({ ok: true }));

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'TableHop API is working!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    vercel: process.env.VERCEL_URL
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'TableHop API', 
    version: '1.0.0',
    docs: '/api-docs',
    health: '/health',
    test: '/api/test'
  });
});

// Export for Vercel
module.exports = app;
