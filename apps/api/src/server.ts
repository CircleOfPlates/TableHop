import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import swaggerUi from 'swagger-ui-express';
import { env } from './env';
import { db } from './db/client';
import { users } from './db/schema';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth, requireAdmin, generateToken, getCurrentUser } from './auth';
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

// JWT debug endpoint
app.get('/api/jwt-debug', (req, res) => {
  const user = getCurrentUser(req);
  console.log('JWT debug request:', {
    user,
    authHeader: req.headers.authorization,
    cookies: req.headers.cookie,
    origin: req.headers.origin,
    host: req.headers.host
  });
  
  res.json({
    user,
    authHeader: req.headers.authorization,
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
 *     summary: Register a new user or upgrade guest account
 *     description: Creates a new user account. If a guest user exists with the same email (empty password), it will be upgraded to a full account.
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
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: User already exists (username or email taken by non-guest user)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
app.post('/api/auth/signup', async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { username, email, password } = parsed.data;

  // Check for existing user by email or username
  const existing = await db.query.users.findFirst({
    where: (u, { or, eq }) => or(eq(u.email, email), eq(u.username, username)),
  });
  
  if (existing) {
    // Check if this is a guest user (empty passwordHash) with the same email
    if (existing.email === email && existing.passwordHash === '') {
      // This is a guest user trying to complete their profile
      // Update the guest user with real credentials
      const passwordHash = await bcrypt.hash(password, 12);
      
      const [updated] = await db.update(users)
        .set({ 
          username, 
          passwordHash,
          name: existing.name === 'Guest' ? null : existing.name // Keep existing name if it was changed
        })
        .where(eq(users.id, existing.id))
        .returning({ id: users.id });
      
      // Generate JWT token
      const token = generateToken({
        userId: updated.id,
        username,
        role: 'user'
      });
      
      return res.status(201).json({ 
        id: updated.id, 
        username, 
        email,
        token
      });
    } else {
      // Regular user already exists
      return res.status(409).json({ error: 'User already exists' });
    }
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [inserted] = await db.insert(users).values({ username, email, passwordHash }).returning({ id: users.id });
  
  // Generate JWT token
  const token = generateToken({
    userId: inserted.id,
    username,
    role: 'user'
  });
  
  return res.status(201).json({ 
    id: inserted.id, 
    username, 
    email,
    token
  });
});

const loginSchema = z.object({ identifier: z.string(), password: z.string() });

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Authenticate user and return JWT token
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
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
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
    
    const user = await db.query.users.findFirst({
      where: (u, { or, eq }) => or(eq(u.email, identifier), eq(u.username, identifier)),
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const ok = await bcrypt.compare(password, (user as any).passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Generate JWT token
    const token = generateToken({
      userId: (user as any).id,
      username: (user as any).username,
      role: (user as any).role || 'user'
    });
    
    return res.json({ 
      id: (user as any).id, 
      username: (user as any).username, 
      email: (user as any).email,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
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
 *                 username:
 *                   type: string
 *                   example: johndoe
 *                 email:
 *                   type: string
 *                   example: john@example.com
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
app.get('/api/auth/me', requireAuth, async (req, res) => {
  const user = (req as any).user;
  
  try {
    const dbUser = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, user.userId),
      columns: { id: true, username: true, email: true, role: true, name: true }
    });
    
    if (!dbUser) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    return res.json({ 
      id: dbUser.id, 
      username: dbUser.username, 
      email: dbUser.email,
      role: dbUser.role,
      name: dbUser.name
    });
  } catch (error) {
    console.error('Auth/me error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Mount routers
app.use('/api/events', require('./routes/events').default);
app.use('/api/ratings', require('./routes/ratings').default);
app.use('/api/rewards', require('./routes/rewards').default);
app.use('/api/matching', require('./routes/matching').default);
app.use('/api/chat', require('./routes/chat').default);
app.use('/api/profile', profileRouter);
app.use('/api/admin', require('./routes/admin').default);

// Start the server
app.listen(env.PORT, () => {
  console.log(`API listening on http://localhost:${env.PORT}`);
});

export { app };


