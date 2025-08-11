import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/client';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { getSessionUserId, requireAuth } from '../auth';

const router = Router();

const profileSchema = z.object({
  name: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  address: z.string().optional(),
  neighbourhood: z.string().optional(),
  bio: z.string().optional(),
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
 *     summary: Get current user's profile
 *     tags: [Profile]
 *     security:
 *       - sessionAuth: []
 *     description: Retrieve the current user's profile information
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
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
router.get('/', requireAuth, async (req, res) => {
  const userId = getSessionUserId(req)!;
  const user = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, userId) });
  if (!user) return res.status(404).json({ error: 'Not found' });
  const { passwordHash, ...safe } = user as any;
  res.json(safe);
});

/**
 * @swagger
 * /api/profile:
 *   put:
 *     summary: Update current user's profile
 *     tags: [Profile]
 *     security:
 *       - sessionAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 200
 *                 description: User's full name
 *                 example: John Doe
 *               phone:
 *                 type: string
 *                 maxLength: 50
 *                 description: User's phone number
 *                 example: +1234567890
 *               address:
 *                 type: string
 *                 description: User's address
 *                 example: 123 Main St, City, State
 *               neighbourhood:
 *                 type: string
 *                 description: User's neighbourhood
 *                 example: Downtown District
 *               bio:
 *                 type: string
 *                 description: User's bio
 *                 example: I love cooking and meeting new people!
 *               dietaryRestrictions:
 *                 type: string
 *                 description: User's dietary restrictions
 *                 example: Vegetarian, no nuts
 *               interests:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: User's interests
 *                 example: ["cooking", "travel", "music"]
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 description: User's date of birth
 *                 example: 1990-01-01
 *               personalityType:
 *                 type: string
 *                 enum: [extrovert, introvert, ambivert]
 *                 description: User's personality type
 *                 example: extrovert
 *               cookingExperience:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 description: User's cooking experience level
 *                 example: intermediate
 *               preferredGroupSize:
 *                 type: string
 *                 enum: [small, medium, large]
 *                 description: User's preferred group size
 *                 example: medium
 *               socialPreferences:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: User's social preferences
 *                 example: ["casual", "formal", "outdoor"]
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/', requireAuth, async (req, res) => {
  const userId = getSessionUserId(req)!;
  const parsed = profileSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const data = parsed.data as any;
  if (data.dateOfBirth) {
    // pass through as date string
  }
  const [updated] = await db
    .update(users)
    .set({ ...data })
    .where(eq(users.id, userId))
    .returning();
  const { passwordHash, ...safe } = updated as any;
  res.json(safe);
});

export default router;


