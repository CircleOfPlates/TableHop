import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import bcrypt from 'bcrypt';
import { env } from './env';
import { sessionMiddleware } from './session';
import { db } from './db/client';
import { users, events, participants } from './db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { requireAuth, setSessionUser, getSessionUserId } from './auth';

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(sessionMiddleware);
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

// Health
app.get('/health', (_req, res) => res.json({ ok: true }));

// Auth
const signupSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
});

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
app.post('/api/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { identifier, password } = parsed.data;
  const user = await db.query.users.findFirst({
    where: (u, { or, eq }) => or(eq(u.email, identifier), eq(u.username, identifier)),
  });
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, (user as any).passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  setSessionUser(req, (user as any).id);
  return res.json({ id: (user as any).id, username: (user as any).username, email: (user as any).email });
});

app.post('/api/auth/logout', (req, res) => {
  req.session?.destroy(() => res.json({ ok: true }));
});

app.get('/api/auth/me', (req, res) => {
  const userId = getSessionUserId(req);
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  return res.json({ id: userId });
});

// Events basic routes
app.get('/api/events', async (_req, res) => {
  const all = await db.select().from(events);
  res.json(all);
});

const registrationSchema = z.object({
  eventId: z.number().int(),
  partnerId: z.number().int().nullable().optional(),
  coursePreference: z.enum(['starter', 'main', 'dessert']).nullable().optional(),
});

app.post('/api/events/register', requireAuth, async (req, res) => {
  const parsed = registrationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const userId = getSessionUserId(req)!;
  const { eventId, partnerId, coursePreference } = parsed.data;

  const existing = await db.query.participants.findFirst({
    where: (p, { and, eq }) => and(eq(p.eventId, eventId), eq(p.userId, userId)),
  });
  if (existing) return res.status(409).json({ error: 'Already registered' });

  const [row] = await db
    .insert(participants)
    .values({ eventId, userId, partnerId: partnerId ?? null, coursePreference: coursePreference ?? null, isHost: false })
    .returning();
  res.status(201).json(row);
});

app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on http://localhost:${env.PORT}`);
});


