import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import swaggerUi from 'swagger-ui-express';
import { env } from './env';
import { sessionMiddleware } from './session';
import { db } from './db/client';
import { users } from './db/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth, setSessionUser, getSessionUserId } from './auth';
import profileRouter from './routes/profile';
import { specs } from './swagger';

const app = express();

app.use(helmet());
app.use(cors({ 
  origin: env.FRONTEND_URL || 'http://localhost:5173', 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  exposedHeaders: ['Set-Cookie']
}));
app.use(express.json());
app.use(sessionMiddleware as any);
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
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
app.get('/health', (_req, res) => res.json({ ok: true }));

// Session debug endpoint
app.get('/api/session-debug', (req, res) => {
  console.log('Session debug request:', {
    sessionExists: !!req.session,
    sessionId: req.sessionID,
    sessionData: req.session ? Object.keys(req.session) : null,
    userId: req.session ? (req.session as any).userId : null,
    cookies: req.headers.cookie,
    origin: req.headers.origin,
    host: req.headers.host
  });
  
  res.json({
    sessionExists: !!req.session,
    sessionId: req.sessionID,
    sessionData: req.session ? Object.keys(req.session) : null,
    userId: req.session ? (req.session as any).userId : null,
    cookies: req.headers.cookie,
    origin: req.headers.origin,
    host: req.headers.host
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'TableHop API', 
    version: '1.0.0',
    health: '/health',
    docs: '/api-docs'
  });
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve as any, swaggerUi.setup(specs, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'TableHop API Documentation'
}) as any);

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
    console.log('Login request received:', { 
      body: req.body, 
      sessionExists: !!req.session,
      sessionId: req.sessionID,
      cookies: req.headers.cookie 
    });
    
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
    const { identifier, password } = parsed.data;
    
    const user = await db.query.users.findFirst({
      where: (u, { or, eq }) => or(eq(u.email, identifier), eq(u.username, identifier)),
    });
    
    if (!user) {
      console.log('User not found for identifier:', identifier);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const ok = await bcrypt.compare(password, (user as any).passwordHash);
    if (!ok) {
      console.log('Invalid password for user:', (user as any).id);
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    console.log('User authenticated successfully:', { userId: (user as any).id, username: (user as any).username });
    
    setSessionUser(req, (user as any).id);
    
    req.session.save((err) => {
      if (err) {
        console.error('Session save failed:', err);
        return res.status(500).json({ error: 'Session save failed' });
      }
      console.log('Session saved successfully:', { 
        sessionId: req.sessionID, 
        userId: (req.session as any).userId 
      });
      return res.json({ id: (user as any).id, username: (user as any).username, email: (user as any).email });
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
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
  console.log('Auth/me request received:', { 
    sessionExists: !!req.session,
    sessionId: req.sessionID,
    cookies: req.headers.cookie,
    headers: req.headers
  });
  
  const userId = getSessionUserId(req);
  
  if (!userId) {
    console.log('No userId found in session, returning 401');
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const user = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, userId),
      columns: { id: true, role: true }
    });
    
    if (!user) {
      console.log('User not found in database for userId:', userId);
      return res.status(401).json({ error: 'User not found' });
    }
    
    console.log('User found successfully:', { id: user.id, role: user.role });
    return res.json({ id: user.id, role: user.role });
  } catch (error) {
    console.error('Auth/me error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Mount routers
app.use('/api/events', require('./routes/events').default);
app.use('/api/ratings', require('./routes/ratings').default);
app.use('/api/rewards', require('./routes/rewards').default);
app.use('/api/profile', profileRouter);
app.use('/api/admin', require('./routes/admin').default);

// Start the server
app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});

export { app };


