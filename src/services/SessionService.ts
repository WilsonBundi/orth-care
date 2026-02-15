import { sessionRepository } from '../repositories';
import { auditService } from './AuditService';
import { Session, AuditEventType, LogoutReason } from '../types/models';
import crypto from 'crypto';

export class SessionService {
  async createSession(userId: string, ipAddress: string, userAgent: string): Promise<Session> {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    
    return await sessionRepository.create({
      id: sessionId,
      userId,
      ipAddress,
      userAgent,
      expiresAt
    });
  }

  async validateAndExtendSession(sessionId: string): Promise<Session | null> {
    const session = await sessionRepository.findById(sessionId);
    
    if (!session || session.invalidated) {
      return null;
    }

    if (session.expiresAt <= new Date()) {
      return null;
    }

    // Extend session
    const newExpiresAt = new Date(Date.now() + 30 * 60 * 1000);
    return await sessionRepository.update(sessionId, { expiresAt: newExpiresAt });
  }

  async invalidateSession(sessionId: string, reason: LogoutReason, ipAddress: string, userAgent: string): Promise<void> {
    const session = await sessionRepository.findById(sessionId);
    if (session) {
      await sessionRepository.update(sessionId, { invalidated: true });
      
      await auditService.logEvent({
        userId: session.userId,
        eventType: AuditEventType.LOGOUT,
        ipAddress,
        userAgent,
        outcome: 'success',
        details: { reason }
      });
    }
  }

  async invalidateAllSessionsExcept(userId: string, currentSessionId: string): Promise<void> {
    await sessionRepository.invalidateAllExcept(userId, currentSessionId);
  }

  async cleanupExpiredSessions(): Promise<number> {
    return await sessionRepository.cleanupExpired();
  }
}

export const sessionService = new SessionService();
