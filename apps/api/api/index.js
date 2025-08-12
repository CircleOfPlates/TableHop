// Vercel serverless function entry point
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const app = express();

// Basic middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

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
    health: '/health',
    test: '/api/test'
  });
});

// Basic auth endpoints for testing
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // For now, return a simple response
    res.status(201).json({ 
      message: 'Signup endpoint reached',
      data: { username, email }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // For now, return a simple response
    res.json({ 
      message: 'Login endpoint reached',
      data: { identifier }
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ message: 'Auth me endpoint reached' });
});

// Start server if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const port = process.env.PORT || 4000;
  app.listen(port, () => {
    console.log(`Simplified API listening on http://localhost:${port}`);
  });
}

// Export for Vercel
module.exports = app;
