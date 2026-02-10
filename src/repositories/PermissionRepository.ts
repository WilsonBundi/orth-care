/**
 * PermissionRepository - Data access layer for permission operations
 * 
 * Implements all database operations for role-based access control including:
 * - Query permissions by role
 * - Seed initial permissions
 * 
 * All queries use parameterized statements to prevent SQL injection.
 */

import { Pool } from 'pg';
import { pool } from '../db/config';
import { Permission, Role } from '../types/models';

/**
 * Initial permissions for the patient role
 * These are seeded into the database on initialization
 */
const PATIENT_PERMISSIONS = [
  { role: Role.PATIENT, action: 'read', resource: 'own_profile' },
  { role: Role.PATIENT, action: 'write', resource: 'own_profile' },
  { role: Role.PATIENT, action: 'read', resource: 'dashboard' }
];

/**
 * PermissionRepository class for database operations on permissions table
 */
export class PermissionRepository {
  private pool: Pool;

  constructor(dbPool: Pool = pool) {
    this.pool = dbPool;
  }

  /**
   * Find all permissions for a specific role
   * 
   * @param role - The role to query permissions for
   * @returns Array of permissions for the role
   */
  async findByRole(role: Role): Promise<Permission[]> {
    const query = `
      SELECT * FROM permissions
      WHERE role = $1
      ORDER BY resource, action
    `;

    const result = await this.pool.query(query, [role]);
    return result.rows.map(row => this.mapRowToPermission(row));
  }

  /**
   * Seed initial patient permissions into the database
   * Uses ON CONFLICT to avoid duplicate entries if already seeded
   * 
   * @returns Number of permissions inserted (0 if already existed)
   */
  async seed(): Promise<number> {
    let insertedCount = 0;

    for (const permission of PATIENT_PERMISSIONS) {
      const query = `
        INSERT INTO permissions (role, action, resource)
        VALUES ($1, $2, $3)
        ON CONFLICT (role, action, resource) DO NOTHING
        RETURNING id
      `;

      const values = [permission.role, permission.action, permission.resource];

      try {
        const result = await this.pool.query(query, values);
        if (result.rowCount && result.rowCount > 0) {
          insertedCount++;
        }
      } catch (error) {
        // Log error but continue with other permissions
        console.error(`Failed to seed permission ${permission.role}:${permission.action}:${permission.resource}`, error);
      }
    }

    return insertedCount;
  }

  /**
   * Check if a specific permission exists for a role
   * 
   * @param role - The role to check
   * @param action - The action to check (e.g., 'read', 'write')
   * @param resource - The resource to check (e.g., 'own_profile', 'dashboard')
   * @returns True if permission exists, false otherwise
   */
  async hasPermission(role: Role, action: string, resource: string): Promise<boolean> {
    const query = `
      SELECT COUNT(*) as count
      FROM permissions
      WHERE role = $1 AND action = $2 AND resource = $3
    `;

    const result = await this.pool.query(query, [role, action, resource]);
    return parseInt(result.rows[0].count, 10) > 0;
  }

  /**
   * Get all permissions in the system
   * Useful for administrative purposes
   * 
   * @returns Array of all permissions
   */
  async findAll(): Promise<Permission[]> {
    const query = 'SELECT * FROM permissions ORDER BY role, resource, action';
    const result = await this.pool.query(query);
    return result.rows.map(row => this.mapRowToPermission(row));
  }

  /**
   * Count total permissions for a role
   * 
   * @param role - The role to count permissions for
   * @returns Number of permissions for the role
   */
  async countByRole(role: Role): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM permissions WHERE role = $1';
    const result = await this.pool.query(query, [role]);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Map a database row to a Permission object
   * 
   * @param row - Database row
   * @returns Permission object
   */
  private mapRowToPermission(row: any): Permission {
    return {
      id: row.id,
      role: row.role as Role,
      action: row.action,
      resource: row.resource
    };
  }
}

// Export a singleton instance
export const permissionRepository = new PermissionRepository();
