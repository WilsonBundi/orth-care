/**
 * AuditRepository - Firebase Firestore implementation
 * 
 * Implements tamper-evident audit logging with:
 * - Auto-generated IDs for ordering
 * - Hash chain linking each entry to the previous one
 * - Query methods for security investigations
 * - Immutable entries (no update or delete operations)
 */

import { getFirestore } from '../config/firebase';
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
 * AuditRepository class for Firestore operations on audit_events collection
 * 
 * This repository implements a tamper-evident hash chain where each audit entry
 * contains a hash of the previous entry, making it possible to detect if any
 * entry has been modified or deleted.
 */
export class AuditRepository {
  private collectionName = 'audit_events';
  private counterDoc = '_counters/audit_events';

  /**
   * Get Firestore audit_events collection reference
   */
  private getCollection() {
    return getFirestore().collection(this.collectionName);
  }

  /**
   * Get next sequential ID for audit events
   */
  private async getNextId(): Promise<number> {
    const db = getFirestore();
    const counterRef = db.doc(this.counterDoc);
    
    try {
      const result = await db.runTransaction(async (transaction) => {
        const counterDoc = await transaction.get(counterRef);
        const currentValue = counterDoc.exists ? (counterDoc.data()?.value || 0) : 0;
        const nextValue = currentValue + 1;
        
        transaction.set(counterRef, { value: nextValue }, { merge: true });
        return nextValue;
      });
      
      return result;
    } catch (error) {
      console.error('Error getting next audit ID:', error);
      throw error;
    }
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

    // Get sequential ID
    const id = await this.getNextId();

    // Get the hash of the previous audit entry to create the chain
    const previousHash = await this.getLastHash();

    // Compute hash for this entry
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

    const auditData = {
      id,
      userId,
      eventType,
      timestamp: timestamp.toISOString(),
      ipAddress,
      userAgent,
      outcome,
      details,
      hash
    };

    await this.getCollection().doc(id.toString()).set(auditData);

    return this.mapDocToAuditEvent(auditData);
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
    const snapshot = await this.getCollection()
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .orderBy('id', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    return snapshot.docs.map(doc => this.mapDocToAuditEvent(doc.data()));
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
    const snapshot = await this.getCollection()
      .where('eventType', '==', eventType)
      .orderBy('timestamp', 'desc')
      .orderBy('id', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    return snapshot.docs.map(doc => this.mapDocToAuditEvent(doc.data()));
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
    const snapshot = await this.getCollection()
      .where('timestamp', '>=', startDate.toISOString())
      .where('timestamp', '<=', endDate.toISOString())
      .orderBy('timestamp', 'desc')
      .orderBy('id', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    return snapshot.docs.map(doc => this.mapDocToAuditEvent(doc.data()));
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
    const snapshot = await this.getCollection()
      .where('userId', '==', userId)
      .where('timestamp', '>=', startDate.toISOString())
      .where('timestamp', '<=', endDate.toISOString())
      .orderBy('timestamp', 'desc')
      .orderBy('id', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    return snapshot.docs.map(doc => this.mapDocToAuditEvent(doc.data()));
  }

  /**
   * Find an audit event by its ID
   * 
   * @param id - Audit event ID (sequential)
   * @returns The audit event if found, null otherwise
   */
  async findById(id: number): Promise<AuditEvent | null> {
    const doc = await this.getCollection().doc(id.toString()).get();

    if (!doc.exists) {
      return null;
    }

    return this.mapDocToAuditEvent(doc.data()!);
  }

  /**
   * Get the total count of audit events
   * 
   * @returns Total number of audit events
   */
  async count(): Promise<number> {
    const snapshot = await this.getCollection().count().get();
    return snapshot.data().count;
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
    const snapshot = await this.getCollection().orderBy('id', 'asc').get();

    const brokenLinks: Array<{ id: number; expectedHash: string; actualHash: string }> = [];
    let previousHash = '';

    for (const doc of snapshot.docs) {
      const event = this.mapDocToAuditEvent(doc.data());
      
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
      totalEntries: snapshot.size,
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
    const snapshot = await this.getCollection()
      .orderBy('id', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return ''; // First entry in the chain
    }

    return snapshot.docs[0].data().hash;
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
   * Map a Firestore document to an AuditEvent object
   * 
   * @param data - Firestore document data
   * @returns AuditEvent object
   */
  private mapDocToAuditEvent(data: any): AuditEvent {
    return {
      id: data.id,
      userId: data.userId,
      eventType: data.eventType as AuditEventType,
      timestamp: new Date(data.timestamp),
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      outcome: data.outcome as 'success' | 'failure',
      details: data.details || {},
      hash: data.hash
    };
  }
}

// Export a singleton instance
export const auditRepository = new AuditRepository();
