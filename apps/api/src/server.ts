import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import swaggerUi from 'swagger-ui-express';
import { env } from './env';
import { sessionMiddleware } from './session';
import { db } from './db/client';
import { users, events, participants } from './db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth, setSessionUser, getSessionUserId } from './auth';
import profileRouter from './routes/profile';
import { specs } from './swagger';

const app = express();

app.use(helmet());
app.use(cors({ 
  origin: env.FRONTEND_URL || 'http://localhost:5173', 
  credentials: true 
}));
app.use(express.json());
app.use(sessionMiddleware);
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use X-Forwarded-For header for Vercel, fallback to IP
      return req.headers['x-forwarded-for'] as string || req.ip || 'unknown';
    },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/health';
    }
  })
);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [System]
 *     description: Check if the API server is running
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 */
// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'TableHop API', 
    version: '1.0.0',
    health: '/health',
    docs: '/api-docs',
    dbTest: '/api/db-test'
  });
});

// Database connection test
app.get('/api/db-test', async (req, res) => {
  try {
    // Test database connection
    const result = await db.execute(sql`SELECT 1 as test`);
    res.json({ 
      success: true, 
      message: 'Database connection successful',
      result: result.rows?.[0] || result
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Database connection failed',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'TableHop API Documentation'
}));

// Auth
const signupSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
});

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minimum: 3
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minimum: 8
 *                 example: password123
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 username:
 *                   type: string
 *                   example: johndoe
 *                 email:
 *                   type: string
 *                   example: john@example.com
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/auth/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { username, email, password } = parsed.data;

  const existing = await db.query.users.findFirst({
    where: (u, { or, eq }) => or(eq(u.email, email), eq(u.username, username)),
  });
  if (existing) return res.status(409).json({ error: 'User already exists' });

  const passwordHash = await bcrypt.hash(password, 12);
  const [inserted] = await db.insert(users).values({ username, email, passwordHash }).returning({ id: users.id });
  setSessionUser(req, inserted.id);
  return res.status(201).json({ id: inserted.id, username, email });
});

const loginSchema = z.object({ identifier: z.string(), password: z.string() });

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and create session
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 description: Username or email
 *                 example: johndoe
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 username:
 *                   type: string
 *                   example: johndoe
 *                 email:
 *                   type: string
 *                   example: john@example.com
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { identifier, password } = parsed.data;
    
    console.log('Login attempt for:', identifier);
    
    const user = await db.query.users.findFirst({
      where: (u, { or, eq }) => or(eq(u.email, identifier), eq(u.username, identifier)),
    });
    
    if (!user) {
      console.log('User not found:', identifier);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const ok = await bcrypt.compare(password, (user as any).passwordHash);
    if (!ok) {
      console.log('Invalid password for user:', identifier);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    setSessionUser(req, (user as any).id);
    console.log('Login successful for user:', identifier);
    console.log('Session after setting user:', req.session);
    
    // Save the session explicitly
    req.session.save((err) => {
      if (err) {
        console.error('Error saving session:', err);
        return res.status(500).json({ error: 'Session save failed' });
      }
      console.log('Session saved successfully');
      return res.json({ id: (user as any).id, username: (user as any).username, email: (user as any).email });
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user and destroy session
 *     tags: [Authentication]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 */
app.post('/api/auth/logout', (req, res) => {
  req.session?.destroy(() => res.json({ ok: true }));
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Authentication]
 *     security:
 *       - sessionAuth: []
 *     responses:
 *       200:
 *         description: Current user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1
 *                 role:
 *                   type: string
 *                   enum: [user, admin]
 *                   example: user
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.get('/api/auth/me', async (req, res) => {
  console.log('Auth me request - session:', req.session);
  console.log('Auth me request - cookies:', req.headers.cookie);
  
  const userId = getSessionUserId(req);
  console.log('Auth me - userId from session:', userId);
  
  if (!userId) {
    console.log('Auth me - No userId found, returning 401');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
      columns: { id: true, role: true }
    });
    
    if (!user) {
      console.log('Auth me - User not found in database:', userId);
      return res.status(401).json({ error: 'User not found' });
    }
    
    console.log('Auth me - User found:', user);
    return res.json({ id: user.id, role: user.role });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Mount routers
app.use('/api/events', require('./routes/events').default);
app.use('/api/ratings', require('./routes/ratings').default);
app.use('/api/rewards', require('./routes/rewards').default);

// Mount routers
app.use('/api/profile', profileRouter);
app.use('/api/admin', require('./routes/admin').default);

// Only start the server if not in Vercel environment
if (process.env.NODE_ENV !== 'production' || process.env.VERCEL !== '1') {
  app.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`API listening on http://localhost:${env.PORT}`);
  });
}

// Export the app for Vercel serverless functions
export { app };


