import express from 'express';
import { z } from 'zod';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getCurrentUser, requireAuth } from '../auth';

const router = express.Router();

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  bio: z.string().optional(),
  neighbourhood: z.string().optional(),
  dietaryRestrictions: z.string().optional(),
  interests: z.array(z.string()).optional(),
  dateOfBirth: z.string().optional(),
  personalityType: z.enum(['extrovert', 'introvert', 'ambivert']).optional(),
  cookingExperience: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  preferredGroupSize: z.enum(['small', 'medium', 'large']).optional(),
  socialPreferences: z.array(z.string()).optional(),
});

/**
 * @swagger
 * /api/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 address:
 *                   type: string
 *                 bio:
 *                   type: string
 *                 neighbourhood:
 *                   type: string
 *                 dietaryRestrictions:
 *                   type: string
 *                 interests:
 *                   type: array
 *                   items:
 *                     type: string
 *                 dateOfBirth:
 *                   type: string
 *                 personalityType:
 *                   type: string
 *                   enum: [extrovert, introvert, ambivert]
 *                 cookingExperience:
 *                   type: string
 *                   enum: [beginner, intermediate, advanced]
 *                 preferredGroupSize:
 *                   type: string
 *                   enum: [small, medium, large]
 *                 socialPreferences:
 *                   type: array
 *                   items:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.get('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const profile = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.id, user.userId),
    });

    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.json(profile);
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               bio:
 *                 type: string
 *               neighbourhood:
 *                 type: string
 *               dietaryRestrictions:
 *                 type: string
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *               dateOfBirth:
 *                 type: string
 *               personalityType:
 *                 type: string
 *                 enum: [extrovert, introvert, ambivert]
 *               cookingExperience:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *               preferredGroupSize:
 *                 type: string
 *                 enum: [small, medium, large]
 *               socialPreferences:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Profile not found
 */
router.put('/', requireAuth, async (req, res) => {
  try {
    const user = (req as any).user;
    const parsed = updateProfileSchema.safeParse(req.body);
    
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.flatten() });
    }

    const [updated] = await db
      .update(users)
      .set(parsed.data)
      .where(eq(users.id, user.userId))
      .returning();

    if (!updated) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    return res.json(updated);
  } catch (error) {
    console.error('Update profile error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


