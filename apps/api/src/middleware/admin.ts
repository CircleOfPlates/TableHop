import { Request, Response, NextFunction } from 'express'
import { db } from '../db/client'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { getSessionUserId } from '../auth'

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getSessionUserId(req)
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' })
    }

    const user = await db.select().from(users).where(eq(users.id, userId)).limit(1)
    if (!user.length || user[0].role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    next()
  } catch (error) {
    console.error('Admin middleware error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
