/**
 * PermissionRepository - Firebase Firestore implementation
 * 
 * Implements all database operations for role-based access control including:
 * - Query permissions by role
 * - Seed initial permissions
 */

import { getFirestore } from '../config/firebase';
import { Permission, Role } from '../types/models';
import { v4 as uuidv4 } from 'uuid';

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
 * PermissionRepository class for Firestore operations on permissions collection
 */
export class PermissionRepository {
  private collectionName = 'permissions';

  /**
   * Get Firestore permissions collection reference
   */
  private getCollection() {
    return getFirestore().collection(this.collectionName);
  }

  /**
   * Find all permissions for a specific role
   * 
   * @param role - The role to query permissions for
   * @returns Array of permissions for the role
   */
  async findByRole(role: Role): Promise<Permission[]> {
    const snapshot = await this.getCollection()
      .where('role', '==', role)
      .orderBy('resource')
      .orderBy('action')
      .get();

    return snapshot.docs.map(doc => this.mapDocToPermission(doc.data()));
  }

  /**
   * Seed initial patient permissions into the database
   * Checks for existing permissions to avoid duplicates
   * 
   * @returns Number of permissions inserted (0 if already existed)
   */
  async seed(): Promise<number> {
    let insertedCount = 0;

    for (const permission of PATIENT_PERMISSIONS) {
      // Check if permission already exists
      const exists = await this.hasPermission(
        permission.role,
        permission.action,
        permission.resource
      );

      if (!exists) {
        try {
          const id = uuidv4();
          await this.getCollection().doc(id).set({
            id,
            role: permission.role,
            action: permission.action,
            resource: permission.resource
          });
          insertedCount++;
        } catch (error) {
          console.error(
            `Failed to seed permission ${permission.role}:${permission.action}:${permission.resource}`,
            error
          );
        }
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
    const snapshot = await this.getCollection()
      .where('role', '==', role)
      .where('action', '==', action)
      .where('resource', '==', resource)
      .limit(1)
      .get();

    return !snapshot.empty;
  }

  /**
   * Get all permissions in the system
   * Useful for administrative purposes
   * 
   * @returns Array of all permissions
   */
  async findAll(): Promise<Permission[]> {
    const snapshot = await this.getCollection()
      .orderBy('role')
      .orderBy('resource')
      .orderBy('action')
      .get();

    return snapshot.docs.map(doc => this.mapDocToPermission(doc.data()));
  }

  /**
   * Count total permissions for a role
   * 
   * @param role - The role to count permissions for
   * @returns Number of permissions for the role
   */
  async countByRole(role: Role): Promise<number> {
    const snapshot = await this.getCollection()
      .where('role', '==', role)
      .count()
      .get();

    return snapshot.data().count;
  }

  /**
   * Map a Firestore document to a Permission object
   * 
   * @param data - Firestore document data
   * @returns Permission object
   */
  private mapDocToPermission(data: any): Permission {
    return {
      id: data.id,
      role: data.role as Role,
      action: data.action,
      resource: data.resource
    };
  }
}

// Export a singleton instance
export const permissionRepository = new PermissionRepository();
