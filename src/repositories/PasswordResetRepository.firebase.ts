/**
 * PasswordResetRepository - Firebase Firestore implementation
 * 
 * Manages password reset tokens for secure password recovery
 */

import { getFirestore } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';

export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  email: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export class PasswordResetRepository {
  private collectionName = 'password_reset_tokens';

  private getCollection() {
    return getFirestore().collection(this.collectionName);
  }

  /**
   * Create a new password reset token
   */
  async create(userId: string, email: string, token: string, expiresAt: Date): Promise<PasswordResetToken> {
    const id = uuidv4();
    const now = new Date();

    const tokenData = {
      id,
      userId,
      token,
      email: email.toLowerCase(),
      expiresAt: expiresAt.toISOString(),
      used: false,
      createdAt: now.toISOString()
    };

    await this.getCollection().doc(id).set(tokenData);

    return this.mapDocToToken(tokenData);
  }

  /**
   * Find a token by its value
   */
  async findByToken(token: string): Promise<PasswordResetToken | null> {
    const snapshot = await this.getCollection()
      .where('token', '==', token)
      .where('used', '==', false)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return this.mapDocToToken(snapshot.docs[0].data());
  }

  /**
   * Mark a token as used
   */
  async markAsUsed(tokenId: string): Promise<void> {
    await this.getCollection().doc(tokenId).update({
      used: true
    });
  }

  /**
   * Delete expired tokens (cleanup)
   */
  async deleteExpired(): Promise<number> {
    const now = new Date().toISOString();
    
    const snapshot = await this.getCollection()
      .where('expiresAt', '<', now)
      .get();

    const batch = getFirestore().batch();
    let count = 0;

    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
      count++;
    });

    if (count > 0) {
      await batch.commit();
    }

    return count;
  }

  /**
   * Invalidate all tokens for a user
   */
  async invalidateUserTokens(userId: string): Promise<void> {
    const snapshot = await this.getCollection()
      .where('userId', '==', userId)
      .where('used', '==', false)
      .get();

    const batch = getFirestore().batch();

    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { used: true });
    });

    if (!snapshot.empty) {
      await batch.commit();
    }
  }

  private mapDocToToken(data: any): PasswordResetToken {
    return {
      id: data.id,
      userId: data.userId,
      token: data.token,
      email: data.email,
      expiresAt: new Date(data.expiresAt),
      used: data.used,
      createdAt: new Date(data.createdAt)
    };
  }
}

export const passwordResetRepository = new PasswordResetRepository();
