import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';

const tokens = new Map<string, { token: string; expires: number }>();

export const generateCsrfToken = (req: Request): string => {
  const token = crypto.randomBytes(32).toString('hex');
  const sessionId = (req as any).session?.id || req.ip;
  
  tokens.set(sessionId, {
    token,
    expires: Date.now() + 3600000 // 1 hour
  });
  
  return token;
};

export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  
  const sessionId = (req as any).session?.id || req.ip;
  const tokenData = tokens.get(sessionId);
  const submittedToken = req.headers['x-csrf-token'] as string || req.body._csrf;
  
  if (!tokenData || tokenData.expires < Date.now()) {
    tokens.delete(sessionId);
    res.status(403).json({ error: 'CSRF token expired' });
    return;
  }
  
  if (!submittedToken || submittedToken !== tokenData.token) {
    res.status(403).json({ error: 'Invalid CSRF token' });
    return;
  }
  
  next();
};

export const cleanupExpiredTokens = (): void => {
  const now = Date.now();
  for (const [sessionId, data] of tokens.entries()) {
    if (data.expires < now) {
      tokens.delete(sessionId);
    }
  }
};

setInterval(cleanupExpiredTokens, 600000); // Cleanup every 10 minutes
