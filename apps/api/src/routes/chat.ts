import { Router } from 'express';
import { db } from '../db/client';
import { chatMessages, circles, circleMembers } from '../db/schema';
import { requireAuth } from '../auth';
import { and, eq, desc } from 'drizzle-orm';

const router = Router();

/**
 * @swagger
 * /api/chat/circles/{circleId}/messages:
 *   get:
 *     summary: Get chat messages for a specific circle
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: circleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the circle
 *     responses:
 *       200:
 *         description: List of chat messages for the circle
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   message:
 *                     type: string
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *                   user:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: User is not a member of this circle
 */
router.get('/circles/:circleId/messages', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const circleId = parseInt(req.params.circleId);

    // Check if user is a member of this circle
    const isMember = await db.query.circleMembers.findFirst({
      where: (cm, { and, eq }) => and(
        eq(cm.circleId, circleId),
        eq(cm.userId, user.userId)
      ),
    });

    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this circle' });
    }

    // Get chat messages for the circle
    const messages = await db.query.chatMessages.findMany({
      where: (cm, { eq }) => eq(cm.circleId, circleId),
      with: {
        user: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [desc(chatMessages.createdAt)],
      limit: 100, // Limit to last 100 messages
    });

    return res.json(messages);
  } catch (error) {
    console.error('Get chat messages error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/chat/circles/{circleId}/messages:
 *   post:
 *     summary: Send a message to a circle chat
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: circleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the circle
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: The message content
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *       400:
 *         description: Invalid message content
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: User is not a member of this circle
 */
router.post('/circles/:circleId/messages', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const circleId = parseInt(req.params.circleId);
    const { message } = req.body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    if (message.length > 1000) {
      return res.status(400).json({ error: 'Message is too long (max 1000 characters)' });
    }

    // Check if user is a member of this circle
    const isMember = await db.query.circleMembers.findFirst({
      where: (cm, { and, eq }) => and(
        eq(cm.circleId, circleId),
        eq(cm.userId, user.userId)
      ),
    });

    if (!isMember) {
      return res.status(403).json({ error: 'You are not a member of this circle' });
    }

    // Create the chat message
    const [newMessage] = await db.insert(chatMessages).values({
      circleId,
      userId: user.userId,
      message: message.trim(),
    }).returning({
      id: chatMessages.id,
      message: chatMessages.message,
      createdAt: chatMessages.createdAt,
    });

    // Get the user info for the response
    const userInfo = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, user.userId),
      columns: {
        id: true,
        name: true,
      },
    });

    const responseMessage = {
      ...newMessage,
      user: userInfo,
    };

    return res.status(201).json(responseMessage);
  } catch (error) {
    console.error('Send chat message error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
