import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/client';
import { events } from '../db/schema';
import { requireAdmin } from '../middleware/roles';

const router = Router();

const createEventSchema = z.object({
  title: z.string().min(3),
  description: z.string().optional(),
  neighbourhoodId: z.number().int(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  totalSpots: z.number().int().positive(),
  spotsRemaining: z.number().int().positive(),
  isWaitlist: z.boolean().default(false),
  format: z.enum(['rotating', 'hosted']),
});

router.post('/', requireAdmin, async (req, res) => {
  const parsed = createEventSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const [row] = await db.insert(events).values(parsed.data).returning();
  res.status(201).json(row);
});

export default router;


