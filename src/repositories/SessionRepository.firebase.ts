/**
 * SessionRepository - Firebase Firestore implementation
 * 
 * Implements all database operations for session management using Firebase Firestore:
 * - CRUD operations (create, read, update, delete)
 * - Session invalidation (single and bulk)
 * - Expired session cleanup
 */

import { getFirestore } from '../config/firebase';
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
 * SessionRepository class for Firestore operations on sessions collection
 */
export class SessionRepository {
  private collectionName = 'sessions';

  /**
   * Get Firestore sessions collection reference
   */
  private getCollection() {
    return getFirestore().collection(this.collectionName);
  }

  /**
   * Create a new session in Firestore
   * 
   * @param params - Session creation parameters
   * @returns The created session
   * @throws Error if database operation fails
   */
  async create(params: CreateSessionParams): Promise<Session> {
    const { id, userId, ipAddress, userAgent, expiresAt } = params;

    const sessionData = {
      id,
      userId,
      ipAddress,
      userAgent,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
      invalidated: false
    };

    await this.getCollection().doc(id).set(sessionData);

    return this.mapDocToSession(sessionData);
  }

  /**
   * Find a session by its ID
   * 
   * @param id - Session ID
   * @returns The session if found, null otherwise
   */
  async findById(id: string): Promise<Session | null> {
    const doc = await this.getCollection().doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return this.mapDocToSession(doc.data()!);
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

    const updateData: any = {};

    if (params.expiresAt !== undefined) {
      updateData.expiresAt = params.expiresAt.toISOString();
    }

    if (params.invalidated !== undefined) {
      updateData.invalidated = params.invalidated;
    }

    if (Object.keys(updateData).length === 0) {
      return session;
    }

    await this.getCollection().doc(id).update(updateData);

    const updatedSession = await this.findById(id);
    return updatedSession!;
  }

  /**
   * Delete a session from Firestore
   * 
   * @param id - Session ID
   * @returns True if session was deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const doc = await this.getCollection().doc(id).get();
    
    if (!doc.exists) {
      return false;
    }

    await this.getCollection().doc(id).delete();
    return true;
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
    const snapshot = await this.getCollection()
      .where('userId', '==', userId)
      .where('invalidated', '==', false)
      .get();

    let count = 0;
    const batch = getFirestore().batch();

    snapshot.docs.forEach(doc => {
      if (doc.id !== exceptSessionId) {
        batch.update(doc.ref, { invalidated: true });
        count++;
      }
    });

    if (count > 0) {
      await batch.commit();
    }

    return count;
  }

  /**
   * Clean up expired sessions from Firestore
   * Should be run periodically to remove old session data
   * 
   * @returns Number of sessions deleted
   */
  async cleanupExpired(): Promise<number> {
    const now = new Date().toISOString();
    
    // Get expired sessions
    const expiredSnapshot = await this.getCollection()
      .where('expiresAt', '<', now)
      .get();

    // Get invalidated sessions
    const invalidatedSnapshot = await this.getCollection()
      .where('invalidated', '==', true)
      .get();

    const batch = getFirestore().batch();
    let count = 0;

    expiredSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      count++;
    });

    invalidatedSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      count++;
    });

    if (count > 0) {
      await batch.commit();
    }

    return count;
  }

  /**
   * Find all sessions for a specific user
   * Useful for debugging and administrative purposes
   * 
   * @param userId - User ID
   * @returns Array of sessions for the user
   */
  async findByUserId(userId: string): Promise<Session[]> {
    const snapshot = await this.getCollection()
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    return snapshot.docs.map(doc => this.mapDocToSession(doc.data()));
  }

  /**
   * Count active (non-invalidated, non-expired) sessions for a user
   * 
   * @param userId - User ID
   * @returns Number of active sessions
   */
  async countActiveSessions(userId: string): Promise<number> {
    const now = new Date().toISOString();
    
    const snapshot = await this.getCollection()
      .where('userId', '==', userId)
      .where('invalidated', '==', false)
      .where('expiresAt', '>', now)
      .get();

    return snapshot.size;
  }

  /**
   * Map a Firestore document to a Session object
   * 
   * @param data - Firestore document data
   * @returns Session object
   */
  private mapDocToSession(data: any): Session {
    return {
      id: data.id,
      userId: data.userId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      createdAt: new Date(data.createdAt),
      expiresAt: new Date(data.expiresAt),
      invalidated: data.invalidated || false
    };
  }
}

// Export a singleton instance
export const sessionRepository = new SessionRepository();
