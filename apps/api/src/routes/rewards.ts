import express from 'express';
import { db } from '../db/client';
import { requireAuth } from '../auth';
import { userBadges } from '../db/schema';

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
 * /api/rewards/badges/progress:
 *   get:
 *     summary: Get user's badge progress
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User's badge progress
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   category:
 *                     type: string
 *                   earned:
 *                     type: boolean
 *                   progress:
 *                     type: integer
 *                   requirements:
 *                     type: integer
 *       401:
 *         description: Unauthorized
 */
router.get('/badges/progress', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Define available badges
    const availableBadges = [
      {
        id: 'first_host',
        name: 'First Host',
        description: 'Host your first dinner event',
        category: 'hosting',
        requirements: 1,
      },
      {
        id: 'great_guest',
        name: 'Great Guest',
        description: 'Attend 5 dinner events',
        category: 'community',
        requirements: 5,
      },
      {
        id: 'connector',
        name: 'Community Connector',
        description: 'Attend 10 dinner events',
        category: 'community',
        requirements: 10,
      },
      {
        id: 'rotating_master',
        name: 'Rotating Master',
        description: 'Participate in 3 rotating dinners',
        category: 'hosting',
        requirements: 3,
      },
      {
        id: 'neighbourhood_champion',
        name: 'Neighbourhood Champion',
        description: 'Host 5 dinner events',
        category: 'hosting',
        requirements: 5,
      },
    ];

    // Get user's earned badges
    const userBadges = await db.query.userBadges.findMany({
      where: (ub, { eq }) => eq(ub.userId, user.userId),
    });

    // Get user's event participation stats
    const userEvents = await db.query.participants.findMany({
      where: (p, { eq }) => eq(p.userId, user.userId),
      with: {
        event: true,
      },
    });

    // Calculate progress for each badge
    const badgeProgress = availableBadges.map(badge => {
      const earned = userBadges.some(ub => ub.badgeType === badge.id);
      
      let progress = 0;
      switch (badge.id) {
        case 'first_host':
          progress = userEvents.filter(p => p.isHost).length;
          break;
        case 'great_guest':
        case 'connector':
          progress = userEvents.length;
          break;
        case 'rotating_master':
          progress = userEvents.filter(p => p.event.format === 'rotating').length;
          break;
        case 'neighbourhood_champion':
          progress = userEvents.filter(p => p.isHost).length;
          break;
        default:
          progress = 0;
      }

      return {
        ...badge,
        earned,
        progress: Math.min(progress, badge.requirements),
      };
    });

    return res.json(badgeProgress);
  } catch (error) {
    console.error('Get badge progress error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/rewards/badges/check:
 *   post:
 *     summary: Check for new badges to award
 *     tags: [Rewards]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Badge check result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                   description: Number of new badges awarded
 *       401:
 *         description: Unauthorized
 */
router.post('/badges/check', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    
    // Get user's current badges
    const userBadgesResult = await db.query.userBadges.findMany({
      where: (ub, { eq }) => eq(ub.userId, user.userId),
    });

    // Get user's event participation stats
    const userEvents = await db.query.participants.findMany({
      where: (p, { eq }) => eq(p.userId, user.userId),
      with: {
        event: true,
      },
    });

    const earnedBadgeTypes = userBadgesResult.map(ub => ub.badgeType);
    const newBadges = [];

    // Check for first_host badge
    if (!earnedBadgeTypes.includes('first_host') && userEvents.filter(p => p.isHost).length >= 1) {
      await db.insert(userBadges).values({
        userId: user.userId,
        badgeType: 'first_host',
      });
      newBadges.push('first_host');
    }

    // Check for great_guest badge
    if (!earnedBadgeTypes.includes('great_guest') && userEvents.length >= 5) {
      await db.insert(userBadges).values({
        userId: user.userId,
        badgeType: 'great_guest',
      });
      newBadges.push('great_guest');
    }

    // Check for connector badge
    if (!earnedBadgeTypes.includes('connector') && userEvents.length >= 10) {
      await db.insert(userBadges).values({
        userId: user.userId,
        badgeType: 'connector',
      });
      newBadges.push('connector');
    }

    // Check for rotating_master badge
    if (!earnedBadgeTypes.includes('rotating_master') && userEvents.filter(p => p.event.format === 'rotating').length >= 3) {
      await db.insert(userBadges).values({
        userId: user.userId,
        badgeType: 'rotating_master',
      });
      newBadges.push('rotating_master');
    }

    // Check for neighbourhood_champion badge
    if (!earnedBadgeTypes.includes('neighbourhood_champion') && userEvents.filter(p => p.isHost).length >= 5) {
      await db.insert(userBadges).values({
        userId: user.userId,
        badgeType: 'neighbourhood_champion',
      });
      newBadges.push('neighbourhood_champion');
    }

    return res.json({ count: newBadges.length });
  } catch (error) {
    console.error('Check badges error:', error);
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
