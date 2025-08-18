import express from 'express';
import { z } from 'zod';
import { db } from '../db/client';
import { events, participants } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
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
  partnerId: z.number().optional(),
});

/**
 * @swagger
 * /api/events/my-events:
 *   get:
 *     summary: Get current user's events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   title:
 *                     type: string
 *                   date:
 *                     type: string
 *                     format: date
 *                   startTime:
 *                     type: string
 *                   endTime:
 *                     type: string
 *                   format:
 *                     type: string
 *                     enum: [rotating, hosted]
 *                   neighbourhood:
 *                     type: string
 *                   coursePreference:
 *                     type: string
 *                   isHost:
 *                     type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get('/my-events', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    
    const userEvents = await db.query.participants.findMany({
      where: (p, { eq }) => eq(p.userId, user.userId),
      with: {
        event: {
          with: {
            neighbourhood: true,
          },
        },
      },
    });

    // Get partner information for events that have partners
    const eventsWithPartners = await Promise.all(
      userEvents.map(async (participation) => {
        let partnerName = null;
        
        if (participation.partnerId) {
          const partner = await db.query.users.findFirst({
            where: (u, { eq }) => eq(u.id, participation.partnerId!),
            columns: {
              name: true,
            },
          });
          partnerName = partner?.name || null;
        }

        return {
          id: participation.event.id,
          title: participation.event.title,
          description: participation.event.description,
          date: participation.event.date,
          startTime: participation.event.startTime,
          endTime: participation.event.endTime,
          format: participation.event.format,
          neighbourhood: participation.event.neighbourhood.name,
          coursePreference: participation.coursePreference,
          isHost: participation.isHost,
          registeredAt: participation.registeredAt,
          partnerId: participation.partnerId,
          partnerName,
        };
      })
    );

    return res.json(eventsWithPartners);
  } catch (error) {
    console.error('Get my events error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/events/partners/search:
 *   get:
 *     summary: Search for potential partners
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for partner name or username
 *     responses:
 *       200:
 *         description: List of potential partners
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   username:
 *                     type: string
 */
router.get('/partners/search', async (req, res) => {
  try {
    const query = req.query.q as string;
    
    if (!query || query.trim().length < 2) {
      return res.json([]);
    }

    const searchTerm = `%${query.trim()}%`;
    
    const potentialPartners = await db.query.users.findMany({
      where: (u, { or, like }) => 
        or(
          like(u.name, searchTerm),
          like(u.username, searchTerm)
        ),
      columns: {
        id: true,
        name: true,
        username: true,
      },
      limit: 10,
    });

    return res.json(potentialPartners);
  } catch (error) {
    console.error('Partner search error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get upcoming events
 *     tags: [Events]
 *     responses:
 *       200:
 *         description: List of upcoming events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 */
router.get('/', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const upcomingEvents = await db.query.events.findMany({
      where: (e, { gte }) => gte(e.date, today.toISOString().split('T')[0]),
      orderBy: [events.date],
      with: {
        neighbourhood: true,
        participants: true,
      },
    });

    // Calculate spotsRemaining for each event
    const eventsWithSpots = upcomingEvents.map(event => ({
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      totalSpots: event.totalSpots,
      spotsRemaining: Math.max(0, event.totalSpots - event.participants.length),
      format: event.format,
      neighbourhood: event.neighbourhood.name,
      isWaitlist: event.isWaitlist,
      createdAt: event.createdAt,
    }));

    return res.json(eventsWithSpots);
  } catch (error) {
    console.error('Get events error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/events/{id}/my-participation:
 *   get:
 *     summary: Get current user's participation details for an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: User's participation details
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/my-participation', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const eventId = parseInt(req.params.id);
    
    // Validate that eventId is a valid number
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    // Check if user is participating in this event
    const participation = await db.query.participants.findFirst({
      where: (p, { and, eq }) => and(eq(p.eventId, eventId), eq(p.userId, user.userId)),
    });

    if (!participation) {
      return res.json(null); // Return null instead of 404
    }

    // Get partner information if exists
    let partnerName = null;
    if (participation.partnerId) {
      const partner = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, participation.partnerId!),
        columns: {
          name: true,
        },
      });
      partnerName = partner?.name || null;
    }

    return res.json({
      id: participation.id,
      eventId: participation.eventId,
      userId: participation.userId,
      coursePreference: participation.coursePreference,
      isHost: participation.isHost,
      registeredAt: participation.registeredAt,
      partnerId: participation.partnerId,
      partnerName,
    });
  } catch (error) {
    console.error('Get my participation error:', error);
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
      with: {
        neighbourhood: true,
        participants: true,
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Transform the response to include neighbourhood name and calculated spotsRemaining
    const eventWithNeighbourhood = {
      id: event.id,
      title: event.title,
      description: event.description,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      format: event.format,
      neighbourhood: event.neighbourhood.name,
      totalSpots: event.totalSpots,
      spotsRemaining: Math.max(0, event.totalSpots - event.participants.length),
      createdAt: event.createdAt,
    };

    return res.json(eventWithNeighbourhood);
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

    // Validate partner requirements for rotating dinners
    if (event.format === 'rotating') {
      // For rotating dinners, partner is required
      if (!parsed.data.partnerId) {
        return res.status(400).json({ 
          error: 'Partner is required for rotating dinners. Please provide partner details.' 
        });
      }
      
      // Course preference is required for rotating dinners
      if (!parsed.data.coursePreference) {
        return res.status(400).json({ 
          error: 'Course preference is required for rotating dinners. Please select your preferred course to host.' 
        });
      }
    }

    // Check available space before joining
    const currentParticipants = await db.query.participants.findMany({
      where: (p, { eq }) => eq(p.eventId, eventId),
    });

    const spotsNeeded = parsed.data.partnerId ? 2 : 1; // Need 2 spots if bringing a partner
    const availableSpots = event.totalSpots - currentParticipants.length;

    if (availableSpots < spotsNeeded) {
      return res.status(400).json({ 
        error: `Not enough spots available. Need ${spotsNeeded} spot(s), but only ${availableSpots} available.` 
      });
    }

    // Join the event
    const [participation] = await db.insert(participants).values({
      eventId,
      userId: user.userId,
      coursePreference: parsed.data.coursePreference,
      isHost: parsed.data.isHost,
      partnerId: parsed.data.partnerId,
    }).returning();

    // If a partner is specified, also register the partner for the event
    if (parsed.data.partnerId) {
      // Check if partner is already participating
      const partnerParticipation = await db.query.participants.findFirst({
        where: (p, { and, eq }) => and(eq(p.eventId, eventId), eq(p.userId, parsed.data.partnerId!)),
      });

      if (!partnerParticipation) {
        // Register the partner
        await db.insert(participants).values({
          eventId,
          userId: parsed.data.partnerId!,
          coursePreference: parsed.data.coursePreference, // Partner gets same course preference
          isHost: false, // Partner is not a host by default
          partnerId: user.userId, // Link back to the main user
        });
      }
    }

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

/**
 * @swagger
 * /api/events/{id}/leave:
 *   delete:
 *     summary: Leave an event (opt out)
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Successfully left the event
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event or participation not found
 */
router.delete('/:id/leave', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const eventId = parseInt(req.params.id);
    
    // Validate that eventId is a valid number
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    // Check if event exists
    const event = await db.query.events.findFirst({
      where: (e, { eq }) => eq(e.id, eventId),
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user is participating in this event
    const participation = await db.query.participants.findFirst({
      where: (p, { and, eq }) => and(eq(p.eventId, eventId), eq(p.userId, user.userId)),
    });

    if (!participation) {
      return res.status(404).json({ error: 'You are not participating in this event' });
    }

    // Get partner information before removing participation
    const partnerId = participation.partnerId;

    // Remove the user's participation
    await db.delete(participants).where(
      and(
        eq(participants.eventId, eventId),
        eq(participants.userId, user.userId)
      )
    );

    // If user had a partner, also remove the partner's participation
    if (partnerId) {
      await db.delete(participants).where(
        and(
          eq(participants.eventId, eventId),
          eq(participants.userId, partnerId)
        )
      );
    }

    // No need to update spotsRemaining since it's calculated dynamically

    return res.json({ 
      message: 'Successfully left the event',
      partnerRemoved: !!partnerId 
    });
  } catch (error) {
    console.error('Leave event error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


