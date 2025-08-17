import express from 'express';
import { db } from '../db/client';
import { requireAuth } from '../auth';

const router = express.Router();

/**
 * @swagger
 * /api/rewards/points:
 *   get:
 *     summary: Get user's points and badges
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's points and badges
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 points:
 *                   type: integer
 *                   example: 1250
 *                 totalPoints:
 *                   type: integer
 *                   example: 2500
 *                 badges:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       badgeType:
 *                         type: string
 *                       awardedAt:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/points', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Get user's points
    const userPoints = await db.query.userPoints.findFirst({
      where: (up, { eq }) => eq(up.userId, user.userId),
    });

    // Get user's badges
    const userBadges = await db.query.userBadges.findMany({
      where: (ub, { eq }) => eq(ub.userId, user.userId),
    });

    return res.json({
      points: userPoints?.points || 0,
      totalPoints: userPoints?.totalPointsEarned || 0,
      badges: userBadges.map(ub => ({
        id: ub.id,
        badgeType: ub.badgeType,
        awardedAt: ub.awardedAt,
      })),
    });
  } catch (error) {
    console.error('Get rewards error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/rewards/leaderboard:
 *   get:
 *     summary: Get neighbourhood leaderboard
 *     tags: [Rewards]
 *     parameters:
 *       - in: query
 *         name: neighbourhoodId
 *         schema:
 *           type: integer
 *         description: Neighbourhood ID to filter by
 *     responses:
 *       200:
 *         description: Leaderboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   rank:
 *                     type: integer
 *                   userId:
 *                     type: integer
 *                   username:
 *                     type: string
 *                   points:
 *                     type: integer
 *                   badges:
 *                     type: integer
 */
router.get('/leaderboard', async (req, res) => {
  try {
    // Get leaderboard data
    const leaderboard = await db.query.userPoints.findMany({
      orderBy: (up, { desc }) => [desc(up.points)],
      limit: 20,
    });

    // Add rank and badge count
    const leaderboardWithRank = await Promise.all(
      leaderboard.map(async (entry, index) => {
        const badgeCount = await db.query.userBadges.findMany({
          where: (ub, { eq }) => eq(ub.userId, entry.userId),
        });

        return {
          rank: index + 1,
          userId: entry.userId,
          points: entry.points,
          badges: badgeCount.length,
        };
      })
    );

    return res.json(leaderboardWithRank);
  } catch (error) {
    console.error('Get leaderboard error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
