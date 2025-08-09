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

router.get('/', requireAuth, async (req, res) => {
  const userId = getSessionUserId(req)!;
  const user = await db.query.users.findFirst({ where: (u, { eq }) => eq(u.id, userId) });
  if (!user) return res.status(404).json({ error: 'Not found' });
  const { passwordHash, ...safe } = user as any;
  res.json(safe);
});

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


