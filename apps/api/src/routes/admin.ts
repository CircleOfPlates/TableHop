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
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by role
 *     responses:
 *       200:
 *         description: List of users with pagination
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/users', requireAdmin, async (req, res) => {
  try {
    const { page = 1, search = '', role = '' } = req.query;
    
    // Build the query with filters
    let query = db.query.users.findMany({
      columns: {
        id: true,
        username: true,
        email: true,
        name: true,
        role: true,
        neighbourhood: true,
        createdAt: true,
      },
      orderBy: [desc(users.createdAt)],
    });

    // Apply filters if provided
    let allUsers = await query;
    
    // Filter by role if specified
    if (role && role !== '') {
      allUsers = allUsers.filter(user => user.role === role);
    }
    
    // Filter by search term if specified
    if (search && search !== '') {
      const searchTerm = search.toString().toLowerCase();
      allUsers = allUsers.filter(user => 
        user.username?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm) ||
        user.name?.toLowerCase().includes(searchTerm)
      );
    }

    return res.json({
      users: allUsers,
      pagination: {
        page: Number(page),
        limit: allUsers.length,
        total: allUsers.length,
        pages: 1,
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user details by ID (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/users/:id', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get user statistics
    const [participantCount] = await db.select({
      count: count(participants.id),
    }).from(participants).where(eq(participants.userId, userId));

    // For now, return basic user info with placeholder stats
    // TODO: Implement actual points and badges calculation
    const userDetail = {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      role: user.role,
      neighbourhood: user.neighbourhood,
      createdAt: user.createdAt,
      eventsParticipated: participantCount.count,
      totalPoints: 0, // TODO: Calculate from points table
      badgesEarned: 0, // TODO: Calculate from badges table
    };

    return res.json(userDetail);
  } catch (error) {
    console.error('Get user detail error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user details (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               role:
 *                 type: string
 *               neighbourhood:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.put('/users/:id', requireAdmin, async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update user with provided fields
    const updateData: any = {};
    if (req.body.name !== undefined) updateData.name = req.body.name;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.username !== undefined) updateData.username = req.body.username;
    if (req.body.role !== undefined) updateData.role = req.body.role;
    if (req.body.neighbourhood !== undefined) updateData.neighbourhood = req.body.neighbourhood;

    const [updatedUser] = await db.update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        role: users.role,
        neighbourhood: users.neighbourhood,
        createdAt: users.createdAt,
      });

    return res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
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
      spotsRemaining: Math.max(0, event.totalSpots - event.participants.length),
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
 * /api/admin/events/{id}:
 *   get:
 *     summary: Get event details by ID (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event details
 *       404:
 *         description: Event not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.get('/events/:id', requireAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
      with: {
        neighbourhood: true,
        participants: {
          with: {
            user: {
              columns: {
                id: true,
                username: true,
                name: true,
                email: true,
              },
            },
            partner: {
              columns: {
                id: true,
                username: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const eventDetail = {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      totalSpots: event.totalSpots,
      spotsRemaining: Math.max(0, event.totalSpots - event.participants.length),
      format: event.format,
      neighbourhood: event.neighbourhood?.name || 'Unknown',
      createdAt: event.createdAt,
      participants: event.participants.map(p => ({
        id: p.id,
        userId: p.userId,
        user: p.user,
        partnerId: p.partnerId,
        partner: p.partner,
        coursePreference: p.coursePreference,
        createdAt: p.registeredAt,
      })),
    };

    return res.json(eventDetail);
  } catch (error) {
    console.error('Get event detail error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/events/{id}:
 *   put:
 *     summary: Update event details (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               totalSpots:
 *                 type: integer
 *               format:
 *                 type: string
 *               neighbourhoodId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       404:
 *         description: Event not found
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.put('/events/:id', requireAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Update event with provided fields
    const updateData: any = {};
    if (req.body.title !== undefined) updateData.title = req.body.title;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.date !== undefined) updateData.date = req.body.date;
    if (req.body.startTime !== undefined) updateData.startTime = req.body.startTime;
    if (req.body.endTime !== undefined) updateData.endTime = req.body.endTime;
    if (req.body.totalSpots !== undefined) updateData.totalSpots = req.body.totalSpots;
    if (req.body.format !== undefined) updateData.format = req.body.format;
    if (req.body.neighbourhoodId !== undefined) updateData.neighbourhoodId = req.body.neighbourhoodId;

    const [updatedEvent] = await db.update(events)
      .set(updateData)
      .where(eq(events.id, eventId))
      .returning({
        id: events.id,
        title: events.title,
        description: events.description,
        date: events.date,
        startTime: events.startTime,
        endTime: events.endTime,
        totalSpots: events.totalSpots,
        format: events.format,
        neighbourhoodId: events.neighbourhoodId,
        createdAt: events.createdAt,
      });

    return res.json(updatedEvent);
  } catch (error) {
    console.error('Update event error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/admin/events/{id}:
 *   delete:
 *     summary: Delete event (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       404:
 *         description: Event not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.delete('/events/:id', requireAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const event = await db.query.events.findFirst({
      where: eq(events.id, eventId),
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Delete all participants first (due to foreign key constraint)
    await db.delete(participants).where(eq(participants.eventId, eventId));
    
    // Delete the event
    await db.delete(events).where(eq(events.id, eventId));

    return res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
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
