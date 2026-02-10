/**
 * Unit tests for AuditService
 * 
 * Tests all business logic methods including:
 * - Event logging with immediate persistence
 * - Query methods (by user, type, date range)
 * - Hash chain integrity verification
 */

import { AuditService, LogEventParams } from './AuditService';
import { AuditRepository, CreateAuditEventParams } from '../repositories/AuditRepository';
import { AuditEvent, AuditEventType } from '../types/models';

// Mock the AuditRepository
jest.mock('../repositories/AuditRepository');

describe('AuditService', () => {
  let service: AuditService;
  let mockRepository: jest.Mocked<AuditRepository>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a mock repository
    mockRepository = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      findByType: jest.fn(),
      findByDateRange: jest.fn(),
      findByUserIdAndDateRange: jest.fn(),
      findById: jest.fn(),
      count: jest.fn(),
      verifyHashChain: jest.fn(),
    } as any;

    // Create service with mock repository
    service = new AuditService(mockRepository);
  });

  describe('logEvent', () => {
    it('should create audit event with all required fields', async () => {
      const params: LogEventParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: AuditEventType.LOGIN_SUCCESS,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success',
        details: { method: 'password' }
      };

      const mockEvent: AuditEvent = {
        id: 1,
        userId: params.userId,
        eventType: params.eventType,
        timestamp: new Date(),
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        outcome: params.outcome,
        details: params.details!,
        hash: 'abc123'
      };

      mockRepository.create.mockResolvedValue(mockEvent);

      const result = await service.logEvent(params);

      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: params.userId,
          eventType: params.eventType,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
          outcome: params.outcome,
          details: params.details,
          timestamp: expect.any(Date)
        })
      );
      expect(result).toEqual(mockEvent);
    });

    it('should handle null userId for failed login attempts', async () => {
      const params: LogEventParams = {
        userId: null,
        eventType: AuditEventType.LOGIN_FAILURE,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'failure',
        details: { reason: 'invalid_credentials' }
      };

      const mockEvent: AuditEvent = {
        id: 1,
        userId: null,
        eventType: params.eventType,
        timestamp: new Date(),
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        outcome: params.outcome,
        details: params.details!,
        hash: 'abc123'
      };

      mockRepository.create.mockResolvedValue(mockEvent);

      const result = await service.logEvent(params);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: null,
          eventType: AuditEventType.LOGIN_FAILURE,
          outcome: 'failure'
        })
      );
      expect(result.userId).toBeNull();
    });

    it('should use empty object for details if not provided', async () => {
      const params: LogEventParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: AuditEventType.LOGOUT,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
        // No details provided
      };

      const mockEvent: AuditEvent = {
        id: 1,
        userId: params.userId,
        eventType: params.eventType,
        timestamp: new Date(),
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        outcome: params.outcome,
        details: {},
        hash: 'abc123'
      };

      mockRepository.create.mockResolvedValue(mockEvent);

      await service.logEvent(params);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          details: {}
        })
      );
    });

    it('should use current timestamp when logging event', async () => {
      const beforeTime = new Date();

      const params: LogEventParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: AuditEventType.ACCOUNT_CREATED,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      };

      const mockEvent: AuditEvent = {
        id: 1,
        userId: params.userId,
        eventType: params.eventType,
        timestamp: new Date(),
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        outcome: params.outcome,
        details: {},
        hash: 'abc123'
      };

      mockRepository.create.mockResolvedValue(mockEvent);

      await service.logEvent(params);

      const afterTime = new Date();

      const callArgs = mockRepository.create.mock.calls[0][0] as CreateAuditEventParams;
      expect(callArgs.timestamp).toBeInstanceOf(Date);
      expect(callArgs.timestamp!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(callArgs.timestamp!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should immediately persist event to database', async () => {
      const params: LogEventParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: AuditEventType.PASSWORD_CHANGED,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      };

      const mockEvent: AuditEvent = {
        id: 1,
        userId: params.userId,
        eventType: params.eventType,
        timestamp: new Date(),
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        outcome: params.outcome,
        details: {},
        hash: 'abc123'
      };

      mockRepository.create.mockResolvedValue(mockEvent);

      const result = await service.logEvent(params);

      // Verify repository.create was called (immediate persistence)
      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockEvent);
    });

    it('should handle complex details objects', async () => {
      const complexDetails = {
        changedFields: ['email', 'phoneNumber'],
        oldValues: { email: 'old@example.com', phoneNumber: '555-0100' },
        newValues: { email: 'new@example.com', phoneNumber: '555-0200' },
        metadata: { source: 'web', version: '1.0' }
      };

      const params: LogEventParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: AuditEventType.PROFILE_UPDATED,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success',
        details: complexDetails
      };

      const mockEvent: AuditEvent = {
        id: 1,
        userId: params.userId,
        eventType: params.eventType,
        timestamp: new Date(),
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        outcome: params.outcome,
        details: complexDetails,
        hash: 'abc123'
      };

      mockRepository.create.mockResolvedValue(mockEvent);

      await service.logEvent(params);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          details: complexDetails
        })
      );
    });
  });

  describe('getAuditLogsForUser', () => {
    const userId = '123e4567-e89b-12d3-a456-426614174000';

    it('should get audit logs for user without date range', async () => {
      const mockEvents: AuditEvent[] = [
        {
          id: 1,
          userId,
          eventType: AuditEventType.LOGIN_SUCCESS,
          timestamp: new Date(),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          outcome: 'success',
          details: {},
          hash: 'abc123'
        }
      ];

      mockRepository.findByUserId.mockResolvedValue(mockEvents);

      const result = await service.getAuditLogsForUser(userId);

      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId, 100, 0);
      expect(result).toEqual(mockEvents);
    });

    it('should get audit logs for user with date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockEvents: AuditEvent[] = [
        {
          id: 1,
          userId,
          eventType: AuditEventType.LOGIN_SUCCESS,
          timestamp: new Date('2024-01-15'),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          outcome: 'success',
          details: {},
          hash: 'abc123'
        }
      ];

      mockRepository.findByUserIdAndDateRange.mockResolvedValue(mockEvents);

      const result = await service.getAuditLogsForUser(userId, startDate, endDate);

      expect(mockRepository.findByUserIdAndDateRange).toHaveBeenCalledWith(
        userId,
        startDate,
        endDate,
        100,
        0
      );
      expect(result).toEqual(mockEvents);
    });

    it('should respect custom limit and offset', async () => {
      const mockEvents: AuditEvent[] = [];
      mockRepository.findByUserId.mockResolvedValue(mockEvents);

      await service.getAuditLogsForUser(userId, undefined, undefined, 50, 10);

      expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId, 50, 10);
    });

    it('should return empty array when user has no events', async () => {
      mockRepository.findByUserId.mockResolvedValue([]);

      const result = await service.getAuditLogsForUser(userId);

      expect(result).toEqual([]);
    });
  });

  describe('getAuditLogsByType', () => {
    it('should get audit logs by type without date range', async () => {
      const mockEvents: AuditEvent[] = [
        {
          id: 1,
          userId: 'user1',
          eventType: AuditEventType.LOGIN_FAILURE,
          timestamp: new Date(),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          outcome: 'failure',
          details: {},
          hash: 'abc123'
        }
      ];

      mockRepository.findByType.mockResolvedValue(mockEvents);

      const result = await service.getAuditLogsByType(AuditEventType.LOGIN_FAILURE);

      expect(mockRepository.findByType).toHaveBeenCalledWith(
        AuditEventType.LOGIN_FAILURE,
        100,
        0
      );
      expect(result).toEqual(mockEvents);
    });

    it('should get audit logs by type with date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockEvents: AuditEvent[] = [
        {
          id: 1,
          userId: 'user1',
          eventType: AuditEventType.PASSWORD_CHANGED,
          timestamp: new Date('2024-01-15'),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          outcome: 'success',
          details: {},
          hash: 'abc123'
        },
        {
          id: 2,
          userId: 'user2',
          eventType: AuditEventType.PASSWORD_CHANGED,
          timestamp: new Date('2024-01-20'),
          ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0',
          outcome: 'success',
          details: {},
          hash: 'def456'
        }
      ];

      mockRepository.findByDateRange.mockResolvedValue(mockEvents);

      const result = await service.getAuditLogsByType(
        AuditEventType.PASSWORD_CHANGED,
        startDate,
        endDate
      );

      expect(mockRepository.findByDateRange).toHaveBeenCalledWith(
        startDate,
        endDate,
        200, // limit * 2 for filtering
        0
      );
      expect(result).toEqual(mockEvents);
    });

    it('should filter events by type when using date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockEvents: AuditEvent[] = [
        {
          id: 1,
          userId: 'user1',
          eventType: AuditEventType.PASSWORD_CHANGED,
          timestamp: new Date('2024-01-15'),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          outcome: 'success',
          details: {},
          hash: 'abc123'
        },
        {
          id: 2,
          userId: 'user2',
          eventType: AuditEventType.LOGIN_SUCCESS,
          timestamp: new Date('2024-01-20'),
          ipAddress: '192.168.1.2',
          userAgent: 'Mozilla/5.0',
          outcome: 'success',
          details: {},
          hash: 'def456'
        }
      ];

      mockRepository.findByDateRange.mockResolvedValue(mockEvents);

      const result = await service.getAuditLogsByType(
        AuditEventType.PASSWORD_CHANGED,
        startDate,
        endDate
      );

      // Should only return PASSWORD_CHANGED events
      expect(result).toHaveLength(1);
      expect(result[0].eventType).toBe(AuditEventType.PASSWORD_CHANGED);
    });

    it('should respect custom limit and offset', async () => {
      mockRepository.findByType.mockResolvedValue([]);

      await service.getAuditLogsByType(AuditEventType.LOGOUT, undefined, undefined, 25, 5);

      expect(mockRepository.findByType).toHaveBeenCalledWith(
        AuditEventType.LOGOUT,
        25,
        5
      );
    });
  });

  describe('getAuditLogsByDateRange', () => {
    it('should get audit logs within date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      const mockEvents: AuditEvent[] = [
        {
          id: 1,
          userId: 'user1',
          eventType: AuditEventType.LOGIN_SUCCESS,
          timestamp: new Date('2024-01-15'),
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          outcome: 'success',
          details: {},
          hash: 'abc123'
        }
      ];

      mockRepository.findByDateRange.mockResolvedValue(mockEvents);

      const result = await service.getAuditLogsByDateRange(startDate, endDate);

      expect(mockRepository.findByDateRange).toHaveBeenCalledWith(
        startDate,
        endDate,
        100,
        0
      );
      expect(result).toEqual(mockEvents);
    });

    it('should respect custom limit and offset', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');

      mockRepository.findByDateRange.mockResolvedValue([]);

      await service.getAuditLogsByDateRange(startDate, endDate, 75, 15);

      expect(mockRepository.findByDateRange).toHaveBeenCalledWith(
        startDate,
        endDate,
        75,
        15
      );
    });
  });

  describe('getAuditEventById', () => {
    it('should get audit event by ID', async () => {
      const mockEvent: AuditEvent = {
        id: 12345,
        userId: 'user1',
        eventType: AuditEventType.ACCOUNT_CREATED,
        timestamp: new Date(),
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success',
        details: {},
        hash: 'abc123'
      };

      mockRepository.findById.mockResolvedValue(mockEvent);

      const result = await service.getAuditEventById(12345);

      expect(mockRepository.findById).toHaveBeenCalledWith(12345);
      expect(result).toEqual(mockEvent);
    });

    it('should return null when event not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      const result = await service.getAuditEventById(99999);

      expect(result).toBeNull();
    });
  });

  describe('getTotalEventCount', () => {
    it('should return total count of audit events', async () => {
      mockRepository.count.mockResolvedValue(12345);

      const result = await service.getTotalEventCount();

      expect(mockRepository.count).toHaveBeenCalledTimes(1);
      expect(result).toBe(12345);
    });

    it('should return 0 when no events exist', async () => {
      mockRepository.count.mockResolvedValue(0);

      const result = await service.getTotalEventCount();

      expect(result).toBe(0);
    });
  });

  describe('verifyAuditLogIntegrity', () => {
    it('should verify valid hash chain', async () => {
      const mockVerification = {
        isValid: true,
        totalEntries: 100,
        brokenLinks: []
      };

      mockRepository.verifyHashChain.mockResolvedValue(mockVerification);

      const result = await service.verifyAuditLogIntegrity();

      expect(mockRepository.verifyHashChain).toHaveBeenCalledTimes(1);
      expect(result).toEqual(mockVerification);
      expect(result.isValid).toBe(true);
      expect(result.brokenLinks).toHaveLength(0);
    });

    it('should detect broken hash chain', async () => {
      const mockVerification = {
        isValid: false,
        totalEntries: 100,
        brokenLinks: [
          {
            id: 50,
            expectedHash: 'abc123',
            actualHash: 'tampered'
          }
        ]
      };

      mockRepository.verifyHashChain.mockResolvedValue(mockVerification);

      const result = await service.verifyAuditLogIntegrity();

      expect(result.isValid).toBe(false);
      expect(result.brokenLinks).toHaveLength(1);
      expect(result.brokenLinks[0].id).toBe(50);
    });

    it('should handle empty audit log', async () => {
      const mockVerification = {
        isValid: true,
        totalEntries: 0,
        brokenLinks: []
      };

      mockRepository.verifyHashChain.mockResolvedValue(mockVerification);

      const result = await service.verifyAuditLogIntegrity();

      expect(result.isValid).toBe(true);
      expect(result.totalEntries).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should propagate repository errors when logging event', async () => {
      const params: LogEventParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: AuditEventType.LOGIN_SUCCESS,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      };

      const error = new Error('Database connection failed');
      mockRepository.create.mockRejectedValue(error);

      await expect(service.logEvent(params)).rejects.toThrow('Database connection failed');
    });

    it('should propagate repository errors when querying', async () => {
      const error = new Error('Query failed');
      mockRepository.findByUserId.mockRejectedValue(error);

      await expect(service.getAuditLogsForUser('user1')).rejects.toThrow('Query failed');
    });
  });

  describe('integration scenarios', () => {
    it('should log multiple events in sequence', async () => {
      const events = [
        {
          userId: 'user1',
          eventType: AuditEventType.ACCOUNT_CREATED,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          outcome: 'success' as const
        },
        {
          userId: 'user1',
          eventType: AuditEventType.LOGIN_SUCCESS,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          outcome: 'success' as const
        },
        {
          userId: 'user1',
          eventType: AuditEventType.PROFILE_UPDATED,
          ipAddress: '192.168.1.1',
          userAgent: 'Mozilla/5.0',
          outcome: 'success' as const,
          details: { changedFields: ['email'] }
        }
      ];

      mockRepository.create.mockImplementation(async (params) => ({
        id: Math.floor(Math.random() * 1000),
        userId: params.userId,
        eventType: params.eventType,
        timestamp: params.timestamp || new Date(),
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        outcome: params.outcome,
        details: params.details || {},
        hash: 'hash' + Math.random()
      }));

      for (const event of events) {
        await service.logEvent(event);
      }

      expect(mockRepository.create).toHaveBeenCalledTimes(3);
    });

    it('should handle mixed success and failure outcomes', async () => {
      const successEvent: LogEventParams = {
        userId: 'user1',
        eventType: AuditEventType.LOGIN_SUCCESS,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      };

      const failureEvent: LogEventParams = {
        userId: null,
        eventType: AuditEventType.LOGIN_FAILURE,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'failure',
        details: { reason: 'invalid_credentials' }
      };

      mockRepository.create.mockImplementation(async (params) => ({
        id: Math.floor(Math.random() * 1000),
        userId: params.userId,
        eventType: params.eventType,
        timestamp: params.timestamp || new Date(),
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        outcome: params.outcome,
        details: params.details || {},
        hash: 'hash' + Math.random()
      }));

      await service.logEvent(successEvent);
      await service.logEvent(failureEvent);

      expect(mockRepository.create).toHaveBeenCalledTimes(2);
      expect(mockRepository.create).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ outcome: 'success' })
      );
      expect(mockRepository.create).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ outcome: 'failure', userId: null })
      );
    });
  });
});
