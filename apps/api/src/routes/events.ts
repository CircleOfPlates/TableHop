import express from 'express';
import { z } from 'zod';
import { db } from '../db/client';
import { events, users } from '../db/schema';
import { eq, and, desc, sql } from 'drizzle-orm';
import { getCurrentUser, requireAuth } from '../auth';

const router = express.Router();

const createEventSchema = z.object({
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
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
 *       401:
 *         description: Unauthorized
 */
router.get('/my-events', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Get user's circles for events
    const userCircles = await db.query.circleMembers.findMany({
      where: (cm, { eq }) => eq(cm.userId, user.userId),
      with: {
        circle: {
          with: {
            event: true,
          },
        },
      },
    });

    const eventsWithCircles = userCircles.map(circleMember => ({
      id: circleMember.circle.event.id,
      title: `Dinner Event - ${new Date(circleMember.circle.event.date).toLocaleDateString()}`,
      description: `Join us for dinner on ${new Date(circleMember.circle.event.date).toLocaleDateString()} from ${circleMember.circle.event.startTime} to ${circleMember.circle.event.endTime}`,
      date: circleMember.circle.event.date,
      startTime: circleMember.circle.event.startTime,
      endTime: circleMember.circle.event.endTime,
      format: circleMember.circle.format,
      neighbourhood: 'TBD', // Will be determined by matching
      role: circleMember.role,
      circleName: circleMember.circle.name,
      createdAt: circleMember.circle.event.createdAt,
    }));

    return res.json(eventsWithCircles);
  } catch (error) {
    console.error('Get my events error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/events/my-opted-in:
 *   get:
 *     summary: Get events the current user has opted in for but hasn't been matched yet
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of events user has opted in for
 *       401:
 *         description: Unauthorized
 */
router.get('/my-opted-in', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Get events user has opted in for
    const optedInEvents = await db.query.matchingPool.findMany({
      where: (mp, { eq }) => eq(mp.userId, user.userId),
      with: {
        event: true,
      },
    });

    // Filter to only include future events that are still open for matching
    const futureOptedInEvents = optedInEvents
      .filter(optIn => {
        const eventDate = new Date(optIn.event.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        return eventDate > today && optIn.event.matchingStatus === 'open';
      })
      .map(optIn => ({
        id: optIn.event.id,
        date: optIn.event.date,
        startTime: optIn.event.startTime,
        endTime: optIn.event.endTime,
        matchingStatus: optIn.event.matchingStatus,
        createdAt: optIn.event.createdAt,
      }));

    return res.json(futureOptedInEvents);
  } catch (error) {
    console.error('Get my opted-in events error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/events/my-past-events:
 *   get:
 *     summary: Get current user's past events with highlights
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's past events with highlights
 *       401:
 *         description: Unauthorized
 */
router.get('/my-past-events', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Get user's circles for past events
    const userCircles = await db.query.circleMembers.findMany({
      where: (cm, { eq }) => eq(cm.userId, user.userId),
      with: {
        circle: {
          with: {
            event: true,
            members: {
              with: {
                user: true,
              },
            },
          },
        },
      },
    });

    // Filter to only include past events and transform the data
    const pastEvents = userCircles
      .filter(circleMember => {
        const eventDate = new Date(circleMember.circle.event.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate < today;
      })
      .map(async (circleMember) => {
        // Get user's rating for this event
        const rating = await db.query.eventRatings.findFirst({
          where: (er, { and, eq }) => and(
            eq(er.eventId, circleMember.circle.event.id),
            eq(er.raterId, user.userId)
          ),
        });

        // Get user's testimonial for this event (testimonials don't have eventId, so we'll skip this for now)
        const testimonial = null;

        // Get points earned for this event
        const pointsTransaction = await db.query.pointTransactions.findFirst({
          where: (pt, { and, eq }) => and(
            eq(pt.eventId, circleMember.circle.event.id),
            eq(pt.userId, user.userId)
          ),
        });

        // Get badges earned for this event (userBadges don't have eventId, so we'll skip this for now)
        const badges: string[] = [];

        return {
          id: circleMember.circle.event.id,
          date: circleMember.circle.event.date,
          startTime: circleMember.circle.event.startTime,
          endTime: circleMember.circle.event.endTime,
          circle: {
            id: circleMember.circle.id,
            name: circleMember.circle.name,
            format: circleMember.circle.format,
            members: circleMember.circle.members.map(member => ({
              userId: member.userId,
              role: member.role,
              user: {
                id: member.user.id,
                name: member.user.name,
                interests: member.user.interests,
                dietaryRestrictions: member.user.dietaryRestrictions,
                cookingExperience: member.user.cookingExperience,
                personalityType: member.user.personalityType,
                socialPreferences: member.user.socialPreferences,
              },
            })),
          },
          highlights: {
            rating: rating?.overallRating || null,
            testimonial: testimonial || null,
            pointsEarned: pointsTransaction?.pointsEarned || 0,
            badgesEarned: badges,
          },
        };
      });

    const pastEventsWithHighlights = await Promise.all(pastEvents);

    return res.json(pastEventsWithHighlights);
  } catch (error) {
    console.error('Get my past events error:', error);
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
 */
router.get('/', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today
    
    const upcomingEvents = await db.query.events.findMany({
      where: (e, { gte }) => gte(e.date, today.toISOString().split('T')[0]),
      orderBy: [events.date],
      with: {
        matchingPool: true,
        circles: true,
      },
    });

    // Transform events for the new matching system
    const eventsWithSpots = upcomingEvents.map(event => ({
      id: event.id,
      title: `Dinner Event - ${new Date(event.date).toLocaleDateString()}`,
      description: `Join us for dinner on ${new Date(event.date).toLocaleDateString()} from ${event.startTime} to ${event.endTime}`,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      totalSpots: 0, // No longer relevant in matching system
      spotsRemaining: 0, // No longer relevant in matching system
      format: 'matching', // All events are now matching-based
      neighbourhood: 'TBD', // Will be determined by matching
      isWaitlist: false, // No longer relevant in matching system
      createdAt: event.createdAt,
      matchingStatus: event.matchingStatus,
      optInCount: event.matchingPool.length,
      circleCount: event.circles.length,
    }));

    return res.json(eventsWithSpots);
  } catch (error) {
    console.error('Get events error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/events/my-matched-events:
 *   get:
 *     summary: Get current user's matched events with circle details
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's matched events with circle information
 *       401:
 *         description: Unauthorized
 */
router.get('/my-matched-events', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Get user's circles for future events
    const userCircles = await db.query.circleMembers.findMany({
      where: (cm, { eq }) => eq(cm.userId, user.userId),
      with: {
        circle: {
          with: {
            event: true,
            members: {
              with: {
                user: true,
              },
            },
          },
        },
      },
    });

    // Filter to only include future events and transform the data
    const futureMatchedEvents = userCircles
      .filter(circleMember => {
        const eventDate = new Date(circleMember.circle.event.date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return eventDate > today;
      })
      .map(circleMember => ({
        id: circleMember.circle.event.id,
        date: circleMember.circle.event.date,
        startTime: circleMember.circle.event.startTime,
        endTime: circleMember.circle.event.endTime,
        circle: {
          id: circleMember.circle.id,
          name: circleMember.circle.name,
          format: circleMember.circle.format,
          members: circleMember.circle.members.map(member => ({
            userId: member.userId,
            role: member.role,
            user: {
              id: member.user.id,
              name: member.user.name,
              interests: member.user.interests,
              dietaryRestrictions: member.user.dietaryRestrictions,
              cookingExperience: member.user.cookingExperience,
              personalityType: member.user.personalityType,
              socialPreferences: member.user.socialPreferences,
            },
          })),
        },
      }));

    return res.json(futureMatchedEvents);
  } catch (error) {
    console.error('Get my matched events error:', error);
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

    // Check if user is opted in for this event
    const optIn = await db.query.matchingPool.findFirst({
      where: (mp, { and, eq }) => and(eq(mp.eventId, eventId), eq(mp.userId, user.userId)),
    });

    if (!optIn) {
      return res.json(null); // Return null instead of 404
    }

    // Get partner information if exists
    let partnerName = null;
    if (optIn.partnerId) {
      const partner = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, optIn.partnerId!),
        columns: {
          name: true,
        },
      });
      partnerName = partner?.name || null;
    }

    return res.json({
      id: optIn.id,
      eventId: optIn.eventId,
      userId: optIn.userId,
      matchAddress: optIn.matchAddress,
      hostingAvailable: optIn.hostingAvailable,
      createdAt: optIn.createdAt,
      partnerId: optIn.partnerId,
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
        matchingPool: true,
        circles: true,
      },
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Transform the response for the new matching system
    const eventWithDetails = {
      id: event.id,
      title: `Dinner Event - ${new Date(event.date).toLocaleDateString()}`,
      description: `Join us for dinner on ${new Date(event.date).toLocaleDateString()} from ${event.startTime} to ${event.endTime}`,
      date: event.date,
      startTime: event.startTime,
      endTime: event.endTime,
      format: 'matching', // All events are now matching-based
      neighbourhood: 'TBD', // Will be determined by matching
      totalSpots: 0, // No longer relevant in matching system
      spotsRemaining: 0, // No longer relevant in matching system
      createdAt: event.createdAt,
      matchingStatus: event.matchingStatus,
      optInCount: event.matchingPool.length,
      circleCount: event.circles.length,
    };

    return res.json(eventWithDetails);
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

    // This endpoint is deprecated - use the matching system instead
    return res.status(400).json({ 
      error: 'This endpoint is deprecated. Please use the matching system to opt-in to events.' 
    });
  } catch (error) {
    console.error('Join event error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// These endpoints are deprecated - use the matching system instead

export default router;


