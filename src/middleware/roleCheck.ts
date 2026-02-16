import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { auditService } from '../services/AuditService';
import { AuditEventType } from '../types/models';

/**
 * Middleware to check if user has required role(s)
 * @param allowedRoles - Array of roles that are allowed to access the resource
 */
export function requireRole(...allowedRoles: string[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = (req as any).user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      // Log unauthorized access attempt
      await auditService.logEvent({
        userId: req.userId,
        eventType: AuditEventType.ACCESS_DENIED,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        outcome: 'failure',
        details: {
          requiredRoles: allowedRoles,
          userRole: userRole || 'none',
          resource: req.path
        }
      });

      return res.status(403).json({ 
        error: 'Access denied: Admin role required' 
      });
    }

    // Log successful access
    await auditService.logEvent({
      userId: req.userId,
      eventType: AuditEventType.ACCESS_GRANTED,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      outcome: 'success',
      details: {
        userRole,
        resource: req.path
      }
    });

    next();
  };
}
