import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session && (req.session as any).userId) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

export function setSessionUser(req: Request, userId: number) {
  if (!req.session) return;
  (req.session as any).userId = userId;
}

export function getSessionUserId(req: Request): number | null {
  return req.session && (req.session as any).userId ? (req.session as any).userId : null;
}


