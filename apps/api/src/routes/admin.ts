import express from 'express';
import { z } from 'zod';
import { db } from '../db/client';
import { users, events, participants, neighbourhoods } from '../db/schema';
import { eq, desc, count, sql } from 'drizzle-orm';
import { requireAdmin } from '../auth';

const router = express.Router();

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all users
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const allUsers = await db.query.users.findMany({
      columns: {
        id: true,
        username: true,
        email: true,
        role: true,
        createdAt: true,
      },
      orderBy: [desc(users.createdAt)],
    });

    return res.json(allUsers);
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/neighbourhoods:
 *   get:
 *     summary: Get all neighbourhoods (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of neighbourhoods
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/neighbourhoods', requireAdmin, async (req, res) => {
  try {
    const allNeighbourhoods = await db.query.neighbourhoods.findMany({
      orderBy: [neighbourhoods.name],
    });

    return res.json(allNeighbourhoods);
  } catch (error) {
    console.error('Get neighbourhoods error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/events:
 *   get:
 *     summary: Get all events (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of events with pagination
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/events', requireAdmin, async (req, res) => {
  try {
    const allEvents = await db.query.events.findMany({
      with: {
        neighbourhood: true,
        participants: {
          with: {
            user: {
              columns: {
                id: true,
                username: true,
              },
            },
          },
        },
      },
      orderBy: [desc(events.date)],
    });

    // Transform the data to match frontend expectations
    const transformedEvents = allEvents.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      totalSpots: event.totalSpots,
      spotsRemaining: event.spotsRemaining,
      format: event.format,
      neighbourhood: event.neighbourhood?.name || 'Unknown', // Extract neighbourhood name
      createdAt: event.createdAt,
    }));

    return res.json({
      events: transformedEvents,
      pagination: {
        page: 1,
        limit: transformedEvents.length,
        total: transformedEvents.length,
        pages: 1,
      },
    });
  } catch (error) {
    console.error('Get events error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/analytics:
 *   get:
 *     summary: Get platform analytics (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform analytics data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/analytics', requireAdmin, async (req, res) => {
  try {
    // Get user statistics
    const [userStats] = await db.select({
      totalUsers: count(users.id),
      activeUsers: count(users.id),
      newUsersThisMonth: count(users.id),
    }).from(users);

    // Get event statistics
    const [eventStats] = await db.select({
      totalEvents: count(events.id),
      eventsThisMonth: count(events.id),
      totalParticipants: count(participants.id),
    }).from(events);

    // Get neighbourhood statistics
    const [neighbourhoodStats] = await db.select({
      totalNeighbourhoods: count(neighbourhoods.id),
      activeNeighbourhoods: count(neighbourhoods.id),
    }).from(neighbourhoods);

    return res.json({
      users: userStats,
      events: eventStats,
      neighbourhoods: neighbourhoodStats,
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

const createAdminSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
});

/**
 * @swagger
 * /api/admin/create-admin:
 *   post:
 *     summary: Create a new admin user (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
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
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: Admin user created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/create-admin', requireAdmin, async (req, res) => {
  try {
    const parsed = createAdminSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const { username, email, password } = parsed.data;

    // Check if user already exists
    const existing = await db.query.users.findFirst({
      where: (u, { or, eq }) => or(eq(u.email, email), eq(u.username, username)),
    });

    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password and create admin user
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(password, 12);

    const [admin] = await db.insert(users).values({
      username,
      email,
      passwordHash,
      role: 'admin',
    }).returning({
      id: users.id,
      username: users.username,
      email: users.email,
      role: users.role,
    });

    return res.status(201).json(admin);
  } catch (error) {
    console.error('Create admin error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
