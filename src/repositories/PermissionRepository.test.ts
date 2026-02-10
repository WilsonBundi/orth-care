/**
 * Unit tests for PermissionRepository
 * 
 * Tests cover:
 * - Finding permissions by role
 * - Seeding initial permissions
 * - Checking specific permissions
 * - SQL injection prevention
 */

import { Pool } from 'pg';
import { PermissionRepository } from './PermissionRepository';
import { Role } from '../types/models';

describe('PermissionRepository', () => {
  let pool: Pool;
  let repository: PermissionRepository;

  beforeAll(() => {
    // Use the actual database pool for integration testing
    pool = new Pool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'patient_portal_test',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres'
    });

    repository = new PermissionRepository(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    // Clean up permissions table before each test
    await pool.query('DELETE FROM permissions');
  });

  describe('seed', () => {
    it('should seed initial patient permissions', async () => {
      const insertedCount = await repository.seed();

      // Should insert 3 patient permissions
      expect(insertedCount).toBe(3);

      // Verify permissions were created
      const permissions = await repository.findByRole(Role.PATIENT);
      expect(permissions).toHaveLength(3);

      // Verify specific permissions exist
      const permissionStrings = permissions.map(p => `${p.action}:${p.resource}`);
      expect(permissionStrings).toContain('read:own_profile');
      expect(permissionStrings).toContain('write:own_profile');
      expect(permissionStrings).toContain('read:dashboard');
    });

    it('should not duplicate permissions on multiple seed calls', async () => {
      // First seed
      const firstCount = await repository.seed();
      expect(firstCount).toBe(3);

      // Second seed should not insert duplicates
      const secondCount = await repository.seed();
      expect(secondCount).toBe(0);

      // Should still have only 3 permissions
      const permissions = await repository.findByRole(Role.PATIENT);
      expect(permissions).toHaveLength(3);
    });

    it('should handle partial seeding if some permissions already exist', async () => {
      // Manually insert one permission
      await pool.query(
        `INSERT INTO permissions (role, action, resource) VALUES ($1, $2, $3)`,
        [Role.PATIENT, 'read', 'own_profile']
      );

      // Seed should insert the remaining 2
      const insertedCount = await repository.seed();
      expect(insertedCount).toBe(2);

      // Should have all 3 permissions
      const permissions = await repository.findByRole(Role.PATIENT);
      expect(permissions).toHaveLength(3);
    });
  });

  describe('findByRole', () => {
    beforeEach(async () => {
      // Seed permissions for testing
      await repository.seed();
    });

    it('should find all permissions for patient role', async () => {
      const permissions = await repository.findByRole(Role.PATIENT);

      expect(permissions).toHaveLength(3);
      expect(permissions.every(p => p.role === Role.PATIENT)).toBe(true);
    });

    it('should return empty array for role with no permissions', async () => {
      // Query a role that doesn't have permissions
      const permissions = await repository.findByRole('doctor' as Role);

      expect(permissions).toHaveLength(0);
    });

    it('should return permissions sorted by resource and action', async () => {
      const permissions = await repository.findByRole(Role.PATIENT);

      // Verify ordering (dashboard comes before own_profile alphabetically)
      expect(permissions[0].resource).toBe('dashboard');
      expect(permissions[1].resource).toBe('own_profile');
      expect(permissions[2].resource).toBe('own_profile');
    });

    it('should prevent SQL injection in role parameter', async () => {
      // Attempt SQL injection
      const maliciousRole = "patient' OR '1'='1" as Role;

      // Should not throw and should return empty array (no match)
      const permissions = await repository.findByRole(maliciousRole);
      expect(permissions).toHaveLength(0);
    });
  });

  describe('hasPermission', () => {
    beforeEach(async () => {
      await repository.seed();
    });

    it('should return true for existing permission', async () => {
      const hasPermission = await repository.hasPermission(
        Role.PATIENT,
        'read',
        'own_profile'
      );

      expect(hasPermission).toBe(true);
    });

    it('should return false for non-existing permission', async () => {
      const hasPermission = await repository.hasPermission(
        Role.PATIENT,
        'delete',
        'own_profile'
      );

      expect(hasPermission).toBe(false);
    });

    it('should return false for non-existing resource', async () => {
      const hasPermission = await repository.hasPermission(
        Role.PATIENT,
        'read',
        'medical_records'
      );

      expect(hasPermission).toBe(false);
    });

    it('should prevent SQL injection in action parameter', async () => {
      const maliciousAction = "read' OR '1'='1";

      const hasPermission = await repository.hasPermission(
        Role.PATIENT,
        maliciousAction,
        'own_profile'
      );

      expect(hasPermission).toBe(false);
    });

    it('should prevent SQL injection in resource parameter', async () => {
      const maliciousResource = "own_profile' OR '1'='1";

      const hasPermission = await repository.hasPermission(
        Role.PATIENT,
        'read',
        maliciousResource
      );

      expect(hasPermission).toBe(false);
    });
  });

  describe('findAll', () => {
    it('should return empty array when no permissions exist', async () => {
      const permissions = await repository.findAll();
      expect(permissions).toHaveLength(0);
    });

    it('should return all permissions', async () => {
      await repository.seed();

      const permissions = await repository.findAll();
      expect(permissions).toHaveLength(3);
    });

    it('should return permissions sorted by role, resource, and action', async () => {
      await repository.seed();

      const permissions = await repository.findAll();

      // All should be patient role
      expect(permissions.every(p => p.role === Role.PATIENT)).toBe(true);

      // Should be sorted by resource then action
      expect(permissions[0].resource).toBe('dashboard');
      expect(permissions[1].resource).toBe('own_profile');
      expect(permissions[2].resource).toBe('own_profile');
    });
  });

  describe('countByRole', () => {
    beforeEach(async () => {
      await repository.seed();
    });

    it('should count permissions for patient role', async () => {
      const count = await repository.countByRole(Role.PATIENT);
      expect(count).toBe(3);
    });

    it('should return 0 for role with no permissions', async () => {
      const count = await repository.countByRole('doctor' as Role);
      expect(count).toBe(0);
    });

    it('should prevent SQL injection in role parameter', async () => {
      const maliciousRole = "patient' OR '1'='1" as Role;

      const count = await repository.countByRole(maliciousRole);
      expect(count).toBe(0);
    });
  });

  describe('Permission structure', () => {
    beforeEach(async () => {
      await repository.seed();
    });

    it('should return permissions with all required fields', async () => {
      const permissions = await repository.findByRole(Role.PATIENT);
      const permission = permissions[0];

      expect(permission).toHaveProperty('id');
      expect(permission).toHaveProperty('role');
      expect(permission).toHaveProperty('action');
      expect(permission).toHaveProperty('resource');

      expect(typeof permission.id).toBe('string');
      expect(typeof permission.role).toBe('string');
      expect(typeof permission.action).toBe('string');
      expect(typeof permission.resource).toBe('string');
    });

    it('should have valid UUID for id field', async () => {
      const permissions = await repository.findByRole(Role.PATIENT);
      const permission = permissions[0];

      // UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(permission.id).toMatch(uuidRegex);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty role string', async () => {
      const permissions = await repository.findByRole('' as Role);
      expect(permissions).toHaveLength(0);
    });

    it('should handle special characters in role', async () => {
      const permissions = await repository.findByRole('patient@#$%' as Role);
      expect(permissions).toHaveLength(0);
    });

    it('should handle very long role string', async () => {
      const longRole = 'a'.repeat(1000) as Role;
      const permissions = await repository.findByRole(longRole);
      expect(permissions).toHaveLength(0);
    });

    it('should handle empty action string in hasPermission', async () => {
      await repository.seed();

      const hasPermission = await repository.hasPermission(
        Role.PATIENT,
        '',
        'own_profile'
      );

      expect(hasPermission).toBe(false);
    });

    it('should handle empty resource string in hasPermission', async () => {
      await repository.seed();

      const hasPermission = await repository.hasPermission(
        Role.PATIENT,
        'read',
        ''
      );

      expect(hasPermission).toBe(false);
    });
  });

  describe('Database constraints', () => {
    it('should enforce unique constraint on (role, action, resource)', async () => {
      // Insert a permission
      await pool.query(
        `INSERT INTO permissions (role, action, resource) VALUES ($1, $2, $3)`,
        [Role.PATIENT, 'read', 'test_resource']
      );

      // Attempt to insert duplicate should fail
      await expect(
        pool.query(
          `INSERT INTO permissions (role, action, resource) VALUES ($1, $2, $3)`,
          [Role.PATIENT, 'read', 'test_resource']
        )
      ).rejects.toThrow();
    });

    it('should allow same action/resource for different roles', async () => {
      // Insert permission for patient
      await pool.query(
        `INSERT INTO permissions (role, action, resource) VALUES ($1, $2, $3)`,
        [Role.PATIENT, 'read', 'test_resource']
      );

      // Insert same action/resource for different role should succeed
      await expect(
        pool.query(
          `INSERT INTO permissions (role, action, resource) VALUES ($1, $2, $3)`,
          ['doctor', 'read', 'test_resource']
        )
      ).resolves.not.toThrow();
    });
  });
});
