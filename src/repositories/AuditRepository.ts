/**
 * AuditRepository - Data access layer for audit logging operations
 * 
 * Implements tamper-evident audit logging with:
 * - Sequential ID generation for ordering
 * - Hash chain linking each entry to the previous one
 * - Query methods for security investigations
 * - Immutable entries (no update or delete operations)
 * 
 * All queries use parameterized statements to prevent SQL injection.
 */

import { Pool } from 'pg';
import { pool } from '../db/config';
import { AuditEvent, AuditEventType } from '../types/models';
import { createHash } from 'crypto';

/**
 * Parameters for creating a new audit event
 */
export interface CreateAuditEventParams {
  userId: string | null;
  eventType: AuditEventType;
  timestamp?: Date;
  ipAddress: string;
  userAgent: string;
  outcome: 'success' | 'failure';
  details?: Record<string, any>;
}

/**
 * AuditRepository class for database operations on audit_events table
 * 
 * This repository implements a tamper-evident hash chain where each audit entry
 * contains a hash of the previous entry, making it possible to detect if any
 * entry has been modified or deleted.
 */
export class AuditRepository {
  private pool: Pool;

  constructor(dbPool: Pool = pool) {
    this.pool = dbPool;
  }

  /**
   * Create a new audit event with tamper-evident hash chain
   * 
   * The hash is computed from the previous entry's hash plus the current entry's data,
   * creating a chain that makes tampering detectable.
   * 
   * @param params - Audit event creation parameters
   * @returns The created audit event with sequential ID and hash
   * @throws Error if database operation fails
   */
  async create(params: CreateAuditEventParams): Promise<AuditEvent> {
    const {
      userId,
      eventType,
      timestamp = new Date(),
      ipAddress,
      userAgent,
      outcome,
      details = {}
    } = params;

    // Get the hash of the previous audit entry to create the chain
    const previousHash = await this.getLastHash();

    // Compute hash for this entry
    // Hash includes: previous hash + all current entry data
    const hash = this.computeHash(
      previousHash,
      userId,
      eventType,
      timestamp,
      ipAddress,
      userAgent,
      outcome,
      details
    );

    const query = `
      INSERT INTO audit_events (
        user_id,
        event_type,
        timestamp,
        ip_address,
        user_agent,
        outcome,
        details,
        hash
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      userId,
      eventType,
      timestamp,
      ipAddress,
      userAgent,
      outcome,
      JSON.stringify(details),
      hash
    ];

    const result = await this.pool.query(query, values);
    return this.mapRowToAuditEvent(result.rows[0]);
  }

  /**
   * Find audit events by user ID
   * 
   * @param userId - User UUID
   * @param limit - Maximum number of results (default: 100)
   * @param offset - Number of results to skip (default: 0)
   * @returns Array of audit events for the user, ordered by timestamp descending
   */
  async findByUserId(
    userId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditEvent[]> {
    const query = `
      SELECT * FROM audit_events
      WHERE user_id = $1
      ORDER BY timestamp DESC, id DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.pool.query(query, [userId, limit, offset]);
    return result.rows.map(row => this.mapRowToAuditEvent(row));
  }

  /**
   * Find audit events by event type
   * 
   * @param eventType - Type of audit event
   * @param limit - Maximum number of results (default: 100)
   * @param offset - Number of results to skip (default: 0)
   * @returns Array of audit events of the specified type, ordered by timestamp descending
   */
  async findByType(
    eventType: AuditEventType,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditEvent[]> {
    const query = `
      SELECT * FROM audit_events
      WHERE event_type = $1
      ORDER BY timestamp DESC, id DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.pool.query(query, [eventType, limit, offset]);
    return result.rows.map(row => this.mapRowToAuditEvent(row));
  }

  /**
   * Find audit events within a date range
   * 
   * @param startDate - Start of date range (inclusive)
   * @param endDate - End of date range (inclusive)
   * @param limit - Maximum number of results (default: 100)
   * @param offset - Number of results to skip (default: 0)
   * @returns Array of audit events within the date range, ordered by timestamp descending
   */
  async findByDateRange(
    startDate: Date,
    endDate: Date,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditEvent[]> {
    const query = `
      SELECT * FROM audit_events
      WHERE timestamp >= $1 AND timestamp <= $2
      ORDER BY timestamp DESC, id DESC
      LIMIT $3 OFFSET $4
    `;

    const result = await this.pool.query(query, [startDate, endDate, limit, offset]);
    return result.rows.map(row => this.mapRowToAuditEvent(row));
  }

  /**
   * Find audit events by user ID and date range
   * Useful for security investigations
   * 
   * @param userId - User UUID
   * @param startDate - Start of date range (inclusive)
   * @param endDate - End of date range (inclusive)
   * @param limit - Maximum number of results (default: 100)
   * @param offset - Number of results to skip (default: 0)
   * @returns Array of audit events, ordered by timestamp descending
   */
  async findByUserIdAndDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
    limit: number = 100,
    offset: number = 0
  ): Promise<AuditEvent[]> {
    const query = `
      SELECT * FROM audit_events
      WHERE user_id = $1 AND timestamp >= $2 AND timestamp <= $3
      ORDER BY timestamp DESC, id DESC
      LIMIT $4 OFFSET $5
    `;

    const result = await this.pool.query(query, [userId, startDate, endDate, limit, offset]);
    return result.rows.map(row => this.mapRowToAuditEvent(row));
  }

  /**
   * Find an audit event by its ID
   * 
   * @param id - Audit event ID (sequential)
   * @returns The audit event if found, null otherwise
   */
  async findById(id: number): Promise<AuditEvent | null> {
    const query = 'SELECT * FROM audit_events WHERE id = $1';
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToAuditEvent(result.rows[0]);
  }

  /**
   * Get the total count of audit events
   * 
   * @returns Total number of audit events
   */
  async count(): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM audit_events';
    const result = await this.pool.query(query);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Verify the integrity of the audit log hash chain
   * 
   * This method checks that each entry's hash correctly chains to the previous entry.
   * If any entry has been tampered with, the hash chain will be broken.
   * 
   * @returns Object with verification result and details of any broken links
   */
  async verifyHashChain(): Promise<{
    isValid: boolean;
    totalEntries: number;
    brokenLinks: Array<{ id: number; expectedHash: string; actualHash: string }>;
  }> {
    const query = 'SELECT * FROM audit_events ORDER BY id ASC';
    const result = await this.pool.query(query);

    const brokenLinks: Array<{ id: number; expectedHash: string; actualHash: string }> = [];
    let previousHash = '';

    for (const row of result.rows) {
      const event = this.mapRowToAuditEvent(row);
      
      // Compute what the hash should be
      const expectedHash = this.computeHash(
        previousHash,
        event.userId,
        event.eventType,
        event.timestamp,
        event.ipAddress,
        event.userAgent,
        event.outcome,
        event.details
      );

      // Check if it matches the stored hash
      if (expectedHash !== event.hash) {
        brokenLinks.push({
          id: event.id,
          expectedHash,
          actualHash: event.hash
        });
      }

      previousHash = event.hash;
    }

    return {
      isValid: brokenLinks.length === 0,
      totalEntries: result.rows.length,
      brokenLinks
    };
  }

  /**
   * Get the hash of the most recent audit entry
   * Used to chain new entries to the existing log
   * 
   * @returns The hash of the last entry, or empty string if no entries exist
   */
  private async getLastHash(): Promise<string> {
    const query = 'SELECT hash FROM audit_events ORDER BY id DESC LIMIT 1';
    const result = await this.pool.query(query);

    if (result.rows.length === 0) {
      return ''; // First entry in the chain
    }

    return result.rows[0].hash;
  }

  /**
   * Compute the tamper-evident hash for an audit entry
   * 
   * The hash is computed using SHA-256 over:
   * - Previous entry's hash (creating the chain)
   * - All fields of the current entry
   * 
   * @param previousHash - Hash of the previous entry
   * @param userId - User ID (or null)
   * @param eventType - Type of event
   * @param timestamp - Event timestamp
   * @param ipAddress - IP address
   * @param userAgent - User agent string
   * @param outcome - Success or failure
   * @param details - Additional event details
   * @returns SHA-256 hash as hex string
   */
  private computeHash(
    previousHash: string,
    userId: string | null,
    eventType: AuditEventType,
    timestamp: Date,
    ipAddress: string,
    userAgent: string,
    outcome: 'success' | 'failure',
    details: Record<string, any>
  ): string {
    // Create a deterministic string representation of the entry
    const data = [
      previousHash,
      userId || 'null',
      eventType,
      timestamp.toISOString(),
      ipAddress,
      userAgent,
      outcome,
      JSON.stringify(details)
    ].join('|');

    // Compute SHA-256 hash
    return createHash('sha256').update(data).digest('hex');
  }

  /**
   * Map a database row to an AuditEvent object
   * 
   * @param row - Database row
   * @returns AuditEvent object
   */
  private mapRowToAuditEvent(row: any): AuditEvent {
    return {
      id: row.id,
      userId: row.user_id,
      eventType: row.event_type as AuditEventType,
      timestamp: new Date(row.timestamp),
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      outcome: row.outcome as 'success' | 'failure',
      details: typeof row.details === 'string' ? JSON.parse(row.details) : row.details,
      hash: row.hash
    };
  }
}

// Export a singleton instance
export const auditRepository = new AuditRepository();
