/**
 * UserRepository - Data access layer for user operations
 * 
 * Implements all database operations for user management including:
 * - CRUD operations (create, read, update)
 * - Failed login attempt tracking
 * - Account locking/unlocking
 * 
 * All queries use parameterized statements to prevent SQL injection.
 */

import { Pool, PoolClient } from 'pg';
import { pool } from '../db/config';
import { User, Address, Role } from '../types/models';

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
 * UserRepository class for database operations on users table
 */
export class UserRepository {
  private pool: Pool;

  constructor(dbPool: Pool = pool) {
    this.pool = dbPool;
  }

  /**
   * Create a new user in the database
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

    const query = `
      INSERT INTO users (
        email,
        password_hash,
        first_name,
        last_name,
        date_of_birth,
        phone_number,
        address_street,
        address_city,
        address_state,
        address_zip_code,
        address_country,
        role
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      email,
      passwordHash,
      firstName,
      lastName,
      dateOfBirth,
      phoneNumber,
      address.street,
      address.city,
      address.state,
      address.zipCode,
      address.country,
      role
    ];

    try {
      const result = await this.pool.query(query, values);
      return this.mapRowToUser(result.rows[0]);
    } catch (error: any) {
      // Check for unique constraint violation on email
      if (error.code === '23505' && error.constraint === 'users_email_key') {
        throw new Error(`Email ${email} is already registered`);
      }
      throw error;
    }
  }

  /**
   * Find a user by their ID
   * 
   * @param id - User UUID
   * @returns The user if found, null otherwise
   */
  async findById(id: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  /**
   * Find a user by their email address
   * 
   * @param email - User email
   * @returns The user if found, null otherwise
   */
  async findByEmail(email: string): Promise<User | null> {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await this.pool.query(query, [email]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
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

    // Build dynamic update query based on provided fields
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (params.email !== undefined) {
      updates.push(`email = $${paramIndex++}`);
      values.push(params.email);
    }

    if (params.firstName !== undefined) {
      updates.push(`first_name = $${paramIndex++}`);
      values.push(params.firstName);
    }

    if (params.lastName !== undefined) {
      updates.push(`last_name = $${paramIndex++}`);
      values.push(params.lastName);
    }

    if (params.phoneNumber !== undefined) {
      updates.push(`phone_number = $${paramIndex++}`);
      values.push(params.phoneNumber);
    }

    if (params.address !== undefined) {
      updates.push(`address_street = $${paramIndex++}`);
      values.push(params.address.street);
      updates.push(`address_city = $${paramIndex++}`);
      values.push(params.address.city);
      updates.push(`address_state = $${paramIndex++}`);
      values.push(params.address.state);
      updates.push(`address_zip_code = $${paramIndex++}`);
      values.push(params.address.zipCode);
      updates.push(`address_country = $${paramIndex++}`);
      values.push(params.address.country);
    }

    if (updates.length === 0) {
      // No updates provided, return existing user
      return user;
    }

    // Add user ID as the last parameter
    values.push(id);

    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    try {
      const result = await this.pool.query(query, values);
      return this.mapRowToUser(result.rows[0]);
    } catch (error: any) {
      // Check for unique constraint violation on email
      if (error.code === '23505' && error.constraint === 'users_email_key') {
        throw new Error(`Email ${params.email} is already registered`);
      }
      throw error;
    }
  }

  /**
   * Increment the failed login attempts counter for a user
   * 
   * @param email - User email
   * @returns The updated failed login attempts count
   */
  async incrementFailedLoginAttempts(email: string): Promise<number> {
    const query = `
      UPDATE users
      SET failed_login_attempts = failed_login_attempts + 1
      WHERE email = $1
      RETURNING failed_login_attempts
    `;

    const result = await this.pool.query(query, [email]);

    if (result.rows.length === 0) {
      throw new Error(`User with email ${email} not found`);
    }

    return result.rows[0].failed_login_attempts;
  }

  /**
   * Reset the failed login attempts counter to zero
   * 
   * @param email - User email
   */
  async resetFailedLoginAttempts(email: string): Promise<void> {
    const query = `
      UPDATE users
      SET failed_login_attempts = 0
      WHERE email = $1
    `;

    await this.pool.query(query, [email]);
  }

  /**
   * Lock a user account until a specific time
   * 
   * @param email - User email
   * @param lockUntil - Timestamp when the lock expires
   */
  async lockAccount(email: string, lockUntil: Date): Promise<void> {
    const query = `
      UPDATE users
      SET locked_until = $1
      WHERE email = $2
    `;

    await this.pool.query(query, [lockUntil, email]);
  }

  /**
   * Unlock a user account
   * 
   * @param email - User email
   */
  async unlockAccount(email: string): Promise<void> {
    const query = `
      UPDATE users
      SET locked_until = NULL,
          failed_login_attempts = 0
      WHERE email = $1
    `;

    await this.pool.query(query, [email]);
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
    const query = `
      UPDATE users
      SET password_hash = $1
      WHERE id = $2
    `;

    await this.pool.query(query, [passwordHash, id]);
  }

  /**
   * Get a user's password hash (for verification)
   * 
   * @param id - User UUID
   * @returns The password hash
   */
  async getPasswordHash(id: string): Promise<string | null> {
    const query = 'SELECT password_hash FROM users WHERE id = $1';
    const result = await this.pool.query(query, [id]);

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].password_hash;
  }

  /**
   * Map a database row to a User object
   * 
   * @param row - Database row
   * @returns User object
   */
  private mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      firstName: row.first_name,
      lastName: row.last_name,
      dateOfBirth: new Date(row.date_of_birth),
      phoneNumber: row.phone_number,
      address: {
        street: row.address_street,
        city: row.address_city,
        state: row.address_state,
        zipCode: row.address_zip_code,
        country: row.address_country
      },
      role: row.role as Role,
      failedLoginAttempts: row.failed_login_attempts,
      lockedUntil: row.locked_until ? new Date(row.locked_until) : null,
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at)
    };
  }
}

// Export a singleton instance
export const userRepository = new UserRepository();
