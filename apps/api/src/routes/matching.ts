import express from 'express';
import { z } from 'zod';
import { db } from '../db/client';
import { matchingPool, events } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { requireAuth, requireAdmin, getCurrentUser } from '../auth';
import { MatchingService } from '../services/matching';
import { MATCHING_CONFIG } from '../config/constants';

const router = express.Router();

// Schema for opt-in request
const optInSchema = z.object({
  partnerId: z.number().optional(),
  matchAddress: z.string().optional(),
  hostingAvailable: z.boolean().default(false),
});

// Schema for opt-out request
const optOutSchema = z.object({
  // No additional fields needed for opt-out
});

/**
 * @swagger
 * /api/matching/opt-in/{eventId}:
 *   post:
 *     summary: Opt in to matching for an event
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID to opt in for
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               partnerId:
 *                 type: integer
 *                 description: Partner's user ID (optional)
 *               matchAddress:
 *                 type: string
 *                 description: Address for matching (optional)
 *               hostingAvailable:
 *                 type: boolean
 *                 description: Whether user can host

 *     responses:
 *       200:
 *         description: Successfully opted in
 *       400:
 *         description: Invalid input or already opted in
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */
router.post('/opt-in/:eventId', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const eventId = parseInt(req.params.eventId);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    const parsed = optInSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    // Check if event exists and is open for matching
    const event = await db.query.events.findFirst({
      where: (e, { eq }) => eq(e.id, eventId),
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (event.matchingStatus !== 'open') {
      return res.status(400).json({ error: 'Event is not open for matching' });
    }

    // Check if user is already opted in
    const existingOptIn = await db.query.matchingPool.findFirst({
      where: (mp, { and, eq }) => and(
        eq(mp.eventId, eventId),
        eq(mp.userId, user.userId)
      ),
    });

    if (existingOptIn) {
      return res.status(400).json({ error: 'Already opted in for this event' });
    }

    // If partner is specified, validate partner exists and create opt-in for partner too
    if (parsed.data.partnerId) {
      const partner = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.id, parsed.data.partnerId!),
      });

      if (!partner) {
        return res.status(400).json({ error: 'Partner not found' });
      }

      // Check if partner is already opted in
      const partnerOptIn = await db.query.matchingPool.findFirst({
        where: (mp, { and, eq }) => and(
          eq(mp.eventId, eventId),
          eq(mp.userId, parsed.data.partnerId!)
        ),
      });

      if (partnerOptIn) {
        return res.status(400).json({ error: 'Partner is already opted in for this event' });
      }

      // Create opt-in for partner
      await db.insert(matchingPool).values({
        eventId,
        userId: parsed.data.partnerId!,
        partnerId: user.userId, // Link back to main user
        matchAddress: parsed.data.matchAddress,
        hostingAvailable: false, // Partner doesn't host by default
      });
    }

    // Create opt-in for main user
    const [optIn] = await db.insert(matchingPool).values({
      eventId,
      userId: user.userId,
      partnerId: parsed.data.partnerId || null,
      matchAddress: parsed.data.matchAddress,
      hostingAvailable: parsed.data.hostingAvailable,
    }).returning();

    return res.json({
      message: 'Successfully opted in for matching',
      optIn,
    });
  } catch (error) {
    console.error('Opt-in error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/matching/opt-out/{eventId}:
 *   post:
 *     summary: Opt out of matching for an event
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID to opt out from
 *     responses:
 *       200:
 *         description: Successfully opted out
 *       400:
 *         description: Invalid input or not opted in
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */
router.post('/opt-out/:eventId', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const eventId = parseInt(req.params.eventId);
    
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

    // Find user's opt-in
    const optIn = await db.query.matchingPool.findFirst({
      where: (mp, { and, eq }) => and(
        eq(mp.eventId, eventId),
        eq(mp.userId, user.userId)
      ),
    });

    if (!optIn) {
      return res.status(400).json({ error: 'Not opted in for this event' });
    }

    // Remove opt-in
    await db.delete(matchingPool).where(and(
      eq(matchingPool.eventId, eventId),
      eq(matchingPool.userId, user.userId)
    ));

    // If user had a partner, update partner's opt-in to remove the partnership
    if (optIn.partnerId) {
      await db.update(matchingPool)
        .set({ partnerId: null })
        .where(and(
          eq(matchingPool.eventId, eventId),
          eq(matchingPool.userId, optIn.partnerId)
        ));
    }

    return res.json({
      message: 'Successfully opted out of matching',
    });
  } catch (error) {
    console.error('Opt-out error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/matching/status/{eventId}:
 *   get:
 *     summary: Get matching status for an event
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Matching status
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */
router.get('/status/:eventId', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const eventId = parseInt(req.params.eventId);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    // Get event details
    const event = await db.query.events.findFirst({
      where: (e, { eq }) => eq(e.id, eventId),
    });

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user is opted in
    const isOptedIn = await MatchingService.isUserOptedIn(eventId, user.userId);

    // Get user's circle if matched
    const userCircle = event.matchingStatus === 'closed' 
      ? await MatchingService.getUserCircle(eventId, user.userId)
      : null;

    // Get matching pool count (admin only)
    let poolCount = null;
    if (user.role === 'admin') {
      const pool = await MatchingService.getMatchingPool(eventId);
      poolCount = pool.length;
    }

    return res.json({
      eventId,
      matchingStatus: event.matchingStatus,
      matchingTriggeredAt: event.matchingTriggeredAt,
      matchingCompletedAt: event.matchingCompletedAt,
      isOptedIn,
      userCircle,
      poolCount,
    });
  } catch (error) {
    console.error('Get matching status error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/matching/trigger/{eventId}:
 *   post:
 *     summary: Trigger matching for an event (admin only)
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID to trigger matching for
 *     responses:
 *       200:
 *         description: Matching completed successfully
 *       400:
 *         description: Invalid input or insufficient participants
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Event not found
 */
router.post('/trigger/:eventId', requireAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    // Trigger matching
    const circles = await MatchingService.triggerMatching(eventId);

    return res.json({
      message: 'Matching completed successfully',
      circles,
    });
  } catch (error) {
    console.error('Trigger matching error:', error);
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/matching/results/{eventId}:
 *   get:
 *     summary: Get matching results for an event
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Matching results
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Event not found
 */
router.get('/results/:eventId', requireAuth, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    // Get matching results
    const circles = await MatchingService.getMatchingResults(eventId);

    return res.json({
      eventId,
      circles,
    });
  } catch (error) {
    console.error('Get matching results error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/matching/pool/{eventId}:
 *   get:
 *     summary: Get matching pool for an event (admin only)
 *     tags: [Matching]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Matching pool
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 *       404:
 *         description: Event not found
 */
router.get('/pool/:eventId', requireAdmin, async (req, res) => {
  try {
    const eventId = parseInt(req.params.eventId);
    
    if (isNaN(eventId)) {
      return res.status(400).json({ error: 'Invalid event ID' });
    }

    // Get matching pool
    const pool = await MatchingService.getMatchingPool(eventId);

    return res.json({
      eventId,
      pool,
    });
  } catch (error) {
    console.error('Get matching pool error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

