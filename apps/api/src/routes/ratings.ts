import express from 'express';
import { z } from 'zod';
import { db } from '../db/client';
import { eventRatings } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth } from '../auth';

const router = express.Router();

const createRatingSchema = z.object({
  eventId: z.number(),
  overallRating: z.number().min(1).max(5),
  foodQuality: z.number().min(1).max(5),
  hostExperience: z.number().min(1).max(5),
  socialConnection: z.number().min(1).max(5),
  review: z.string().optional(),
  favoriteMemory: z.string().optional(),
  wouldRecommend: z.boolean(),
});

/**
 * @swagger
 * /api/ratings:
 *   post:
 *     summary: Create a rating for an event
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - eventId
 *               - overallRating
 *               - foodQuality
 *               - hostExperience
 *               - socialConnection
 *               - wouldRecommend
 *             properties:
 *               eventId:
 *                 type: integer
 *               overallRating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               foodQuality:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               hostExperience:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               socialConnection:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *               review:
 *                 type: string
 *               favoriteMemory:
 *                 type: string
 *               wouldRecommend:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Rating created successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 */
router.post('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const parsed = createRatingSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    // Check if user has already rated this event
    const existingRating = await db.query.eventRatings.findFirst({
      where: (r, { and, eq }) => and(eq(r.eventId, parsed.data.eventId), eq(r.raterId, user.userId)),
    });

    if (existingRating) {
      return res.status(400).json({ error: 'You have already rated this event' });
    }

    const [rating] = await db.insert(eventRatings).values({
      ...parsed.data,
      raterId: user.userId,
    }).returning();

    return res.status(201).json(rating);
  } catch (error) {
    console.error('Create rating error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

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
 *     responses:
 *       200:
 *         description: List of ratings for the event
 *       404:
 *         description: Event not found
 */
router.get('/event/:eventId', async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    // Validate that eventId is a valid number
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }
    
    const eventRatingsList = await db.query.eventRatings.findMany({
      where: (r, { eq }) => eq(r.eventId, eventId),
      with: {
        rater: {
          columns: {
            id: true,
            username: true,
          },
        },
      },
    });

    return res.json(eventRatingsList);
  } catch (error) {
    console.error('Get event ratings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/ratings/user:
 *   get:
 *     summary: Get current user's ratings
 *     tags: [Ratings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's ratings
 *       401:
 *         description: Unauthorized
 */
router.get('/user', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    
    const userRatings = await db.query.eventRatings.findMany({
      where: (r, { eq }) => eq(r.raterId, user.userId),
      with: {
        event: true,
      },
    });

    return res.json(userRatings);
  } catch (error) {
    console.error('Get user ratings error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
