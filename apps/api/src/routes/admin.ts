import { Router } from 'express'
import { z } from 'zod'
import { db } from '../db/client'
import { users, events, participants, neighbourhoods, testimonials, userPoints, pointTransactions } from '../db/schema'
import { eq, desc, asc, count, sql, and, gte, lte } from 'drizzle-orm'
import bcrypt from 'bcrypt'
import { requireAdmin } from '../middleware/admin'

const router = Router()

// Apply admin middleware to all routes
router.use(requireAdmin)

/**
 * @swagger
 * /api/admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
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
 *           default: 20
 *         description: Number of users per page
 *         example: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name, email, or username
 *         example: john
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin]
 *         description: Filter by user role
 *         example: user
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 100
 *                     pages:
 *                       type: integer
 *                       example: 5
 *       403:
 *         description: Admin access required
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
// User Management
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const search = req.query.search as string
    const role = req.query.role as string
    
    const offset = (page - 1) * limit
    
    let whereClause = undefined
    if (search) {
      whereClause = sql`(${users.name} ILIKE ${`%${search}%`} OR ${users.email} ILIKE ${`%${search}%`} OR ${users.username} ILIKE ${`%${search}%`})`
    }
    if (role) {
      whereClause = whereClause ? and(whereClause, eq(users.role, role)) : eq(users.role, role)
    }
    
    const [userCount] = await db.select({ count: count() }).from(users).where(whereClause || sql`1=1`)
    const userList = await db.select({
      id: users.id,
      username: users.username,
      email: users.email,
      name: users.name,
      role: users.role,
      neighbourhood: users.neighbourhood,
      createdAt: users.createdAt,
    }).from(users).where(whereClause || sql`1=1`).orderBy(desc(users.createdAt)).limit(limit).offset(offset)
    
    res.json({
      users: userList,
      pagination: {
        page,
        limit,
        total: userCount.count,
        pages: Math.ceil(userCount.count / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    res.status(500).json({ error: 'Failed to fetch users' })
  }
})

/**
 * @swagger
 * /api/admin/users/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *         example: 1
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 stats:
 *                   type: object
 *                   properties:
 *                     eventsAttended:
 *                       type: integer
 *                       example: 5
 *                     testimonials:
 *                       type: integer
 *                       example: 2
 *                     points:
 *                       type: integer
 *                       example: 150
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin access required
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
router.get('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    
    if (!user.length) {
      return res.status(404).json({ error: 'User not found' })
    }
    
    // Get user stats
    const [participantCount] = await db.select({ count: count() }).from(participants).where(eq(participants.userId, userId))
    const [testimonialCount] = await db.select({ count: count() }).from(testimonials).where(eq(testimonials.userId, userId))
    const [pointsData] = await db.select().from(userPoints).where(eq(userPoints.userId, userId))
    
    res.json({
      user: user[0],
      stats: {
        eventsAttended: participantCount.count,
        testimonials: testimonialCount.count,
        points: pointsData?.points || 0
      }
    })
  } catch (error) {
    console.error('Error fetching user:', error)
    res.status(500).json({ error: 'Failed to fetch user' })
  }
})

/**
 * @swagger
 * /api/admin/users/{id}:
 *   put:
 *     summary: Update user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: User ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 description: User role
 *                 example: user
 *               name:
 *                 type: string
 *                 description: User's full name
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email
 *                 example: john@example.com
 *               neighbourhood:
 *                 type: string
 *                 description: User's neighbourhood
 *                 example: Downtown District
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User updated successfully
 *       403:
 *         description: Admin access required
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
router.put('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id)
    const { role, name, email, neighbourhood } = req.body
    
    const updateData: any = {}
    if (role) updateData.role = role
    if (name) updateData.name = name
    if (email) updateData.email = email
    if (neighbourhood) updateData.neighbourhood = neighbourhood
    
    await db.update(users).set(updateData).where(eq(users.id, userId))
    
    res.json({ message: 'User updated successfully' })
  } catch (error) {
    console.error('Error updating user:', error)
    res.status(500).json({ error: 'Failed to update user' })
  }
})

/**
 * @swagger
 * /api/admin/events:
 *   get:
 *     summary: Get all events (Admin only)
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
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
 *           default: 20
 *         description: Number of events per page
 *         example: 20
 *       - in: query
 *         name: neighbourhoodId
 *         schema:
 *           type: integer
 *         description: Filter by neighbourhood ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                       example: 1
 *                     limit:
 *                       type: integer
 *                       example: 20
 *                     total:
 *                       type: integer
 *                       example: 50
 *                     pages:
 *                       type: integer
 *                       example: 3
 *       403:
 *         description: Admin access required
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
// Event Management
router.get('/events', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1
    const limit = parseInt(req.query.limit as string) || 20
    const neighbourhoodId = req.query.neighbourhoodId ? parseInt(req.query.neighbourhoodId as string) : undefined
    
    const offset = (page - 1) * limit
    
    let whereClause = undefined
    if (neighbourhoodId) {
      whereClause = eq(events.neighbourhoodId, neighbourhoodId)
    }
    
    const [eventCount] = await db.select({ count: count() }).from(events).where(whereClause || sql`1=1`)
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
      createdAt: events.createdAt,
      neighbourhood: neighbourhoods.name,
    }).from(events).leftJoin(neighbourhoods, eq(events.neighbourhoodId, neighbourhoods.id)).where(whereClause || sql`1=1`).orderBy(desc(events.date)).limit(limit).offset(offset)
    
    res.json({
      events: eventList,
      pagination: {
        page,
        limit,
        total: eventCount.count,
        pages: Math.ceil(eventCount.count / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching events:', error)
    res.status(500).json({ error: 'Failed to fetch events' })
  }
})

/**
 * @swagger
 * /api/admin/events:
 *   post:
 *     summary: Create a new event (Admin only)
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - neighbourhoodId
 *               - date
 *               - startTime
 *               - endTime
 *               - totalSpots
 *               - format
 *             properties:
 *               title:
 *                 type: string
 *                 description: Event title
 *                 example: Summer Rotating Dinner
 *               description:
 *                 type: string
 *                 description: Event description
 *                 example: Join us for a delightful rotating dinner experience
 *               neighbourhoodId:
 *                 type: integer
 *                 description: Neighbourhood ID
 *                 example: 1
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Event date
 *                 example: 2024-09-20
 *               startTime:
 *                 type: string
 *                 description: Event start time
 *                 example: 18:00
 *               endTime:
 *                 type: string
 *                 description: Event end time
 *                 example: 22:00
 *               totalSpots:
 *                 type: integer
 *                 description: Total number of spots available
 *                 example: 12
 *               format:
 *                 type: string
 *                 enum: [rotating, hosted]
 *                 description: Event format
 *                 example: rotating
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Event created successfully
 *                 event:
 *                   $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin access required
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
router.post('/events', async (req, res) => {
  try {
    const { title, description, neighbourhoodId, date, startTime, endTime, totalSpots, format } = req.body
    
    const [newEvent] = await db.insert(events).values({
      title,
      description,
      neighbourhoodId,
      date,
      startTime,
      endTime,
      totalSpots,
      spotsRemaining: totalSpots,
      format,
    }).returning()
    
    res.status(201).json(newEvent)
  } catch (error) {
    console.error('Error creating event:', error)
    res.status(500).json({ error: 'Failed to create event' })
  }
})

/**
 * @swagger
 * /api/admin/events/{id}:
 *   put:
 *     summary: Update an event (Admin only)
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Event title
 *                 example: Updated Summer Rotating Dinner
 *               description:
 *                 type: string
 *                 description: Event description
 *                 example: Updated event description
 *               neighbourhoodId:
 *                 type: integer
 *                 description: Neighbourhood ID
 *                 example: 1
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Event date
 *                 example: 2024-09-25
 *               startTime:
 *                 type: string
 *                 description: Event start time
 *                 example: 19:00
 *               endTime:
 *                 type: string
 *                 description: Event end time
 *                 example: 23:00
 *               totalSpots:
 *                 type: integer
 *                 description: Total number of spots available
 *                 example: 15
 *               format:
 *                 type: string
 *                 enum: [rotating, hosted]
 *                 description: Event format
 *                 example: rotating
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Event updated successfully
 *       403:
 *         description: Admin access required
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
router.put('/events/:id', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id)
    const updateData = req.body
    
    await db.update(events).set(updateData).where(eq(events.id, eventId))
    
    res.json({ message: 'Event updated successfully' })
  } catch (error) {
    console.error('Error updating event:', error)
    res.status(500).json({ error: 'Failed to update event' })
  }
})

/**
 * @swagger
 * /api/admin/events/{id}:
 *   delete:
 *     summary: Delete an event (Admin only)
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Event deleted successfully
 *       403:
 *         description: Admin access required
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
router.delete('/events/:id', async (req, res) => {
  try {
    const eventId = parseInt(req.params.id)
    
    // Delete related records first
    await db.delete(participants).where(eq(participants.eventId, eventId))
    await db.delete(events).where(eq(events.id, eventId))
    
    res.json({ message: 'Event deleted successfully' })
  } catch (error) {
    console.error('Error deleting event:', error)
    res.status(500).json({ error: 'Failed to delete event' })
  }
})

// Analytics
/**
 * @swagger
 * /api/admin/analytics/overview:
 *   get:
 *     summary: Get platform overview analytics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     description: Retrieve high-level platform statistics and metrics
 *     responses:
 *       200:
 *         description: Analytics overview retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalUsers:
 *                   type: integer
 *                   example: 1250
 *                 totalEvents:
 *                   type: integer
 *                   example: 45
 *                 totalParticipants:
 *                   type: integer
 *                   example: 890
 *                 totalTestimonials:
 *                   type: integer
 *                   example: 234
 *                 averageRating:
 *                   type: number
 *                   format: float
 *                   example: 4.6
 *                 activeNeighbourhoods:
 *                   type: integer
 *                   example: 8
 *                 monthlyGrowth:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: integer
 *                       example: 45
 *                     events:
 *                       type: integer
 *                       example: 12
 *                     participants:
 *                       type: integer
 *                       example: 89
 *       403:
 *         description: Admin access required
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
router.get('/analytics/overview', async (req, res) => {
  try {
    const [totalUsers] = await db.select({ count: count() }).from(users)
    const [totalEvents] = await db.select({ count: count() }).from(events)
    const [totalParticipants] = await db.select({ count: count() }).from(participants)
    const [totalTestimonials] = await db.select({ count: count() }).from(testimonials)
    
    // Recent activity (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const [recentUsers] = await db.select({ count: count() }).from(users).where(gte(users.createdAt, thirtyDaysAgo))
    const [recentEvents] = await db.select({ count: count() }).from(events).where(gte(events.createdAt, thirtyDaysAgo))
    
    res.json({
      overview: {
        totalUsers: totalUsers.count,
        totalEvents: totalEvents.count,
        totalParticipants: totalParticipants.count,
        totalTestimonials: totalTestimonials.count,
        recentUsers: recentUsers.count,
        recentEvents: recentEvents.count,
      }
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    res.status(500).json({ error: 'Failed to fetch analytics' })
  }
})

/**
 * @swagger
 * /api/admin/analytics/neighbourhoods:
 *   get:
 *     summary: Get neighbourhood analytics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     description: Retrieve analytics data for all neighbourhoods
 *     responses:
 *       200:
 *         description: Neighbourhood analytics retrieved successfully
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
 *                   name:
 *                     type: string
 *                     example: Downtown District
 *                   userCount:
 *                     type: integer
 *                     example: 156
 *                   eventCount:
 *                     type: integer
 *                     example: 8
 *                   participantCount:
 *                     type: integer
 *                     example: 89
 *                   averageRating:
 *                     type: number
 *                     format: float
 *                     example: 4.7
 *                   testimonialCount:
 *                     type: integer
 *                     example: 23
 *       403:
 *         description: Admin access required
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
router.get('/analytics/neighbourhoods', async (req, res) => {
  try {
    const neighbourhoodStats = await db.select({
      id: neighbourhoods.id,
      name: neighbourhoods.name,
      city: neighbourhoods.city,
      userCount: sql<number>`COUNT(DISTINCT ${users.id})`,
      eventCount: sql<number>`COUNT(DISTINCT ${events.id})`,
      participantCount: sql<number>`COUNT(DISTINCT ${participants.id})`,
    }).from(neighbourhoods)
    .leftJoin(users, eq(users.neighbourhood, neighbourhoods.name))
    .leftJoin(events, eq(events.neighbourhoodId, neighbourhoods.id))
    .leftJoin(participants, eq(participants.eventId, events.id))
    .groupBy(neighbourhoods.id, neighbourhoods.name, neighbourhoods.city)
    .orderBy(desc(sql`COUNT(DISTINCT ${users.id})`))
    
    res.json(neighbourhoodStats)
  } catch (error) {
    console.error('Error fetching neighbourhood analytics:', error)
    res.status(500).json({ error: 'Failed to fetch neighbourhood analytics' })
  }
})

/**
 * @swagger
 * /api/admin/analytics/engagement:
 *   get:
 *     summary: Get user engagement analytics (Admin only)
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     description: Retrieve detailed user engagement metrics and trends
 *     responses:
 *       200:
 *         description: Engagement analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activeUsers:
 *                   type: object
 *                   properties:
 *                     daily:
 *                       type: integer
 *                       example: 89
 *                     weekly:
 *                       type: integer
 *                       example: 234
 *                     monthly:
 *                       type: integer
 *                       example: 567
 *                 eventParticipation:
 *                   type: object
 *                   properties:
 *                     averageParticipants:
 *                       type: number
 *                       format: float
 *                       example: 12.5
 *                     participationRate:
 *                       type: number
 *                       format: float
 *                       example: 78.3
 *                 userRetention:
 *                   type: object
 *                   properties:
 *                     firstEventRetention:
 *                       type: number
 *                       format: float
 *                       example: 85.2
 *                     repeatParticipants:
 *                       type: integer
 *                       example: 234
 *                 topEvents:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       title:
 *                         type: string
 *                         example: Summer Rotating Dinner
 *                       participantCount:
 *                         type: integer
 *                         example: 18
 *                       averageRating:
 *                         type: number
 *                         format: float
 *                         example: 4.8
 *       403:
 *         description: Admin access required
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
router.get('/analytics/engagement', async (req, res) => {
  try {
    const days = parseInt(req.query.days as string) || 30
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)
    
    // Daily user registrations
    const dailyRegistrations = await db.select({
      date: sql<string>`DATE(${users.createdAt})`,
      count: count(),
    }).from(users)
    .where(gte(users.createdAt, startDate))
    .groupBy(sql`DATE(${users.createdAt})`)
    .orderBy(asc(sql`DATE(${users.createdAt})`))
    
    // Daily event participations
    const dailyParticipations = await db.select({
      date: sql<string>`DATE(${participants.registeredAt})`,
      count: count(),
    }).from(participants)
    .where(gte(participants.registeredAt, startDate))
    .groupBy(sql`DATE(${participants.registeredAt})`)
    .orderBy(asc(sql`DATE(${participants.registeredAt})`))
    
    res.json({
      dailyRegistrations,
      dailyParticipations,
    })
  } catch (error) {
    console.error('Error fetching engagement analytics:', error)
    res.status(500).json({ error: 'Failed to fetch engagement analytics' })
  }
})

// Admin User Management
const createAdminSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2),
})

/**
 * @swagger
 * /api/admin/admins:
 *   post:
 *     summary: Create a new admin user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
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
 *               - name
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 description: Admin username
 *                 example: admin_user
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Admin email
 *                 example: admin@tablehop.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Admin password
 *                 example: securepassword123
 *               name:
 *                 type: string
 *                 description: Admin full name
 *                 example: Admin User
 *     responses:
 *       201:
 *         description: Admin user created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Admin user created successfully
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     username:
 *                       type: string
 *                       example: admin_user
 *                     email:
 *                       type: string
 *                       example: admin@tablehop.com
 *                     name:
 *                       type: string
 *                       example: Admin User
 *                     role:
 *                       type: string
 *                       example: admin
 *       400:
 *         description: Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin access required
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/admins', async (req, res) => {
  try {
    const { username, email, password, name } = createAdminSchema.parse(req.body)
    
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (existingUser.length) {
      return res.status(400).json({ error: 'User with this email already exists' })
    }
    
    const passwordHash = await bcrypt.hash(password, 10)
    
    const [newAdmin] = await db.insert(users).values({
      username,
      email,
      passwordHash,
      name,
      role: 'admin',
    }).returning({
      id: users.id,
      username: users.username,
      email: users.email,
      name: users.name,
      role: users.role,
    })
    
    res.status(201).json(newAdmin)
  } catch (error) {
    console.error('Error creating admin:', error)
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input data', details: error.flatten() })
    }
    res.status(500).json({ error: 'Failed to create admin user' })
  }
})

// Matching System
import { MatchingService } from '../services/matching'

/**
 * @swagger
 * /api/admin/matching/trigger:
 *   post:
 *     summary: Trigger matching algorithm for an event (Admin only)
 *     tags: [Admin]
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
 *             properties:
 *               eventId:
 *                 type: integer
 *                 description: ID of the event to run matching for
 *                 example: 1
 *     responses:
 *       200:
 *         description: Matching triggered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Matching algorithm triggered successfully
 *                 matchedGroups:
 *                   type: integer
 *                   example: 4
 *                 totalParticipants:
 *                   type: integer
 *                   example: 12
 *       400:
 *         description: Invalid event ID or event not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Admin access required
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
router.post('/matching/trigger', async (req, res) => {
  try {
    const { eventId } = req.body
    
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' })
    }
    
    const results = await MatchingService.triggerMatching(eventId)
    
    res.json({ 
      message: 'Matching completed successfully',
      groups: results.length,
      participants: results.reduce((total, group) => total + group.participants.length, 0)
    })
  } catch (error) {
    console.error('Error triggering matching:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to trigger matching' })
  }
})

/**
 * @swagger
 * /api/admin/matching/results/{eventId}:
 *   get:
 *     summary: Get matching results for an event (Admin only)
 *     tags: [Admin]
 *     security:
 *       - sessionAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Matching results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 event:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     title:
 *                       type: string
 *                       example: Summer Rotating Dinner
 *                     date:
 *                       type: string
 *                       format: date
 *                       example: 2024-09-20
 *                 groups:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       participants:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: integer
 *                               example: 1
 *                             name:
 *                               type: string
 *                               example: John Doe
 *                             courseAssigned:
 *                               type: string
 *                               enum: [starter, main, dessert]
 *                               example: main
 *                             isHost:
 *                               type: boolean
 *                               example: true
 *                       compatibilityScore:
 *                         type: number
 *                         format: float
 *                         example: 8.5
 *       403:
 *         description: Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Event not found or no matching results
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
router.get('/matching/results/:eventId', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId)
    
    if (!eventId) {
      return res.status(400).json({ error: 'Event ID is required' })
    }
    
    const results = await MatchingService.getMatchingResults(eventId)
    
    res.json({ results })
  } catch (error) {
    console.error('Error fetching matching results:', error)
    res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch matching results' })
  }
})

export default router
