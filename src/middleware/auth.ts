import { Request, Response, NextFunction } from 'express';
import { sessionService } from '../services/SessionService';

export interface AuthRequest extends Request {
  userId?: string;
  sessionId?: string;
}

export async function authenticate(req: AuthRequest, res: Response, next: NextFunction) {
  const sessionId = req.cookies?.sessionId;

  if (!sessionId) {
    return res.status(401).json({ error: 'Authentication required', redirect: '/login' });
  }

  const session = await sessionService.validateAndExtendSession(sessionId);

  if (!session) {
    res.clearCookie('sessionId');
    return res.status(401).json({ error: 'Session expired', redirect: '/login' });
  }

  req.userId = session.userId;
  req.sessionId = sessionId;
  next();
}
