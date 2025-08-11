import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client'
import { events, participants, users, neighbourhoods } from '../db/schema'
import { eq, desc, and, sql } from 'drizzle-orm'
import { getSessionUserId } from '../auth'

const router = Router()

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Get all available events
 *     tags: [Events]
 *     description: Retrieve a list of all upcoming events with their details
 *     responses:
 *       200:
 *         description: List of events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get all available events
router.get('/', async (req, res) => {
  try {
    const eventList = await db.select({
      id: events.id,
      title: events.title,
      description: events.description,
      date: events.date,
      startTime: events.startTime,
      endTime: events.endTime,
      totalSpots: events.totalSpots,
      spotsRemaining: events.spotsRemaining,
      format: events.format,
      isWaitlist: events.isWaitlist,
      createdAt: events.createdAt,
      neighbourhood: neighbourhoods.name,
    }).from(events)
    .leftJoin(neighbourhoods, eq(events.neighbourhoodId, neighbourhoods.id))
    .where(sql`${events.date} >= CURRENT_DATE`)
    .orderBy(desc(events.date))

    res.json(eventList)
  } catch (error) {
    console.error('Error fetching events:', error)
    res.status(500).json({ error: 'Failed to fetch events' })
  }
})

// Register for an event
const registerSchema = z.object({
  eventId: z.number(),
  coursePreference: z.enum(['starter', 'main', 'dessert']).optional(),
  bringPartner: z.boolean(),
  partnerName: z.string().optional(),
  partnerEmail: z.string().email().optional(),
})

/**
 * @swagger
 * /api/events/register:
 *   post:
 *     summary: Register for an event
 *     tags: [Events]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - bringPartner
 *             properties:
 *               eventId:
 *                 type: integer
 *                 description: ID of the event to register for
 *                 example: 1
 *               coursePreference:
 *                 type: string
 *                 enum: [starter, main, dessert]
 *                 description: Course preference for rotating dinners
 *                 example: main
 *               bringPartner:
 *                 type: boolean
 *                 description: Whether the user is bringing a partner
 *                 example: true
 *               partnerName:
 *                 type: string
 *                 description: Partner's name (required if bringPartner is true)
 *                 example: Jane Doe
 *               partnerEmail:
 *                 type: string
 *                 format: email
 *                 description: Partner's email (required if bringPartner is true)
 *                 example: jane@example.com
 *     responses:
 *       201:
 *         description: Successfully registered for event
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Successfully registered for event
 *                 registration:
 *                   $ref: '#/components/schemas/Participant'
 *                 eventTitle:
 *                   type: string
 *                   example: Summer Rotating Dinner
 *                 eventDate:
 *                   type: string
 *                   format: date
 *                   example: 2024-09-20
 *       400:
 *         description: Bad request (event full, already registered, invalid data)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Event not found
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
router.post('/register', async (req, res) => {
  try {
    const userId = getSessionUserId(req)
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const { eventId, coursePreference, bringPartner, partnerName, partnerEmail } = registerSchema.parse(req.body)

    // Check if event exists and has available spots
    const [event] = await db.select().from(events).where(eq(events.id, eventId))
    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    if (event.spotsRemaining === 0 && !event.isWaitlist) {
      return res.status(400).json({ error: 'Event is full' })
    }

    // Check if user is already registered
    const existingRegistration = await db.select().from(participants)
      .where(and(eq(participants.eventId, eventId), eq(participants.userId, userId)))
    
    if (existingRegistration.length > 0) {
      return res.status(400).json({ error: 'Already registered for this event' })
    }

    // Validate rotating dinner requirements
    if (event.format === 'rotating') {
      if (!coursePreference) {
        return res.status(400).json({ error: 'Course preference is required for rotating dinners' })
      }
      if (!bringPartner) {
        return res.status(400).json({ error: 'Partner is required for rotating dinners' })
      }
      if (!partnerName || !partnerEmail) {
        return res.status(400).json({ error: 'Partner details are required for rotating dinners' })
      }
    }

    // Create registration
    const [registration] = await db.insert(participants).values({
      eventId,
      userId,
      coursePreference: coursePreference || null,
      courseAssigned: null, // Will be assigned during matching
      isHost: false, // Will be determined during matching
      registeredAt: new Date(),
    }).returning()

    // Update event spots
    if (!event.isWaitlist) {
      await db.update(events)
        .set({ spotsRemaining: event.spotsRemaining - 1 })
        .where(eq(events.id, eventId))
    }

    // If partner is being brought, create a guest record (simplified for now)
    if (bringPartner && partnerName && partnerEmail) {
      // In a real implementation, you might want to create a guest user or track partners differently
      console.log(`Partner registration: ${partnerName} (${partnerEmail}) for event ${eventId}`)
    }

    res.status(201).json({
      message: 'Successfully registered for event',
      registration,
      eventTitle: event.title,
      eventDate: event.date,
    })

  } catch (error) {
    console.error('Error registering for event:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.flatten() })
    }
    res.status(500).json({ error: 'Failed to register for event' })
  }
})

/**
 * @swagger
 * /api/events/my-events:
 *   get:
 *     summary: Get user's registered events
 *     tags: [Events]
 *     security:
 *       - sessionAuth: []
 *     description: Retrieve all events that the current user has registered for
 *     responses:
 *       200:
 *         description: User's events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   title:
 *                     type: string
 *                     example: Summer Rotating Dinner
 *                   description:
 *                     type: string
 *                     example: Join us for a delightful rotating dinner experience
 *                   date:
 *                     type: string
 *                     format: date
 *                     example: 2024-09-20
 *                   startTime:
 *                     type: string
 *                     example: 18:00
 *                   endTime:
 *                     type: string
 *                     example: 22:00
 *                   format:
 *                     type: string
 *                     enum: [rotating, hosted]
 *                     example: rotating
 *                   neighbourhood:
 *                     type: string
 *                     example: Downtown District
 *                   coursePreference:
 *                     type: string
 *                     enum: [starter, main, dessert]
 *                     example: main
 *                   courseAssigned:
 *                     type: string
 *                     enum: [starter, main, dessert]
 *                     example: main
 *                   isHost:
 *                     type: boolean
 *                     example: true
 *                   registeredAt:
 *                     type: string
 *                     format: date-time
 *       401:
 *         description: Authentication required
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
// Get user's registered events
router.get('/my-events', async (req, res) => {
  try {
    const userId = getSessionUserId(req)
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const userEvents = await db.select({
      id: events.id,
      title: events.title,
      description: events.description,
      date: events.date,
      startTime: events.startTime,
      endTime: events.endTime,
      format: events.format,
      neighbourhood: neighbourhoods.name,
      coursePreference: participants.coursePreference,
      courseAssigned: participants.courseAssigned,
      isHost: participants.isHost,
      registeredAt: participants.registeredAt,
    }).from(participants)
    .innerJoin(events, eq(participants.eventId, events.id))
    .leftJoin(neighbourhoods, eq(events.neighbourhoodId, neighbourhoods.id))
    .where(eq(participants.userId, userId))
    .orderBy(desc(events.date))

    res.json(userEvents)
  } catch (error) {
    console.error('Error fetching user events:', error)
    res.status(500).json({ error: 'Failed to fetch user events' })
  }
})

export default router


