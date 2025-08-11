import { Router } from 'express'
import { getSessionUserId } from '../auth'
import { RewardsService } from '../services/rewards'

const router = Router()

/**
 * @swagger
 * /api/rewards/points:
 *   get:
 *     summary: Get user's points and transaction history
 *     tags: [Rewards]
 *     security:
 *       - sessionAuth: []
 *     description: Retrieve the current user's points balance and transaction history
 *     responses:
 *       200:
 *         description: User points data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UserPoints'
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
// Get user's points and transaction history
router.get('/points', async (req, res) => {
  try {
    const userId = getSessionUserId(req)
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const pointsData = await RewardsService.getUserPoints(userId)
    res.json(pointsData)
  } catch (error) {
    console.error('Error fetching user points:', error)
    res.status(500).json({ error: 'Failed to fetch user points' })
  }
})

/**
 * @swagger
 * /api/rewards/badges:
 *   get:
 *     summary: Get user's earned badges
 *     tags: [Rewards]
 *     security:
 *       - sessionAuth: []
 *     description: Retrieve all badges that the current user has earned
 *     responses:
 *       200:
 *         description: User badges retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Badge'
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
// Get user's badges
router.get('/badges', async (req, res) => {
  try {
    const userId = getSessionUserId(req)
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const badges = await RewardsService.getUserBadges(userId)
    const badgeDefinitions = RewardsService.getBadgeDefinitions()
    
    // Map badges to their definitions
    const userBadges = badges.map(badge => {
      const definition = badgeDefinitions.find(def => def.id === badge.badgeType)
      return {
        ...badge,
        ...definition,
      }
    })

    res.json(userBadges)
  } catch (error) {
    console.error('Error fetching user badges:', error)
    res.status(500).json({ error: 'Failed to fetch user badges' })
  }
})

/**
 * @swagger
 * /api/rewards/badges/progress:
 *   get:
 *     summary: Get user's badge progress
 *     tags: [Rewards]
 *     security:
 *       - sessionAuth: []
 *     description: Retrieve the current user's progress towards all available badges
 *     responses:
 *       200:
 *         description: Badge progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Badge'
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
/**
 * @swagger
 * /api/rewards/badges/progress:
 *   get:
 *     summary: Get user's badge progress
 *     tags: [Rewards]
 *     security:
 *       - sessionAuth: []
 *     description: Retrieve the current user's progress towards earning badges
 *     responses:
 *       200:
 *         description: Badge progress retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Badge'
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
// Get user's badge progress
router.get('/badges/progress', async (req, res) => {
  try {
    const userId = getSessionUserId(req)
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const progress = await RewardsService.getUserBadgeProgress(userId)
    res.json(progress)
  } catch (error) {
    console.error('Error fetching badge progress:', error)
    res.status(500).json({ error: 'Failed to fetch badge progress' })
  }
})

/**
 * @swagger
 * /api/rewards/badges/definitions:
 *   get:
 *     summary: Get all badge definitions
 *     tags: [Rewards]
 *     description: Retrieve all available badge definitions and their requirements
 *     responses:
 *       200:
 *         description: Badge definitions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     example: first_host
 *                   name:
 *                     type: string
 *                     example: First Host
 *                   description:
 *                     type: string
 *                     example: Hosted your first dinner event
 *                   icon:
 *                     type: string
 *                     example: 🏠
 *                   category:
 *                     type: string
 *                     enum: [hosting, community, milestone]
 *                     example: hosting
 *                   required:
 *                     type: integer
 *                     example: 1
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get all badge definitions
router.get('/badges/definitions', async (req, res) => {
  try {
    const definitions = RewardsService.getBadgeDefinitions()
    res.json(definitions)
  } catch (error) {
    console.error('Error fetching badge definitions:', error)
    res.status(500).json({ error: 'Failed to fetch badge definitions' })
  }
})

/**
 * @swagger
 * /api/rewards/leaderboard:
 *   get:
 *     summary: Get points leaderboard
 *     tags: [Rewards]
 *     description: Retrieve the points leaderboard, optionally filtered by neighbourhood
 *     parameters:
 *       - in: query
 *         name: neighbourhoodId
 *         schema:
 *           type: integer
 *         description: Filter leaderboard by neighbourhood ID
 *         example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of users to return in leaderboard
 *         example: 10
 *     responses:
 *       200:
 *         description: Leaderboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: integer
 *                     example: 1
 *                   points:
 *                     type: integer
 *                     example: 150
 *                   totalPointsEarned:
 *                     type: integer
 *                     example: 200
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       name:
 *                         type: string
 *                         example: John Doe
 *                       username:
 *                         type: string
 *                         example: johndoe
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const neighbourhoodId = req.query.neighbourhoodId ? parseInt(req.query.neighbourhoodId as string) : undefined
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10

    const leaderboard = await RewardsService.getLeaderboard(neighbourhoodId, limit)
    res.json(leaderboard)
  } catch (error) {
    console.error('Error fetching leaderboard:', error)
    res.status(500).json({ error: 'Failed to fetch leaderboard' })
  }
})

/**
 * @swagger
 * /api/rewards/badges/check:
 *   post:
 *     summary: Manually trigger badge checking (for testing)
 *     tags: [Rewards]
 *     security:
 *       - sessionAuth: []
 *     description: Manually trigger the badge checking algorithm for the current user
 *     responses:
 *       200:
 *         description: Badge check completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: New badges awarded!
 *                 badges:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: first_host
 *                       name:
 *                         type: string
 *                         example: First Host
 *                       description:
 *                         type: string
 *                         example: Hosted your first dinner event
 *                       icon:
 *                         type: string
 *                         example: 🏠
 *                 count:
 *                   type: integer
 *                   example: 2
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
// Manually trigger badge checking (for testing)
router.post('/badges/check', async (req, res) => {
  try {
    const userId = getSessionUserId(req)
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const awardedBadges = await RewardsService.checkAndAwardBadges(userId)
    
    if (awardedBadges.length > 0) {
      res.json({
        message: 'New badges awarded!',
        badges: awardedBadges,
        count: awardedBadges.length
      })
    } else {
      res.json({
        message: 'No new badges to award',
        badges: [],
        count: 0
      })
    }
  } catch (error) {
    console.error('Error checking badges:', error)
    res.status(500).json({ error: 'Failed to check badges' })
  }
})

export default router
