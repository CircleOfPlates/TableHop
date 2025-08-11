import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client'
import { eventRatings, testimonials, participants, users, events } from '../db/schema'
import { eq, and, desc, count, sql } from 'drizzle-orm'
import { getSessionUserId } from '../auth'

const router = Router()

/**
 * @swagger
 * /api/ratings:
 *   post:
 *     summary: Submit a rating/review for an event
 *     tags: [Ratings]
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
 *               - overallRating
 *               - review
 *               - favoriteMemory
 *               - wouldRecommend
 *             properties:
 *               eventId:
 *                 type: integer
 *                 description: ID of the event being rated
 *                 example: 1
 *               ratedUserId:
 *                 type: integer
 *                 description: ID of the user being rated (optional for general event ratings)
 *                 example: 2
 *               overallRating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Overall rating from 1-5
 *                 example: 5
 *               foodQuality:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Food quality rating from 1-5
 *                 example: 5
 *               hostExperience:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Host experience rating from 1-5
 *                 example: 5
 *               socialConnection:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Social connection rating from 1-5
 *                 example: 4
 *               review:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 1000
 *                 description: Detailed review of the experience
 *                 example: Amazing experience! Great food and company.
 *               favoriteMemory:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 500
 *                 description: Favorite memory from the event
 *                 example: The dessert course was incredible!
 *               wouldRecommend:
 *                 type: boolean
 *                 description: Whether the user would recommend this experience
 *                 example: true
 *               isHostRating:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this is rating a host
 *                 example: false
 *               isGuestRating:
 *                 type: boolean
 *                 default: false
 *                 description: Whether this is rating a guest
 *                 example: true
 *     responses:
 *       201:
 *         description: Rating submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Rating submitted successfully
 *                 rating:
 *                   $ref: '#/components/schemas/Rating'
 *       400:
 *         description: Invalid input data
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
 *       403:
 *         description: Must participate in event to rate it
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Already rated this event
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

// Rating submission schema
const ratingSchema = z.object({
  eventId: z.number(),
  ratedUserId: z.number().optional(), // Optional for general event ratings
  overallRating: z.number().min(1).max(5),
  foodQuality: z.number().min(1).max(5).optional(),
  hostExperience: z.number().min(1).max(5).optional(),
  socialConnection: z.number().min(1).max(5).optional(),
  review: z.string().min(10).max(1000),
  favoriteMemory: z.string().min(10).max(500),
  wouldRecommend: z.boolean(),
  isHostRating: z.boolean().default(false),
  isGuestRating: z.boolean().default(false),
})

// Submit a rating/review
router.post('/', async (req, res) => {
  try {
    const userId = getSessionUserId(req)
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const ratingData = ratingSchema.parse(req.body)

    // Check if user participated in the event
    const participation = await db.select().from(participants)
      .where(and(eq(participants.eventId, ratingData.eventId), eq(participants.userId, userId)))
    
    if (!participation.length) {
      return res.status(403).json({ error: 'You must participate in an event to rate it' })
    }

    // Check if user has already rated this event
    const existingRating = await db.select().from(eventRatings)
      .where(and(
        eq(eventRatings.eventId, ratingData.eventId),
        eq(eventRatings.raterId, userId),
        ratingData.ratedUserId ? eq(eventRatings.ratedUserId, ratingData.ratedUserId) : sql`1=1`
      ))

    if (existingRating.length > 0) {
      return res.status(409).json({ error: 'You have already rated this event' })
    }

    // Create the rating
    const [rating] = await db.insert(eventRatings).values({
      eventId: ratingData.eventId,
      raterId: userId,
      ratedUserId: ratingData.ratedUserId || null,
      overallRating: ratingData.overallRating,
      foodQuality: ratingData.foodQuality || null,
      hostExperience: ratingData.hostExperience || null,
      socialConnection: ratingData.socialConnection || null,
      review: ratingData.review,
      favoriteMemory: ratingData.favoriteMemory,
      wouldRecommend: ratingData.wouldRecommend,
      isHostRating: ratingData.isHostRating,
      isGuestRating: ratingData.isGuestRating,
    }).returning()

    res.status(201).json({
      message: 'Rating submitted successfully',
      rating
    })

  } catch (error) {
    console.error('Error submitting rating:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.flatten() })
    }
    res.status(500).json({ error: 'Failed to submit rating' })
  }
})

/**
 * @swagger
 * /api/ratings/event/{eventId}:
 *   get:
 *     summary: Get ratings for a specific event
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the event
 *         example: 1
 *     responses:
 *       200:
 *         description: Event ratings retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ratings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Rating'
 *                 summary:
 *                   type: object
 *                   properties:
 *                     avgOverall:
 *                       type: number
 *                       format: float
 *                       example: 4.5
 *                     avgFoodQuality:
 *                       type: number
 *                       format: float
 *                       example: 4.3
 *                     avgHostExperience:
 *                       type: number
 *                       format: float
 *                       example: 4.7
 *                     avgSocialConnection:
 *                       type: number
 *                       format: float
 *                       example: 4.2
 *                     totalRatings:
 *                       type: integer
 *                       example: 12
 *                     recommendationRate:
 *                       type: number
 *                       format: float
 *                       example: 91.7
 *       400:
 *         description: Invalid event ID
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
// Get ratings for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId)
    
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' })
    }

    const ratings = await db.select({
      id: eventRatings.id,
      overallRating: eventRatings.overallRating,
      foodQuality: eventRatings.foodQuality,
      hostExperience: eventRatings.hostExperience,
      socialConnection: eventRatings.socialConnection,
      review: eventRatings.review,
      favoriteMemory: eventRatings.favoriteMemory,
      wouldRecommend: eventRatings.wouldRecommend,
      isHostRating: eventRatings.isHostRating,
      isGuestRating: eventRatings.isGuestRating,
      createdAt: eventRatings.createdAt,
      rater: {
        id: users.id,
        name: users.name,
      },
      ratedUser: {
        id: users.id,
        name: users.name,
      },
    }).from(eventRatings)
    .innerJoin(users, eq(eventRatings.raterId, users.id))
    .leftJoin(users, eq(eventRatings.ratedUserId, users.id))
    .where(eq(eventRatings.eventId, eventId))
    .orderBy(desc(eventRatings.createdAt))

    // Calculate average ratings
    const avgRatings = await db.select({
      avgOverall: sql<number>`AVG(${eventRatings.overallRating})`,
      avgFoodQuality: sql<number>`AVG(${eventRatings.foodQuality})`,
      avgHostExperience: sql<number>`AVG(${eventRatings.hostExperience})`,
      avgSocialConnection: sql<number>`AVG(${eventRatings.socialConnection})`,
      totalRatings: count(),
      recommendationRate: sql<number>`AVG(CASE WHEN ${eventRatings.wouldRecommend} THEN 1 ELSE 0 END) * 100`,
    }).from(eventRatings)
    .where(eq(eventRatings.eventId, eventId))

    res.json({
      ratings,
      summary: avgRatings[0]
    })

  } catch (error) {
    console.error('Error fetching event ratings:', error)
    res.status(500).json({ error: 'Failed to fetch event ratings' })
  }
})

/**
 * @swagger
 * /api/ratings/my-ratings:
 *   get:
 *     summary: Get current user's ratings
 *     tags: [Ratings]
 *     security:
 *       - sessionAuth: []
 *     description: Retrieve all ratings submitted by the current user
 *     responses:
 *       200:
 *         description: User ratings retrieved successfully
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
 *                   eventId:
 *                     type: integer
 *                     example: 1
 *                   overallRating:
 *                     type: integer
 *                     example: 5
 *                   review:
 *                     type: string
 *                     example: Amazing experience! Great food and company.
 *                   favoriteMemory:
 *                     type: string
 *                     example: The dessert course was incredible!
 *                   wouldRecommend:
 *                     type: boolean
 *                     example: true
 *                   isHostRating:
 *                     type: boolean
 *                     example: false
 *                   isGuestRating:
 *                     type: boolean
 *                     example: true
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   event:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       title:
 *                         type: string
 *                         example: Summer Rotating Dinner
 *                       date:
 *                         type: string
 *                         format: date
 *                         example: 2024-09-20
 *                   ratedUser:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 2
 *                       name:
 *                         type: string
 *                         example: Jane Doe
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
// Get user's ratings
router.get('/my-ratings', async (req, res) => {
  try {
    const userId = getSessionUserId(req)
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const ratings = await db.select({
      id: eventRatings.id,
      eventId: eventRatings.eventId,
      overallRating: eventRatings.overallRating,
      review: eventRatings.review,
      favoriteMemory: eventRatings.favoriteMemory,
      wouldRecommend: eventRatings.wouldRecommend,
      isHostRating: eventRatings.isHostRating,
      isGuestRating: eventRatings.isGuestRating,
      createdAt: eventRatings.createdAt,
      event: {
        id: events.id,
        title: events.title,
        date: events.date,
      },
      ratedUser: {
        id: users.id,
        name: users.name,
      },
    }).from(eventRatings)
    .innerJoin(events, eq(eventRatings.eventId, events.id))
    .leftJoin(users, eq(eventRatings.ratedUserId, users.id))
    .where(eq(eventRatings.raterId, userId))
    .orderBy(desc(eventRatings.createdAt))

    res.json(ratings)

  } catch (error) {
    console.error('Error fetching user ratings:', error)
    res.status(500).json({ error: 'Failed to fetch user ratings' })
  }
})

// Testimonials
const testimonialSchema = z.object({
  content: z.string().min(20).max(1000),
  rating: z.number().min(1).max(5),
  neighbourhoodId: z.number().optional(),
})

/**
 * @swagger
 * /api/ratings/testimonials:
 *   post:
 *     summary: Submit a testimonial
 *     tags: [Ratings]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - rating
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 20
 *                 maxLength: 1000
 *                 description: Testimonial content
 *                 example: TableHop has completely transformed my social life! I've met amazing people and had incredible dining experiences.
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Overall rating for the platform
 *                 example: 5
 *               neighbourhoodId:
 *                 type: integer
 *                 description: Optional neighbourhood ID to associate with the testimonial
 *                 example: 1
 *     responses:
 *       201:
 *         description: Testimonial submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Testimonial submitted successfully
 *                 testimonial:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     userId:
 *                       type: integer
 *                       example: 1
 *                     content:
 *                       type: string
 *                       example: TableHop has completely transformed my social life!
 *                     rating:
 *                       type: integer
 *                       example: 5
 *                     neighbourhoodId:
 *                       type: integer
 *                       nullable: true
 *                       example: 1
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input data
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
 *       409:
 *         description: Testimonial already submitted
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
// Submit a testimonial
router.post('/testimonials', async (req, res) => {
  try {
    const userId = getSessionUserId(req)
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const testimonialData = testimonialSchema.parse(req.body)

    // Check if user has already submitted a testimonial
    const existingTestimonial = await db.select().from(testimonials)
      .where(eq(testimonials.userId, userId))

    if (existingTestimonial.length > 0) {
      return res.status(409).json({ error: 'You have already submitted a testimonial' })
    }

    // Create the testimonial
    const [testimonial] = await db.insert(testimonials).values({
      userId,
      content: testimonialData.content,
      rating: testimonialData.rating,
      neighbourhoodId: testimonialData.neighbourhoodId || null,
    }).returning()

    res.status(201).json({
      message: 'Testimonial submitted successfully',
      testimonial
    })

  } catch (error) {
    console.error('Error submitting testimonial:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.flatten() })
    }
    res.status(500).json({ error: 'Failed to submit testimonial' })
  }
})

/**
 * @swagger
 * /api/ratings/testimonials:
 *   get:
 *     summary: Get all testimonials
 *     tags: [Ratings]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of testimonials per page
 *         example: 10
 *       - in: query
 *         name: neighbourhoodId
 *         schema:
 *           type: integer
 *         description: Filter by neighbourhood ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Testimonials retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 testimonials:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       content:
 *                         type: string
 *                         example: TableHop has completely transformed my social life!
 *                       rating:
 *                         type: integer
 *                         example: 5
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 1
 *                           name:
 *                             type: string
 *                             example: John Doe
 *                           neighbourhood:
 *                             type: string
 *                             example: Downtown District
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 10
 *                     total:
 *                       type: integer
 *                       example: 25
 *                     pages:
 *                       type: integer
 *                       example: 3
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get all testimonials
router.get('/testimonials', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 10
    const neighbourhoodId = req.query.neighbourhoodId ? parseInt(req.query.neighbourhoodId as string) : undefined
    
    const offset = (page - 1) * limit

    let whereClause = undefined
    if (neighbourhoodId) {
      whereClause = eq(testimonials.neighbourhoodId, neighbourhoodId)
    }

    const [testimonialCount] = await db.select({ count: count() }).from(testimonials).where(whereClause || sql`1=1`)
    
    const testimonialList = await db.select({
      id: testimonials.id,
      content: testimonials.content,
      rating: testimonials.rating,
      createdAt: testimonials.createdAt,
      user: {
        id: users.id,
        name: users.name,
      },
    }).from(testimonials)
    .innerJoin(users, eq(testimonials.userId, users.id))
    .where(whereClause || sql`1=1`)
    .orderBy(desc(testimonials.createdAt))
    .limit(limit)
    .offset(offset)

    res.json({
      testimonials: testimonialList,
      pagination: {
        page,
        limit,
        total: testimonialCount.count,
        pages: Math.ceil(testimonialCount.count / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching testimonials:', error)
    res.status(500).json({ error: 'Failed to fetch testimonials' })
  }
})

/**
 * @swagger
 * /api/ratings/testimonials/my:
 *   get:
 *     summary: Get current user's testimonial
 *     tags: [Ratings]
 *     security:
 *       - sessionAuth: []
 *     description: Retrieve the current user's submitted testimonial
 *     responses:
 *       200:
 *         description: User testimonial retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     content:
 *                       type: string
 *                       example: TableHop has completely transformed my social life!
 *                     rating:
 *                       type: integer
 *                       example: 5
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                 - type: null
 *                   description: No testimonial submitted yet
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
// Get user's testimonial
router.get('/testimonials/my', async (req, res) => {
  try {
    const userId = getSessionUserId(req)
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const testimonial = await db.select({
      id: testimonials.id,
      content: testimonials.content,
      rating: testimonials.rating,
      createdAt: testimonials.createdAt,
    }).from(testimonials)
    .where(eq(testimonials.userId, userId))
    .limit(1)

    res.json(testimonial[0] || null)

  } catch (error) {
    console.error('Error fetching user testimonial:', error)
    res.status(500).json({ error: 'Failed to fetch user testimonial' })
  }
})

export default router
