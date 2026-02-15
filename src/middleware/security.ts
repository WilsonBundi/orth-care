import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      scriptSrcAttr: ["'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
  },
});

export function httpsRedirect(req: Request, res: Response, next: NextFunction) {
  // Render and most cloud platforms handle HTTPS at the load balancer level
  // No need to redirect - just pass through
  next();
}

export function cacheControl(req: Request, res: Response, next: NextFunction) {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  next();
}
