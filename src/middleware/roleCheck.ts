import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { auditService } from '../services/AuditService';
import { AuditEventType, Role } from '../types/models';
import { rolePermissionsService } from '../services/RolePermissionsService';

/**
 * Middleware to check if user has required role(s)
 * Supports role hierarchy - higher roles automatically have access
 * @param allowedRoles - Array of roles that are allowed to access the resource
 * @param requireExact - If true, only exact role match is allowed (no hierarchy)
 */
export function requireRole(...allowedRoles: (Role | string)[]) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = (req as any).user?.role as Role;

    if (!userRole) {
      await auditService.logEvent({
        userId: req.userId,
        eventType: AuditEventType.ACCESS_DENIED,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        outcome: 'failure',
        details: {
          reason: 'no_role_assigned',
          requiredRoles: allowedRoles,
          resource: req.path
        }
      });

      return res.status(403).json({ 
        error: 'Access denied: No role assigned' 
      });
    }

    // Check if user has one of the allowed roles
    const hasRole = allowedRoles.some(allowedRole => {
      if (userRole === allowedRole) return true;
      
      // Check role hierarchy - higher roles can access lower role resources
      const userRoleLevel = rolePermissionsService.getRoleLevel(userRole);
      const allowedRoleLevel = rolePermissionsService.getRoleLevel(allowedRole as Role);
      
      return userRoleLevel >= allowedRoleLevel;
    });

    if (!hasRole) {
      // Log unauthorized access attempt
      await auditService.logEvent({
        userId: req.userId,
        eventType: AuditEventType.ACCESS_DENIED,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        outcome: 'failure',
        details: {
          requiredRoles: allowedRoles,
          userRole: userRole,
          resource: req.path,
          roleLevel: rolePermissionsService.getRoleLevel(userRole)
        }
      });

      return res.status(403).json({ 
        error: 'Access denied: Insufficient privileges',
        required: allowedRoles,
        current: userRole
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
        resource: req.path,
        roleLevel: rolePermissionsService.getRoleLevel(userRole)
      }
    });

    next();
  };
}

/**
 * Middleware to check if user has minimum role level
 * @param minimumRole - Minimum role required (includes all higher roles)
 */
export function requireMinimumRole(minimumRole: Role) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = (req as any).user?.role as Role;
    
    if (!userRole) {
      return res.status(403).json({ error: 'Access denied: No role assigned' });
    }

    const userLevel = rolePermissionsService.getRoleLevel(userRole);
    const requiredLevel = rolePermissionsService.getRoleLevel(minimumRole);

    if (userLevel < requiredLevel) {
      await auditService.logEvent({
        userId: req.userId,
        eventType: AuditEventType.ACCESS_DENIED,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('user-agent') || 'unknown',
        outcome: 'failure',
        details: {
          minimumRole,
          userRole,
          requiredLevel,
          userLevel,
          resource: req.path
        }
      });

      return res.status(403).json({ 
        error: 'Access denied: Insufficient role level',
        required: minimumRole,
        current: userRole
      });
    }

    next();
  };
}
