import { Request, Response, NextFunction } from 'express';

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session && (req.session as any).userId) return next();
  return res.status(401).json({ error: 'Unauthorized' });
}

export function setSessionUser(req: Request, userId: number) {
  console.log('Setting session user:', { userId, sessionExists: !!req.session });
  
  if (!req.session) {
    console.error('No session object available');
    return;
  }
  
  (req.session as any).userId = userId;
  console.log('Session user set successfully:', { userId, sessionId: req.sessionID });
}

export function getSessionUserId(req: Request): number | null {
  const userId = req.session && (req.session as any).userId ? (req.session as any).userId : null;
  console.log('Getting session user ID:', { 
    userId, 
    sessionExists: !!req.session, 
    sessionId: req.sessionID,
    sessionData: req.session ? Object.keys(req.session) : null
  });
  return userId;
}


