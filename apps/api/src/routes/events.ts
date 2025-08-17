import express from 'express';
import { z } from 'zod';
import { db } from '../db/client';
import { events, participants } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { getCurrentUser, requireAuth } from '../auth';

const router = express.Router();

const createEventSchema = z.object({
  title: z.string().min(1),
  description: z.string(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  neighbourhoodId: z.number(),
  format: z.enum(['rotating', 'hosted']),
  totalSpots: z.number().min(2),
  hostId: z.number(),
});

const joinEventSchema = z.object({
  eventId: z.number(),
  coursePreference: z.enum(['starter', 'main', 'dessert']).optional(),
  isHost: z.boolean().default(false),
});

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 */
router.get('/', async (req, res) => {
  try {
    const allEvents = await db.query.events.findMany({
      orderBy: [desc(events.date)],
    });
    return res.json(allEvents);
  } catch (error) {
    console.error('Get events error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Event details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 */
router.get('/:id', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    
    // Validate that eventId is a valid number
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }
    
    const event = await db.query.events.findFirst({
      where: (e, { eq }) => eq(e.id, eventId),
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    return res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - date
 *               - startTime
 *               - endTime
 *               - neighbourhoodId
 *               - format
 *               - totalSpots
 *               - hostId
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               startTime:
 *                 type: string
 *               endTime:
 *                 type: string
 *               neighbourhoodId:
 *                 type: integer
 *               format:
 *                 type: string
 *                 enum: [rotating, hosted]
 *               totalSpots:
 *                 type: integer
 *               hostId:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Event created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const parsed = createEventSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const [event] = await db.insert(events).values({
      ...parsed.data,
      spotsRemaining: parsed.data.totalSpots,
    }).returning();
    return res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/events/{id}/join:
 *   post:
 *     summary: Join an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *             properties:
 *               eventId:
 *                 type: integer
 *               coursePreference:
 *                 type: string
 *                 enum: [starter, main, dessert]
 *               isHost:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Successfully joined event
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */
router.post('/:id/join', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const eventId = parseInt(req.params.id);
    
    // Validate that eventId is a valid number
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }
    
    const parsed = joinEventSchema.safeParse({ ...req.body, eventId });
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    // Check if event exists
    const event = await db.query.events.findFirst({
      where: (e, { eq }) => eq(e.id, eventId),
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user is already participating
    const existingParticipation = await db.query.participants.findFirst({
      where: (p, { and, eq }) => and(eq(p.eventId, eventId), eq(p.userId, user.userId)),
    });

    if (existingParticipation) {
      return res.status(400).json({ error: 'Already participating in this event' });
    }

    // Join the event
    const [participation] = await db.insert(participants).values({
      eventId,
      userId: user.userId,
      coursePreference: parsed.data.coursePreference,
      isHost: parsed.data.isHost,
    }).returning();

    return res.json(participation);
  } catch (error) {
    console.error('Join event error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/events/{id}/participants:
 *   get:
 *     summary: Get event participants
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of participants
 *       404:
 *         description: Event not found
 */
router.get('/:id/participants', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id);
    
    // Validate that eventId is a valid number
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }
    
    const participantsList = await db.query.participants.findMany({
      where: (p, { eq }) => eq(p.eventId, eventId),
      with: {
        user: true,
      },
    });

    return res.json(participantsList);
  } catch (error) {
    console.error('Get participants error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


