import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session && (req.session as any).userId) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

export function setSessionUser(req: Request, userId: number) {
  console.log('Setting session user:', userId);
  console.log('Session before setting:', req.session);
  
  if (!req.session) {
    console.log('No session available');
    return;
  }
  
  (req.session as any).userId = userId;
  console.log('Session after setting user:', req.session);
}

export function getSessionUserId(req: Request): number | null {
  const userId = req.session && (req.session as any).userId ? (req.session as any).userId : null;
  console.log('Getting session userId:', userId);
  return userId;
}


