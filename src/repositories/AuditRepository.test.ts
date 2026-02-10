/**
 * Unit tests for AuditRepository
 * 
 * Tests all database operations including:
 * - Audit event creation with sequential IDs
 * - Tamper-evident hash chain
 * - Query methods (by user, type, date range)
 * - Hash chain verification
 */

import { Pool } from 'pg';
import { AuditRepository, CreateAuditEventParams } from './AuditRepository';
import { AuditEventType } from '../types/models';

// Test database configuration
const testPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'patient_portal',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

describe('AuditRepository', () => {
  let repository: AuditRepository;

  beforeAll(async () => {
    repository = new AuditRepository(testPool);
  });

  afterAll(async () => {
    // Clean up test data
    await testPool.query('DELETE FROM audit_events WHERE ip_address = $1', ['127.0.0.1']);
    await testPool.end();
  });

  beforeEach(async () => {
    // Clean up before each test
    await testPool.query('DELETE FROM audit_events WHERE ip_address = $1', ['127.0.0.1']);
  });

  describe('create', () => {
    it('should create a new audit event with sequential ID', async () => {
      const params: CreateAuditEventParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: AuditEventType.LOGIN_SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success',
        details: { method: 'password' }
      };

      const event = await repository.create(params);

      expect(event.id).toBeDefined();
      expect(event.userId).toBe(params.userId);
      expect(event.eventType).toBe(params.eventType);
      expect(event.ipAddress).toBe(params.ipAddress);
      expect(event.userAgent).toBe(params.userAgent);
      expect(event.outcome).toBe(params.outcome);
      expect(event.details).toEqual(params.details);
      expect(event.hash).toBeDefined();
      expect(event.hash).toHaveLength(64); // SHA-256 produces 64 hex characters
      expect(event.timestamp).toBeInstanceOf(Date);
    });

    it('should create audit event with null userId for failed login', async () => {
      const params: CreateAuditEventParams = {
        userId: null,
        eventType: AuditEventType.LOGIN_FAILURE,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'failure',
        details: { reason: 'invalid_credentials' }
      };

      const event = await repository.create(params);

      expect(event.userId).toBeNull();
      expect(event.eventType).toBe(AuditEventType.LOGIN_FAILURE);
      expect(event.outcome).toBe('failure');
    });

    it('should create audit events with sequential IDs', async () => {
      const params1: CreateAuditEventParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: AuditEventType.ACCOUNT_CREATED,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      };

      const params2: CreateAuditEventParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: AuditEventType.LOGIN_SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      };

      const event1 = await repository.create(params1);
      const event2 = await repository.create(params2);

      expect(event2.id).toBeGreaterThan(event1.id);
      expect(event2.id).toBe(event1.id + 1);
    });

    it('should create hash chain linking entries', async () => {
      const params1: CreateAuditEventParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: AuditEventType.ACCOUNT_CREATED,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      };

      const params2: CreateAuditEventParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: AuditEventType.LOGIN_SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      };

      const event1 = await repository.create(params1);
      const event2 = await repository.create(params2);

      // The hashes should be different
      expect(event1.hash).not.toBe(event2.hash);
      
      // Each hash should be 64 characters (SHA-256)
      expect(event1.hash).toHaveLength(64);
      expect(event2.hash).toHaveLength(64);
    });

    it('should use custom timestamp if provided', async () => {
      const customTimestamp = new Date('2024-01-01T12:00:00Z');
      const params: CreateAuditEventParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: AuditEventType.LOGIN_SUCCESS,
        timestamp: customTimestamp,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      };

      const event = await repository.create(params);

      expect(event.timestamp.toISOString()).toBe(customTimestamp.toISOString());
    });

    it('should handle empty details object', async () => {
      const params: CreateAuditEventParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: AuditEventType.LOGOUT,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      };

      const event = await repository.create(params);

      expect(event.details).toEqual({});
    });

    it('should handle complex details object', async () => {
      const complexDetails = {
        changedFields: ['email', 'phoneNumber'],
        oldValues: { email: 'old@example.com' },
        newValues: { email: 'new@example.com' },
        metadata: { source: 'web', version: '1.0' }
      };

      const params: CreateAuditEventParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: AuditEventType.PROFILE_UPDATED,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success',
        details: complexDetails
      };

      const event = await repository.create(params);

      expect(event.details).toEqual(complexDetails);
    });
  });

  describe('findById', () => {
    it('should find an audit event by ID', async () => {
      const params: CreateAuditEventParams = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: AuditEventType.LOGIN_SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      };

      const created = await repository.create(params);
      const found = await repository.findById(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.userId).toBe(created.userId);
      expect(found!.eventType).toBe(created.eventType);
      expect(found!.hash).toBe(created.hash);
    });

    it('should return null when ID does not exist', async () => {
      const found = await repository.findById(999999999);

      expect(found).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should find all audit events for a user', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      await repository.create({
        userId,
        eventType: AuditEventType.ACCOUNT_CREATED,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      await repository.create({
        userId,
        eventType: AuditEventType.LOGIN_SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      await repository.create({
        userId: 'different-user-id',
        eventType: AuditEventType.LOGIN_SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      const events = await repository.findByUserId(userId);

      expect(events).toHaveLength(2);
      expect(events[0].userId).toBe(userId);
      expect(events[1].userId).toBe(userId);
    });

    it('should return events in descending order by timestamp', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      const event1 = await repository.create({
        userId,
        eventType: AuditEventType.ACCOUNT_CREATED,
        timestamp: new Date('2024-01-01T10:00:00Z'),
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      const event2 = await repository.create({
        userId,
        eventType: AuditEventType.LOGIN_SUCCESS,
        timestamp: new Date('2024-01-01T11:00:00Z'),
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      const events = await repository.findByUserId(userId);

      expect(events[0].id).toBe(event2.id); // Most recent first
      expect(events[1].id).toBe(event1.id);
    });

    it('should respect limit parameter', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      for (let i = 0; i < 5; i++) {
        await repository.create({
          userId,
          eventType: AuditEventType.LOGIN_SUCCESS,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          outcome: 'success'
        });
      }

      const events = await repository.findByUserId(userId, 3);

      expect(events).toHaveLength(3);
    });

    it('should respect offset parameter', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';

      const created = [];
      for (let i = 0; i < 5; i++) {
        const event = await repository.create({
          userId,
          eventType: AuditEventType.LOGIN_SUCCESS,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          outcome: 'success'
        });
        created.push(event);
      }

      const events = await repository.findByUserId(userId, 10, 2);

      expect(events).toHaveLength(3);
      // Should skip the first 2 (most recent)
      expect(events[0].id).toBe(created[2].id);
    });

    it('should return empty array when user has no events', async () => {
      const events = await repository.findByUserId('nonexistent-user-id');

      expect(events).toEqual([]);
    });
  });

  describe('findByType', () => {
    it('should find all audit events of a specific type', async () => {
      await repository.create({
        userId: 'user1',
        eventType: AuditEventType.LOGIN_SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      await repository.create({
        userId: 'user2',
        eventType: AuditEventType.LOGIN_SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      await repository.create({
        userId: 'user1',
        eventType: AuditEventType.LOGOUT,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      const events = await repository.findByType(AuditEventType.LOGIN_SUCCESS);

      expect(events.length).toBeGreaterThanOrEqual(2);
      events.forEach(event => {
        expect(event.eventType).toBe(AuditEventType.LOGIN_SUCCESS);
      });
    });

    it('should return events in descending order by timestamp', async () => {
      const event1 = await repository.create({
        userId: 'user1',
        eventType: AuditEventType.PASSWORD_CHANGED,
        timestamp: new Date('2024-01-01T10:00:00Z'),
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      const event2 = await repository.create({
        userId: 'user2',
        eventType: AuditEventType.PASSWORD_CHANGED,
        timestamp: new Date('2024-01-01T11:00:00Z'),
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      const events = await repository.findByType(AuditEventType.PASSWORD_CHANGED);

      expect(events[0].id).toBe(event2.id); // Most recent first
      expect(events[1].id).toBe(event1.id);
    });

    it('should respect limit and offset parameters', async () => {
      for (let i = 0; i < 5; i++) {
        await repository.create({
          userId: `user${i}`,
          eventType: AuditEventType.PROFILE_UPDATED,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          outcome: 'success'
        });
      }

      const events = await repository.findByType(AuditEventType.PROFILE_UPDATED, 2, 1);

      expect(events).toHaveLength(2);
    });
  });

  describe('findByDateRange', () => {
    it('should find audit events within date range', async () => {
      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-31T23:59:59Z');

      await repository.create({
        userId: 'user1',
        eventType: AuditEventType.LOGIN_SUCCESS,
        timestamp: new Date('2024-01-15T12:00:00Z'),
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      await repository.create({
        userId: 'user2',
        eventType: AuditEventType.LOGIN_SUCCESS,
        timestamp: new Date('2024-02-15T12:00:00Z'), // Outside range
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      const events = await repository.findByDateRange(startDate, endDate);

      expect(events.length).toBeGreaterThanOrEqual(1);
      events.forEach(event => {
        expect(event.timestamp.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
        expect(event.timestamp.getTime()).toBeLessThanOrEqual(endDate.getTime());
      });
    });

    it('should include events at exact start and end boundaries', async () => {
      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-31T23:59:59Z');

      const event1 = await repository.create({
        userId: 'user1',
        eventType: AuditEventType.LOGIN_SUCCESS,
        timestamp: startDate,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      const event2 = await repository.create({
        userId: 'user2',
        eventType: AuditEventType.LOGIN_SUCCESS,
        timestamp: endDate,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      const events = await repository.findByDateRange(startDate, endDate);

      const eventIds = events.map(e => e.id);
      expect(eventIds).toContain(event1.id);
      expect(eventIds).toContain(event2.id);
    });

    it('should respect limit and offset parameters', async () => {
      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-12-31T23:59:59Z');

      for (let i = 0; i < 5; i++) {
        await repository.create({
          userId: `user${i}`,
          eventType: AuditEventType.LOGIN_SUCCESS,
          timestamp: new Date('2024-06-15T12:00:00Z'),
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          outcome: 'success'
        });
      }

      const events = await repository.findByDateRange(startDate, endDate, 3, 1);

      expect(events.length).toBeLessThanOrEqual(3);
    });
  });

  describe('findByUserIdAndDateRange', () => {
    it('should find audit events for specific user within date range', async () => {
      const userId = '123e4567-e89b-12d3-a456-426614174000';
      const startDate = new Date('2024-01-01T00:00:00Z');
      const endDate = new Date('2024-01-31T23:59:59Z');

      await repository.create({
        userId,
        eventType: AuditEventType.LOGIN_SUCCESS,
        timestamp: new Date('2024-01-15T12:00:00Z'),
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      await repository.create({
        userId: 'different-user',
        eventType: AuditEventType.LOGIN_SUCCESS,
        timestamp: new Date('2024-01-15T12:00:00Z'),
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      await repository.create({
        userId,
        eventType: AuditEventType.LOGIN_SUCCESS,
        timestamp: new Date('2024-02-15T12:00:00Z'), // Outside range
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      const events = await repository.findByUserIdAndDateRange(userId, startDate, endDate);

      expect(events).toHaveLength(1);
      expect(events[0].userId).toBe(userId);
      expect(events[0].timestamp.getTime()).toBeGreaterThanOrEqual(startDate.getTime());
      expect(events[0].timestamp.getTime()).toBeLessThanOrEqual(endDate.getTime());
    });
  });

  describe('count', () => {
    it('should return total count of audit events', async () => {
      const initialCount = await repository.count();

      await repository.create({
        userId: 'user1',
        eventType: AuditEventType.LOGIN_SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      await repository.create({
        userId: 'user2',
        eventType: AuditEventType.LOGIN_SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      const finalCount = await repository.count();

      expect(finalCount).toBe(initialCount + 2);
    });
  });

  describe('verifyHashChain', () => {
    it('should verify valid hash chain', async () => {
      // Create a sequence of events
      await repository.create({
        userId: 'user1',
        eventType: AuditEventType.ACCOUNT_CREATED,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      await repository.create({
        userId: 'user1',
        eventType: AuditEventType.LOGIN_SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      await repository.create({
        userId: 'user1',
        eventType: AuditEventType.LOGOUT,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      const verification = await repository.verifyHashChain();

      expect(verification.isValid).toBe(true);
      expect(verification.totalEntries).toBeGreaterThanOrEqual(3);
      expect(verification.brokenLinks).toEqual([]);
    });

    it('should detect broken hash chain when entry is tampered', async () => {
      // Create events
      const event1 = await repository.create({
        userId: 'user1',
        eventType: AuditEventType.ACCOUNT_CREATED,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      await repository.create({
        userId: 'user1',
        eventType: AuditEventType.LOGIN_SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      // Manually tamper with the first event's hash (simulating tampering)
      await testPool.query(
        'UPDATE audit_events SET hash = $1 WHERE id = $2',
        ['tampered_hash_value', event1.id]
      );

      const verification = await repository.verifyHashChain();

      expect(verification.isValid).toBe(false);
      expect(verification.brokenLinks.length).toBeGreaterThan(0);
    });

    it('should return valid result for empty audit log', async () => {
      // Clean all events
      await testPool.query('DELETE FROM audit_events');

      const verification = await repository.verifyHashChain();

      expect(verification.isValid).toBe(true);
      expect(verification.totalEntries).toBe(0);
      expect(verification.brokenLinks).toEqual([]);
    });
  });

  describe('tamper-evident properties', () => {
    it('should produce different hashes for different event data', async () => {
      const event1 = await repository.create({
        userId: 'user1',
        eventType: AuditEventType.LOGIN_SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      const event2 = await repository.create({
        userId: 'user2', // Different user
        eventType: AuditEventType.LOGIN_SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success'
      });

      expect(event1.hash).not.toBe(event2.hash);
    });

    it('should produce different hashes even with same data due to chaining', async () => {
      const params: CreateAuditEventParams = {
        userId: 'user1',
        eventType: AuditEventType.LOGIN_SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success',
        details: { method: 'password' }
      };

      const event1 = await repository.create(params);
      const event2 = await repository.create(params); // Same data

      // Even with identical data, hashes should differ due to chaining
      expect(event1.hash).not.toBe(event2.hash);
    });

    it('should maintain hash chain across multiple events', async () => {
      const events = [];
      
      for (let i = 0; i < 10; i++) {
        const event = await repository.create({
          userId: `user${i}`,
          eventType: AuditEventType.LOGIN_SUCCESS,
          ipAddress: '127.0.0.1',
          userAgent: 'Mozilla/5.0',
          outcome: 'success'
        });
        events.push(event);
      }

      // All hashes should be unique
      const hashes = events.map(e => e.hash);
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(events.length);

      // Verify the chain is valid
      const verification = await repository.verifyHashChain();
      expect(verification.isValid).toBe(true);
    });
  });
});
