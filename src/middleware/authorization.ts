import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { authorizationService } from '../services/AuthorizationService';
import { auditService } from '../services/AuditService';
import { AuditEventType } from '../types/models';

export function authorize(action: string, resource: string) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const hasPermission = await authorizationService.hasPermission(req.userId, action, resource);

    if (!hasPermission) {
      await auditService.logEvent({
        userId: req.userId,
        eventType: AuditEventType.ACCESS_DENIED,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        outcome: 'failure',
        details: { action, resource }
      });

      return res.status(403).json({ error: 'Access denied' });
    }

    next();
  };
}
