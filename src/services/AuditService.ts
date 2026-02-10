import { auditRepository } from '../repositories/AuditRepository';
import { AuditEvent, AuditEventType } from '../types/models';

export interface AuditEventOptions {
  userId: string | null;
  eventType: AuditEventType;
  ipAddress: string;
  userAgent: string;
  outcome: 'success' | 'failure';
  details?: Record<string, any>;
}

export class AuditService {
  async logEvent(options: AuditEventOptions): Promise<AuditEvent> {
    return await auditRepository.create(options);
  }

  async getAuditLogsForUser(userId: string, startDate: Date, endDate: Date): Promise<AuditEvent[]> {
    return await auditRepository.findByUserIdAndDateRange(userId, startDate, endDate);
  }

  async getAuditLogsByType(eventType: AuditEventType, startDate: Date, endDate: Date): Promise<AuditEvent[]> {
    return await auditRepository.findByDateRange(startDate, endDate);
  }
}

export const auditService = new AuditService();
