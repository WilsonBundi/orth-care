/**
 * Unit tests for SessionRepository
 * 
 * Tests all CRUD operations, session invalidation, and cleanup functionality
 * with proper SQL injection prevention verification.
 */

import { Pool } from 'pg';
import { SessionRepository, CreateSessionParams, UpdateSessionParams } from './SessionRepository';
import { Session } from '../types/models';

describe('SessionRepository', () => {
  let mockPool: jest.Mocked<Pool>;
  let repository: SessionRepository;

  beforeEach(() => {
    // Create a mock pool with query method
    mockPool = {
      query: jest.fn(),
    } as any;

    repository = new SessionRepository(mockPool);
  });

  describe('create', () => {
    it('should create a new session with all required fields', async () => {
      const params: CreateSessionParams = {
        id: 'session-123',
        userId: 'user-456',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        expiresAt: new Date('2024-01-01T12:00:00Z')
      };

      const mockRow = {
        id: params.id,
        user_id: params.userId,
        ip_address: params.ipAddress,
        user_agent: params.userAgent,
        created_at: '2024-01-01T11:30:00Z',
        expires_at: params.expiresAt.toISOString(),
        invalidated: false
      };

      mockPool.query.mockResolvedValue({ rows: [mockRow], rowCount: 1 } as any);

      const result = await repository.create(params);

      expect(result).toEqual({
        id: params.id,
        userId: params.userId,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
        createdAt: new Date('2024-01-01T11:30:00Z'),
        expiresAt: params.expiresAt,
        invalidated: false
      });

      // Verify parameterized query was used
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO sessions'),
        [params.id, params.userId, params.ipAddress, params.userAgent, params.expiresAt]
      );
    });

    it('should use parameterized queries to prevent SQL injection', async () => {
      const params: CreateSessionParams = {
        id: "'; DROP TABLE sessions; --",
        userId: 'user-456',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        expiresAt: new Date()
      };

      mockPool.query.mockResolvedValue({ rows: [{}], rowCount: 1 } as any);

      await repository.create(params);

      // Verify that the malicious input is passed as a parameter, not concatenated
      const call = mockPool.query.mock.calls[0];
      expect(call[0]).not.toContain("DROP TABLE");
      expect(call[1]).toContain(params.id);
    });
  });

  describe('findById', () => {
    it('should return a session when found', async () => {
      const sessionId = 'session-123';
      const mockRow = {
        id: sessionId,
        user_id: 'user-456',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        created_at: '2024-01-01T11:30:00Z',
        expires_at: '2024-01-01T12:00:00Z',
        invalidated: false
      };

      mockPool.query.mockResolvedValue({ rows: [mockRow], rowCount: 1 } as any);

      const result = await repository.findById(sessionId);

      expect(result).toEqual({
        id: sessionId,
        userId: 'user-456',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date('2024-01-01T11:30:00Z'),
        expiresAt: new Date('2024-01-01T12:00:00Z'),
        invalidated: false
      });

      expect(mockPool.query).toHaveBeenCalledWith(
        'SELECT * FROM sessions WHERE id = $1',
        [sessionId]
      );
    });

    it('should return null when session not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await repository.findById('nonexistent');

      expect(result).toBeNull();
    });

    it('should use parameterized queries to prevent SQL injection', async () => {
      const maliciousId = "' OR '1'='1";
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      await repository.findById(maliciousId);

      const call = mockPool.query.mock.calls[0];
      expect(call[0]).toBe('SELECT * FROM sessions WHERE id = $1');
      expect(call[1]).toEqual([maliciousId]);
    });
  });

  describe('update', () => {
    it('should update session expiration time', async () => {
      const sessionId = 'session-123';
      const existingSession = {
        id: sessionId,
        user_id: 'user-456',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        created_at: '2024-01-01T11:30:00Z',
        expires_at: '2024-01-01T12:00:00Z',
        invalidated: false
      };

      const newExpiresAt = new Date('2024-01-01T12:30:00Z');
      const updatedSession = { ...existingSession, expires_at: newExpiresAt.toISOString() };

      mockPool.query
        .mockResolvedValueOnce({ rows: [existingSession], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [updatedSession], rowCount: 1 } as any);

      const result = await repository.update(sessionId, { expiresAt: newExpiresAt });

      expect(result.expiresAt).toEqual(newExpiresAt);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE sessions'),
        [newExpiresAt, sessionId]
      );
    });

    it('should update session invalidated status', async () => {
      const sessionId = 'session-123';
      const existingSession = {
        id: sessionId,
        user_id: 'user-456',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        created_at: '2024-01-01T11:30:00Z',
        expires_at: '2024-01-01T12:00:00Z',
        invalidated: false
      };

      const updatedSession = { ...existingSession, invalidated: true };

      mockPool.query
        .mockResolvedValueOnce({ rows: [existingSession], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [updatedSession], rowCount: 1 } as any);

      const result = await repository.update(sessionId, { invalidated: true });

      expect(result.invalidated).toBe(true);
    });

    it('should update multiple fields at once', async () => {
      const sessionId = 'session-123';
      const existingSession = {
        id: sessionId,
        user_id: 'user-456',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        created_at: '2024-01-01T11:30:00Z',
        expires_at: '2024-01-01T12:00:00Z',
        invalidated: false
      };

      const newExpiresAt = new Date('2024-01-01T12:30:00Z');
      const updatedSession = {
        ...existingSession,
        expires_at: newExpiresAt.toISOString(),
        invalidated: true
      };

      mockPool.query
        .mockResolvedValueOnce({ rows: [existingSession], rowCount: 1 } as any)
        .mockResolvedValueOnce({ rows: [updatedSession], rowCount: 1 } as any);

      const result = await repository.update(sessionId, {
        expiresAt: newExpiresAt,
        invalidated: true
      });

      expect(result.expiresAt).toEqual(newExpiresAt);
      expect(result.invalidated).toBe(true);
    });

    it('should throw error when session not found', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      await expect(
        repository.update('nonexistent', { invalidated: true })
      ).rejects.toThrow('Session with id nonexistent not found');
    });

    it('should return existing session when no updates provided', async () => {
      const sessionId = 'session-123';
      const existingSession = {
        id: sessionId,
        user_id: 'user-456',
        ip_address: '192.168.1.1',
        user_agent: 'Mozilla/5.0',
        created_at: '2024-01-01T11:30:00Z',
        expires_at: '2024-01-01T12:00:00Z',
        invalidated: false
      };

      mockPool.query.mockResolvedValue({ rows: [existingSession], rowCount: 1 } as any);

      const result = await repository.update(sessionId, {});

      expect(result.id).toBe(sessionId);
      // Should only call findById, not update
      expect(mockPool.query).toHaveBeenCalledTimes(1);
    });
  });

  describe('delete', () => {
    it('should delete a session and return true', async () => {
      const sessionId = 'session-123';
      mockPool.query.mockResolvedValue({ rowCount: 1 } as any);

      const result = await repository.delete(sessionId);

      expect(result).toBe(true);
      expect(mockPool.query).toHaveBeenCalledWith(
        'DELETE FROM sessions WHERE id = $1',
        [sessionId]
      );
    });

    it('should return false when session not found', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 0 } as any);

      const result = await repository.delete('nonexistent');

      expect(result).toBe(false);
    });

    it('should use parameterized queries to prevent SQL injection', async () => {
      const maliciousId = "'; DELETE FROM users; --";
      mockPool.query.mockResolvedValue({ rowCount: 0 } as any);

      await repository.delete(maliciousId);

      const call = mockPool.query.mock.calls[0];
      expect(call[0]).toBe('DELETE FROM sessions WHERE id = $1');
      expect(call[1]).toEqual([maliciousId]);
    });
  });

  describe('invalidateAllExcept', () => {
    it('should invalidate all sessions except the specified one', async () => {
      const userId = 'user-456';
      const currentSessionId = 'session-current';

      mockPool.query.mockResolvedValue({ rowCount: 3 } as any);

      const result = await repository.invalidateAllExcept(userId, currentSessionId);

      expect(result).toBe(3);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE sessions'),
        [userId, currentSessionId]
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('SET invalidated = TRUE'),
        [userId, currentSessionId]
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1 AND id != $2 AND invalidated = FALSE'),
        [userId, currentSessionId]
      );
    });

    it('should return 0 when no sessions to invalidate', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 0 } as any);

      const result = await repository.invalidateAllExcept('user-456', 'session-123');

      expect(result).toBe(0);
    });

    it('should only invalidate non-invalidated sessions', async () => {
      const userId = 'user-456';
      const currentSessionId = 'session-current';

      mockPool.query.mockResolvedValue({ rowCount: 2 } as any);

      await repository.invalidateAllExcept(userId, currentSessionId);

      // Verify the query includes the invalidated = FALSE condition
      const call = mockPool.query.mock.calls[0];
      expect(call[0]).toContain('invalidated = FALSE');
    });

    it('should use parameterized queries to prevent SQL injection', async () => {
      const maliciousUserId = "'; DROP TABLE sessions; --";
      const maliciousSessionId = "' OR '1'='1";

      mockPool.query.mockResolvedValue({ rowCount: 0 } as any);

      await repository.invalidateAllExcept(maliciousUserId, maliciousSessionId);

      const call = mockPool.query.mock.calls[0];
      expect(call[0]).not.toContain("DROP TABLE");
      expect(call[1]).toEqual([maliciousUserId, maliciousSessionId]);
    });
  });

  describe('cleanupExpired', () => {
    it('should delete expired and invalidated sessions', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 5 } as any);

      const result = await repository.cleanupExpired();

      expect(result).toBe(5);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('DELETE FROM sessions')
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE expires_at < NOW() OR invalidated = TRUE')
      );
    });

    it('should return 0 when no sessions to clean up', async () => {
      mockPool.query.mockResolvedValue({ rowCount: 0 } as any);

      const result = await repository.cleanupExpired();

      expect(result).toBe(0);
    });

    it('should handle null rowCount', async () => {
      mockPool.query.mockResolvedValue({ rowCount: null } as any);

      const result = await repository.cleanupExpired();

      expect(result).toBe(0);
    });
  });

  describe('findByUserId', () => {
    it('should return all sessions for a user', async () => {
      const userId = 'user-456';
      const mockRows = [
        {
          id: 'session-1',
          user_id: userId,
          ip_address: '192.168.1.1',
          user_agent: 'Mozilla/5.0',
          created_at: '2024-01-01T11:30:00Z',
          expires_at: '2024-01-01T12:00:00Z',
          invalidated: false
        },
        {
          id: 'session-2',
          user_id: userId,
          ip_address: '192.168.1.2',
          user_agent: 'Chrome/90.0',
          created_at: '2024-01-01T10:00:00Z',
          expires_at: '2024-01-01T10:30:00Z',
          invalidated: true
        }
      ];

      mockPool.query.mockResolvedValue({ rows: mockRows, rowCount: 2 } as any);

      const result = await repository.findByUserId(userId);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('session-1');
      expect(result[1].id).toBe('session-2');
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1'),
        [userId]
      );
    });

    it('should return empty array when user has no sessions', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      const result = await repository.findByUserId('user-456');

      expect(result).toEqual([]);
    });

    it('should order sessions by created_at descending', async () => {
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      await repository.findByUserId('user-456');

      const call = mockPool.query.mock.calls[0];
      expect(call[0]).toContain('ORDER BY created_at DESC');
    });
  });

  describe('countActiveSessions', () => {
    it('should return count of active sessions', async () => {
      const userId = 'user-456';
      mockPool.query.mockResolvedValue({ rows: [{ count: '3' }], rowCount: 1 } as any);

      const result = await repository.countActiveSessions(userId);

      expect(result).toBe(3);
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('COUNT(*)'),
        [userId]
      );
      expect(mockPool.query).toHaveBeenCalledWith(
        expect.stringContaining('WHERE user_id = $1 AND invalidated = FALSE AND expires_at > NOW()'),
        [userId]
      );
    });

    it('should return 0 when user has no active sessions', async () => {
      mockPool.query.mockResolvedValue({ rows: [{ count: '0' }], rowCount: 1 } as any);

      const result = await repository.countActiveSessions('user-456');

      expect(result).toBe(0);
    });

    it('should only count non-invalidated and non-expired sessions', async () => {
      await repository.countActiveSessions('user-456');

      const call = mockPool.query.mock.calls[0];
      expect(call[0]).toContain('invalidated = FALSE');
      expect(call[0]).toContain('expires_at > NOW()');
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in all methods', async () => {
      const maliciousInput = "'; DROP TABLE sessions; --";

      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      // Test all methods with malicious input
      await repository.findById(maliciousInput);
      await repository.delete(maliciousInput);
      await repository.findByUserId(maliciousInput);
      await repository.countActiveSessions(maliciousInput);

      // Verify all queries use parameterized statements
      mockPool.query.mock.calls.forEach(call => {
        expect(call[0]).not.toContain("DROP TABLE");
        expect(Array.isArray(call[1])).toBe(true);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle sessions with special characters in user agent', async () => {
      const params: CreateSessionParams = {
        id: 'session-123',
        userId: 'user-456',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) "AppleWebKit"/537.36',
        expiresAt: new Date()
      };

      mockPool.query.mockResolvedValue({ rows: [{}], rowCount: 1 } as any);

      await repository.create(params);

      const call = mockPool.query.mock.calls[0];
      expect(call[1]).toContain(params.userAgent);
    });

    it('should handle IPv6 addresses', async () => {
      const params: CreateSessionParams = {
        id: 'session-123',
        userId: 'user-456',
        ipAddress: '2001:0db8:85a3:0000:0000:8a2e:0370:7334',
        userAgent: 'Mozilla/5.0',
        expiresAt: new Date()
      };

      mockPool.query.mockResolvedValue({ rows: [{}], rowCount: 1 } as any);

      await repository.create(params);

      const call = mockPool.query.mock.calls[0];
      expect(call[1]).toContain(params.ipAddress);
    });

    it('should handle very long session IDs', async () => {
      const longId = 'a'.repeat(255);
      mockPool.query.mockResolvedValue({ rows: [], rowCount: 0 } as any);

      await repository.findById(longId);

      const call = mockPool.query.mock.calls[0];
      expect(call[1]).toEqual([longId]);
    });
  });
});
