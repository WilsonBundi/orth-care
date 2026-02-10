/**
 * Unit tests for UserRepository
 * 
 * Tests all database operations including:
 * - User creation with unique email constraint
 * - Finding users by ID and email
 * - Updating user information
 * - Failed login attempt tracking
 * - Account locking/unlocking
 */

import { Pool } from 'pg';
import { UserRepository, CreateUserParams, UpdateUserParams } from './UserRepository';
import { Role, Address } from '../types/models';

// Test database configuration
const testPool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'patient_portal',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

describe('UserRepository', () => {
  let repository: UserRepository;
  const testAddress: Address = {
    street: '123 Test St',
    city: 'Boston',
    state: 'MA',
    zipCode: '02101',
    country: 'USA'
  };

  beforeAll(async () => {
    repository = new UserRepository(testPool);
  });

  afterAll(async () => {
    // Clean up test data
    await testPool.query('DELETE FROM users WHERE email LIKE $1', ['test-%@example.com']);
    await testPool.end();
  });

  beforeEach(async () => {
    // Clean up before each test
    await testPool.query('DELETE FROM users WHERE email LIKE $1', ['test-%@example.com']);
  });

  describe('create', () => {
    it('should create a new user with all required fields', async () => {
      const params: CreateUserParams = {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hashed_password_123',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        phoneNumber: '555-0100',
        address: testAddress
      };

      const user = await repository.create(params);

      expect(user.id).toBeDefined();
      expect(user.email).toBe(params.email);
      expect(user.passwordHash).toBe(params.passwordHash);
      expect(user.firstName).toBe(params.firstName);
      expect(user.lastName).toBe(params.lastName);
      expect(user.dateOfBirth).toEqual(params.dateOfBirth);
      expect(user.phoneNumber).toBe(params.phoneNumber);
      expect(user.address).toEqual(testAddress);
      expect(user.role).toBe(Role.PATIENT);
      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lockedUntil).toBeNull();
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });

    it('should create a user with custom role if provided', async () => {
      const params: CreateUserParams = {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hashed_password_123',
        firstName: 'Jane',
        lastName: 'Smith',
        dateOfBirth: new Date('1985-05-15'),
        phoneNumber: '555-0200',
        address: testAddress,
        role: Role.PATIENT
      };

      const user = await repository.create(params);

      expect(user.role).toBe(Role.PATIENT);
    });

    it('should throw error when email already exists', async () => {
      const email = `test-${Date.now()}@example.com`;
      const params: CreateUserParams = {
        email,
        passwordHash: 'hashed_password_123',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        phoneNumber: '555-0100',
        address: testAddress
      };

      // Create first user
      await repository.create(params);

      // Attempt to create second user with same email
      await expect(repository.create(params)).rejects.toThrow(
        `Email ${email} is already registered`
      );
    });
  });

  describe('findById', () => {
    it('should find a user by their ID', async () => {
      const params: CreateUserParams = {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hashed_password_123',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        phoneNumber: '555-0100',
        address: testAddress
      };

      const createdUser = await repository.create(params);
      const foundUser = await repository.findById(createdUser.id);

      expect(foundUser).not.toBeNull();
      expect(foundUser!.id).toBe(createdUser.id);
      expect(foundUser!.email).toBe(createdUser.email);
      expect(foundUser!.firstName).toBe(createdUser.firstName);
    });

    it('should return null when user ID does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const user = await repository.findById(nonExistentId);

      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find a user by their email', async () => {
      const email = `test-${Date.now()}@example.com`;
      const params: CreateUserParams = {
        email,
        passwordHash: 'hashed_password_123',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        phoneNumber: '555-0100',
        address: testAddress
      };

      const createdUser = await repository.create(params);
      const foundUser = await repository.findByEmail(email);

      expect(foundUser).not.toBeNull();
      expect(foundUser!.id).toBe(createdUser.id);
      expect(foundUser!.email).toBe(email);
    });

    it('should return null when email does not exist', async () => {
      const user = await repository.findByEmail('nonexistent@example.com');

      expect(user).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user email', async () => {
      const params: CreateUserParams = {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hashed_password_123',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        phoneNumber: '555-0100',
        address: testAddress
      };

      const user = await repository.create(params);
      const newEmail = `test-updated-${Date.now()}@example.com`;

      const updatedUser = await repository.update(user.id, { email: newEmail });

      expect(updatedUser.email).toBe(newEmail);
      expect(updatedUser.firstName).toBe(user.firstName); // Other fields unchanged
    });

    it('should update user name fields', async () => {
      const params: CreateUserParams = {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hashed_password_123',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        phoneNumber: '555-0100',
        address: testAddress
      };

      const user = await repository.create(params);

      const updatedUser = await repository.update(user.id, {
        firstName: 'Jane',
        lastName: 'Smith'
      });

      expect(updatedUser.firstName).toBe('Jane');
      expect(updatedUser.lastName).toBe('Smith');
      expect(updatedUser.email).toBe(user.email); // Other fields unchanged
    });

    it('should update user address', async () => {
      const params: CreateUserParams = {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hashed_password_123',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        phoneNumber: '555-0100',
        address: testAddress
      };

      const user = await repository.create(params);
      const newAddress: Address = {
        street: '456 New Ave',
        city: 'Cambridge',
        state: 'MA',
        zipCode: '02139',
        country: 'USA'
      };

      const updatedUser = await repository.update(user.id, { address: newAddress });

      expect(updatedUser.address).toEqual(newAddress);
    });

    it('should update multiple fields at once', async () => {
      const params: CreateUserParams = {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hashed_password_123',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        phoneNumber: '555-0100',
        address: testAddress
      };

      const user = await repository.create(params);
      const newEmail = `test-updated-${Date.now()}@example.com`;

      const updatedUser = await repository.update(user.id, {
        email: newEmail,
        firstName: 'Jane',
        phoneNumber: '555-9999'
      });

      expect(updatedUser.email).toBe(newEmail);
      expect(updatedUser.firstName).toBe('Jane');
      expect(updatedUser.phoneNumber).toBe('555-9999');
      expect(updatedUser.lastName).toBe(user.lastName); // Unchanged field
    });

    it('should throw error when updating to an existing email', async () => {
      const email1 = `test-${Date.now()}-1@example.com`;
      const email2 = `test-${Date.now()}-2@example.com`;

      const user1 = await repository.create({
        email: email1,
        passwordHash: 'hash1',
        firstName: 'User',
        lastName: 'One',
        dateOfBirth: new Date('1990-01-01'),
        phoneNumber: '555-0100',
        address: testAddress
      });

      await repository.create({
        email: email2,
        passwordHash: 'hash2',
        firstName: 'User',
        lastName: 'Two',
        dateOfBirth: new Date('1991-01-01'),
        phoneNumber: '555-0200',
        address: testAddress
      });

      // Try to update user1's email to user2's email
      await expect(repository.update(user1.id, { email: email2 })).rejects.toThrow(
        `Email ${email2} is already registered`
      );
    });

    it('should throw error when user does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await expect(repository.update(nonExistentId, { firstName: 'Test' })).rejects.toThrow(
        `User with id ${nonExistentId} not found`
      );
    });

    it('should return unchanged user when no updates provided', async () => {
      const params: CreateUserParams = {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hashed_password_123',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        phoneNumber: '555-0100',
        address: testAddress
      };

      const user = await repository.create(params);
      const updatedUser = await repository.update(user.id, {});

      expect(updatedUser).toEqual(user);
    });
  });

  describe('incrementFailedLoginAttempts', () => {
    it('should increment failed login attempts from 0 to 1', async () => {
      const email = `test-${Date.now()}@example.com`;
      await repository.create({
        email,
        passwordHash: 'hash',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        phoneNumber: '555-0100',
        address: testAddress
      });

      const attempts = await repository.incrementFailedLoginAttempts(email);

      expect(attempts).toBe(1);

      const user = await repository.findByEmail(email);
      expect(user!.failedLoginAttempts).toBe(1);
    });

    it('should increment failed login attempts multiple times', async () => {
      const email = `test-${Date.now()}@example.com`;
      await repository.create({
        email,
        passwordHash: 'hash',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        phoneNumber: '555-0100',
        address: testAddress
      });

      await repository.incrementFailedLoginAttempts(email);
      await repository.incrementFailedLoginAttempts(email);
      const attempts = await repository.incrementFailedLoginAttempts(email);

      expect(attempts).toBe(3);
    });

    it('should throw error when user does not exist', async () => {
      await expect(
        repository.incrementFailedLoginAttempts('nonexistent@example.com')
      ).rejects.toThrow('User with email nonexistent@example.com not found');
    });
  });

  describe('resetFailedLoginAttempts', () => {
    it('should reset failed login attempts to 0', async () => {
      const email = `test-${Date.now()}@example.com`;
      await repository.create({
        email,
        passwordHash: 'hash',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        phoneNumber: '555-0100',
        address: testAddress
      });

      // Increment attempts
      await repository.incrementFailedLoginAttempts(email);
      await repository.incrementFailedLoginAttempts(email);

      // Reset attempts
      await repository.resetFailedLoginAttempts(email);

      const user = await repository.findByEmail(email);
      expect(user!.failedLoginAttempts).toBe(0);
    });
  });

  describe('lockAccount', () => {
    it('should lock an account until specified time', async () => {
      const email = `test-${Date.now()}@example.com`;
      await repository.create({
        email,
        passwordHash: 'hash',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        phoneNumber: '555-0100',
        address: testAddress
      });

      const lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes from now
      await repository.lockAccount(email, lockUntil);

      const user = await repository.findByEmail(email);
      expect(user!.lockedUntil).not.toBeNull();
      expect(user!.lockedUntil!.getTime()).toBeCloseTo(lockUntil.getTime(), -2); // Within 100ms
    });
  });

  describe('unlockAccount', () => {
    it('should unlock an account and reset failed attempts', async () => {
      const email = `test-${Date.now()}@example.com`;
      await repository.create({
        email,
        passwordHash: 'hash',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        phoneNumber: '555-0100',
        address: testAddress
      });

      // Lock the account
      const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      await repository.lockAccount(email, lockUntil);
      await repository.incrementFailedLoginAttempts(email);

      // Unlock the account
      await repository.unlockAccount(email);

      const user = await repository.findByEmail(email);
      expect(user!.lockedUntil).toBeNull();
      expect(user!.failedLoginAttempts).toBe(0);
    });
  });

  describe('isAccountLocked', () => {
    it('should return true when account is locked', async () => {
      const email = `test-${Date.now()}@example.com`;
      await repository.create({
        email,
        passwordHash: 'hash',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        phoneNumber: '555-0100',
        address: testAddress
      });

      const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      await repository.lockAccount(email, lockUntil);

      const isLocked = await repository.isAccountLocked(email);
      expect(isLocked).toBe(true);
    });

    it('should return false when account is not locked', async () => {
      const email = `test-${Date.now()}@example.com`;
      await repository.create({
        email,
        passwordHash: 'hash',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        phoneNumber: '555-0100',
        address: testAddress
      });

      const isLocked = await repository.isAccountLocked(email);
      expect(isLocked).toBe(false);
    });

    it('should return false and unlock account when lock has expired', async () => {
      const email = `test-${Date.now()}@example.com`;
      await repository.create({
        email,
        passwordHash: 'hash',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        phoneNumber: '555-0100',
        address: testAddress
      });

      // Lock account with past timestamp
      const lockUntil = new Date(Date.now() - 1000); // 1 second ago
      await repository.lockAccount(email, lockUntil);

      const isLocked = await repository.isAccountLocked(email);
      expect(isLocked).toBe(false);

      // Verify account was unlocked
      const user = await repository.findByEmail(email);
      expect(user!.lockedUntil).toBeNull();
    });

    it('should return false when user does not exist', async () => {
      const isLocked = await repository.isAccountLocked('nonexistent@example.com');
      expect(isLocked).toBe(false);
    });
  });

  describe('updatePasswordHash', () => {
    it('should update the password hash', async () => {
      const email = `test-${Date.now()}@example.com`;
      const user = await repository.create({
        email,
        passwordHash: 'old_hash',
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        phoneNumber: '555-0100',
        address: testAddress
      });

      await repository.updatePasswordHash(user.id, 'new_hash');

      const updatedUser = await repository.findById(user.id);
      expect(updatedUser!.passwordHash).toBe('new_hash');
    });
  });

  describe('getPasswordHash', () => {
    it('should retrieve the password hash', async () => {
      const email = `test-${Date.now()}@example.com`;
      const passwordHash = 'test_hash_123';
      const user = await repository.create({
        email,
        passwordHash,
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: new Date('1990-01-01'),
        phoneNumber: '555-0100',
        address: testAddress
      });

      const retrievedHash = await repository.getPasswordHash(user.id);
      expect(retrievedHash).toBe(passwordHash);
    });

    it('should return null when user does not exist', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';
      const hash = await repository.getPasswordHash(nonExistentId);
      expect(hash).toBeNull();
    });
  });
});
