import { Request, Response, NextFunction } from 'express';

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const role = (req.session as any)?.role as string | undefined;
  if (role === 'admin') return next();
  return res.status(403).json({ error: 'Forbidden' });
}


