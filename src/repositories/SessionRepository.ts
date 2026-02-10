/**
 * SessionRepository - Data access layer for session operations
 * 
 * Implements all database operations for session management including:
 * - CRUD operations (create, read, update, delete)
 * - Session invalidation (single and bulk)
 * - Expired session cleanup
 * 
 * All queries use parameterized statements to prevent SQL injection.
 */

import { Pool } from 'pg';
import { pool } from '../db/config';
import { Session } from '../types/models';

/**
 * Parameters for creating a new session
 */
export interface CreateSessionParams {
  id: string;
  userId: string;
  ipAddress: string;
  userAgent: string;
  expiresAt: Date;
}

/**
 * Parameters for updating a session
 */
export interface UpdateSessionParams {
  expiresAt?: Date;
  invalidated?: boolean;
}

/**
 * SessionRepository class for database operations on sessions table
 */
export class SessionRepository {
  private pool: Pool;

  constructor(dbPool: Pool = pool) {
    this.pool = dbPool;
  }

  /**
   * Create a new session in the database
   * 
   * @param params - Session creation parameters
   * @returns The created session
   * @throws Error if database operation fails
   */
  async create(params: CreateSessionParams): Promise<Session> {
    const { id, userId, ipAddress, userAgent, expiresAt } = params;

    const query = `
      INSERT INTO sessions (
        id,
        user_id,
        ip_address,
        user_agent,
        expires_at
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [id, userId, ipAddress, userAgent, expiresAt];

    const result = await this.pool.query(query, values);
    return this.mapRowToSession(result.rows[0]);
  }

  /**
   * Find a session by its ID
   * 
   * @param id - Session ID
   * @returns The session if found, null otherwise
   */
  async findById(id: string): Promise<Session | null> {
    const query = 'SELECT * FROM sessions WHERE id = $1';
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToSession(result.rows[0]);
  }

  /**
   * Update a session's information
   * 
   * @param id - Session ID
   * @param params - Fields to update
   * @returns The updated session
   * @throws Error if session not found
   */
  async update(id: string, params: UpdateSessionParams): Promise<Session> {
    const session = await this.findById(id);
    if (!session) {
      throw new Error(`Session with id ${id} not found`);
    }

    // Build dynamic update query based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.expiresAt !== undefined) {
      updates.push(`expires_at = $${paramIndex++}`);
      values.push(params.expiresAt);
    }

    if (params.invalidated !== undefined) {
      updates.push(`invalidated = $${paramIndex++}`);
      values.push(params.invalidated);
    }

    if (updates.length === 0) {
      // No updates provided, return existing session
      return session;
    }

    // Add session ID as the last parameter
    values.push(id);

    const query = `
      UPDATE sessions
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);
    return this.mapRowToSession(result.rows[0]);
  }

  /**
   * Delete a session from the database
   * 
   * @param id - Session ID
   * @returns True if session was deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM sessions WHERE id = $1';
    const result = await this.pool.query(query, [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Invalidate all sessions for a user except the specified session
   * Used when a user changes their password
   * 
   * @param userId - User ID
   * @param exceptSessionId - Session ID to keep active
   * @returns Number of sessions invalidated
   */
  async invalidateAllExcept(userId: string, exceptSessionId: string): Promise<number> {
    const query = `
      UPDATE sessions
      SET invalidated = TRUE
      WHERE user_id = $1 AND id != $2 AND invalidated = FALSE
    `;

    const result = await this.pool.query(query, [userId, exceptSessionId]);
    return result.rowCount || 0;
  }

  /**
   * Clean up expired sessions from the database
   * Should be run periodically to remove old session data
   * 
   * @returns Number of sessions deleted
   */
  async cleanupExpired(): Promise<number> {
    const query = `
      DELETE FROM sessions
      WHERE expires_at < NOW() OR invalidated = TRUE
    `;

    const result = await this.pool.query(query);
    return result.rowCount || 0;
  }

  /**
   * Find all sessions for a specific user
   * Useful for debugging and administrative purposes
   * 
   * @param userId - User ID
   * @returns Array of sessions for the user
   */
  async findByUserId(userId: string): Promise<Session[]> {
    const query = 'SELECT * FROM sessions WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await this.pool.query(query, [userId]);
    return result.rows.map(row => this.mapRowToSession(row));
  }

  /**
   * Count active (non-invalidated, non-expired) sessions for a user
   * 
   * @param userId - User ID
   * @returns Number of active sessions
   */
  async countActiveSessions(userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM sessions
      WHERE user_id = $1 AND invalidated = FALSE AND expires_at > NOW()
    `;

    const result = await this.pool.query(query, [userId]);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Map a database row to a Session object
   * 
   * @param row - Database row
   * @returns Session object
   */
  private mapRowToSession(row: any): Session {
    return {
      id: row.id,
      userId: row.user_id,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      createdAt: new Date(row.created_at),
      expiresAt: new Date(row.expires_at),
      invalidated: row.invalidated
    };
  }
}

// Export a singleton instance
export const sessionRepository = new SessionRepository();
