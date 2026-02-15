/**
 * UserRepository - Firebase Firestore implementation
 * 
 * Implements all database operations for user management using Firebase Firestore:
 * - CRUD operations (create, read, update)
 * - Failed login attempt tracking
 * - Account locking/unlocking
 */

import { getFirestore } from '../config/firebase';
import { User, Address, Role } from '../types/models';
import { v4 as uuidv4 } from 'uuid';

/**
 * Parameters for creating a new user
 */
export interface CreateUserParams {
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  phoneNumber: string;
  address: Address;
  role?: Role;
}

/**
 * Parameters for updating a user
 */
export interface UpdateUserParams {
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: Address;
}

/**
 * UserRepository class for Firestore operations on users collection
 */
export class UserRepository {
  private collectionName = 'users';

  /**
   * Get Firestore users collection reference
   */
  private getCollection() {
    return getFirestore().collection(this.collectionName);
  }

  /**
   * Create a new user in Firestore
   * 
   * @param params - User creation parameters
   * @returns The created user
   * @throws Error if email already exists or database operation fails
   */
  async create(params: CreateUserParams): Promise<User> {
    const {
      email,
      passwordHash,
      firstName,
      lastName,
      dateOfBirth,
      phoneNumber,
      address,
      role = Role.PATIENT
    } = params;

    // Check if email already exists
    const existingUser = await this.findByEmail(email);
    if (existingUser) {
      throw new Error(`Email ${email} is already registered`);
    }

    const id = uuidv4();
    const now = new Date();

    const userData = {
      id,
      email: email.toLowerCase(),
      passwordHash,
      firstName,
      lastName,
      dateOfBirth: dateOfBirth.toISOString(),
      phoneNumber,
      address,
      role,
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    await this.getCollection().doc(id).set(userData);

    return this.mapDocToUser(userData);
  }

  /**
   * Find a user by their ID
   * 
   * @param id - User UUID
   * @returns The user if found, null otherwise
   */
  async findById(id: string): Promise<User | null> {
    const doc = await this.getCollection().doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return this.mapDocToUser(doc.data()!);
  }

  /**
   * Find a user by their email address
   * 
   * @param email - User email
   * @returns The user if found, null otherwise
   */
  async findByEmail(email: string): Promise<User | null> {
    const snapshot = await this.getCollection()
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    return this.mapDocToUser(snapshot.docs[0].data());
  }

  /**
   * Update a user's information
   * 
   * @param id - User UUID
   * @param params - Fields to update
   * @returns The updated user
   * @throws Error if user not found or email already exists
   */
  async update(id: string, params: UpdateUserParams): Promise<User> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error(`User with id ${id} not found`);
    }

    // Check if email is being changed and if it already exists
    if (params.email && params.email !== user.email) {
      const existingUser = await this.findByEmail(params.email);
      if (existingUser) {
        throw new Error(`Email ${params.email} is already registered`);
      }
    }

    const updateData: any = {
      updatedAt: new Date().toISOString()
    };

    if (params.email !== undefined) {
      updateData.email = params.email.toLowerCase();
    }
    if (params.firstName !== undefined) {
      updateData.firstName = params.firstName;
    }
    if (params.lastName !== undefined) {
      updateData.lastName = params.lastName;
    }
    if (params.phoneNumber !== undefined) {
      updateData.phoneNumber = params.phoneNumber;
    }
    if (params.address !== undefined) {
      updateData.address = params.address;
    }

    await this.getCollection().doc(id).update(updateData);

    const updatedUser = await this.findById(id);
    return updatedUser!;
  }

  /**
   * Increment the failed login attempts counter for a user
   * 
   * @param email - User email
   * @returns The updated failed login attempts count
   */
  async incrementFailedLoginAttempts(email: string): Promise<number> {
    const user = await this.findByEmail(email);
    if (!user) {
      throw new Error(`User with email ${email} not found`);
    }

    const newCount = user.failedLoginAttempts + 1;

    await this.getCollection().doc(user.id).update({
      failedLoginAttempts: newCount,
      updatedAt: new Date().toISOString()
    });

    return newCount;
  }

  /**
   * Reset the failed login attempts counter to zero
   * 
   * @param email - User email
   */
  async resetFailedLoginAttempts(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) {
      return;
    }

    await this.getCollection().doc(user.id).update({
      failedLoginAttempts: 0,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Lock a user account until a specific time
   * 
   * @param email - User email
   * @param lockUntil - Timestamp when the lock expires
   */
  async lockAccount(email: string, lockUntil: Date): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) {
      return;
    }

    await this.getCollection().doc(user.id).update({
      lockedUntil: lockUntil.toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Unlock a user account
   * 
   * @param email - User email
   */
  async unlockAccount(email: string): Promise<void> {
    const user = await this.findByEmail(email);
    if (!user) {
      return;
    }

    await this.getCollection().doc(user.id).update({
      lockedUntil: null,
      failedLoginAttempts: 0,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Check if a user account is currently locked
   * 
   * @param email - User email
   * @returns True if account is locked, false otherwise
   */
  async isAccountLocked(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    
    if (!user || !user.lockedUntil) {
      return false;
    }

    // Check if lock has expired
    if (user.lockedUntil <= new Date()) {
      // Lock has expired, unlock the account
      await this.unlockAccount(email);
      return false;
    }

    return true;
  }

  /**
   * Update a user's password hash
   * 
   * @param id - User UUID
   * @param passwordHash - New password hash
   */
  async updatePasswordHash(id: string, passwordHash: string): Promise<void> {
    await this.getCollection().doc(id).update({
      passwordHash,
      updatedAt: new Date().toISOString()
    });
  }

  /**
   * Get a user's password hash (for verification)
   * 
   * @param id - User UUID
   * @returns The password hash
   */
  async getPasswordHash(id: string): Promise<string | null> {
    const doc = await this.getCollection().doc(id).get();

    if (!doc.exists) {
      return null;
    }

    return doc.data()!.passwordHash || null;
  }

  /**
   * Map a Firestore document to a User object
   * 
   * @param data - Firestore document data
   * @returns User object
   */
  private mapDocToUser(data: any): User {
    return {
      id: data.id,
      email: data.email,
      passwordHash: data.passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      dateOfBirth: new Date(data.dateOfBirth),
      phoneNumber: data.phoneNumber,
      address: data.address,
      role: data.role as Role,
      failedLoginAttempts: data.failedLoginAttempts || 0,
      lockedUntil: data.lockedUntil ? new Date(data.lockedUntil) : null,
      createdAt: new Date(data.createdAt),
      updatedAt: new Date(data.updatedAt)
    };
  }
}

// Export a singleton instance
export const userRepository = new UserRepository();
