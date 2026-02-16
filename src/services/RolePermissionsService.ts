/**
 * Role Permissions Service
 * Defines and manages permissions for each role in the healthcare system
 * 
 * Role Hierarchy (from lowest to highest):
 * 1. PATIENT - Can view own records only
 * 2. RECEPTIONIST - Can manage appointments and basic patient info
 * 3. NURSE - Can view medical records, update vitals
 * 4. BILLING_CLERK - Can manage invoices and payments
 * 5. RECORDS_MANAGER - Can manage all medical records
 * 6. DOCTOR - Can view/edit medical records, prescribe
 * 7. SPECIALIST - Doctor + specialized procedures
 * 8. CLINIC_MANAGER - Can manage staff, view reports
 * 9. SYSTEM_ADMIN - Full system access except user management
 * 10. SUPER_ADMIN - Complete system control
 */

import { Role } from '../types/models';

export interface Permission {
  resource: string;
  actions: string[];
  description: string;
}

export interface RoleDefinition {
  role: Role;
  displayName: string;
  description: string;
  permissions: Permission[];
  inheritsFrom?: Role[];
}

export class RolePermissionsService {
  private roleDefinitions: Map<Role, RoleDefinition>;

  constructor() {
    this.roleDefinitions = new Map();
    this.initializeRoles();
  }

  private initializeRoles() {
    // PATIENT - Basic access to own data
    this.roleDefinitions.set(Role.PATIENT, {
      role: Role.PATIENT,
      displayName: 'Patient',
      description: 'Registered patient with access to personal health records',
      permissions: [
        {
          resource: 'own_profile',
          actions: ['read', 'update'],
          description: 'View and update own profile information'
        },
        {
          resource: 'own_appointments',
          actions: ['read', 'create', 'cancel'],
          description: 'Manage own appointments'
        },
        {
          resource: 'own_medical_records',
          actions: ['read'],
          description: 'View own medical records (read-only)'
        },
        {
          resource: 'own_invoices',
          actions: ['read'],
          description: 'View own billing and invoices'
        },
        {
          resource: 'dashboard',
          actions: ['read'],
          description: 'Access patient dashboard'
        }
      ]
    });

    // RECEPTIONIST - Front desk operations
    this.roleDefinitions.set(Role.RECEPTIONIST, {
      role: Role.RECEPTIONIST,
      displayName: 'Receptionist',
      description: 'Front desk staff managing appointments and patient check-in',
      permissions: [
        {
          resource: 'appointments',
          actions: ['read', 'create', 'update', 'cancel'],
          description: 'Full appointment management'
        },
        {
          resource: 'patient_basic_info',
          actions: ['read', 'create', 'update'],
          description: 'Manage patient registration and basic information'
        },
        {
          resource: 'schedule',
          actions: ['read'],
          description: 'View clinic schedule'
        },
        {
          resource: 'waiting_list',
          actions: ['read', 'update'],
          description: 'Manage patient waiting list'
        }
      ],
      inheritsFrom: [Role.PATIENT]
    });

    // NURSE - Clinical support staff
    this.roleDefinitions.set(Role.NURSE, {
      role: Role.NURSE,
      displayName: 'Nurse',
      description: 'Clinical staff providing patient care and support',
      permissions: [
        {
          resource: 'medical_records',
          actions: ['read', 'update'],
          description: 'View and update patient medical records'
        },
        {
          resource: 'vitals',
          actions: ['read', 'create', 'update'],
          description: 'Record and update patient vitals'
        },
        {
          resource: 'medications',
          actions: ['read', 'administer'],
          description: 'View medications and record administration'
        },
        {
          resource: 'lab_results',
          actions: ['read', 'upload'],
          description: 'View and upload lab results'
        },
        {
          resource: 'patient_notes',
          actions: ['read', 'create'],
          description: 'Add nursing notes to patient records'
        }
      ],
      inheritsFrom: [Role.RECEPTIONIST]
    });

    // BILLING_CLERK - Financial operations
    this.roleDefinitions.set(Role.BILLING_CLERK, {
      role: Role.BILLING_CLERK,
      displayName: 'Billing Clerk',
      description: 'Staff managing billing, invoices, and payments',
      permissions: [
        {
          resource: 'invoices',
          actions: ['read', 'create', 'update', 'cancel'],
          description: 'Full invoice management'
        },
        {
          resource: 'payments',
          actions: ['read', 'create', 'process'],
          description: 'Process and record payments'
        },
        {
          resource: 'billing_reports',
          actions: ['read', 'generate'],
          description: 'Generate billing reports'
        },
        {
          resource: 'insurance_claims',
          actions: ['read', 'create', 'submit'],
          description: 'Manage insurance claims'
        },
        {
          resource: 'patient_billing_info',
          actions: ['read', 'update'],
          description: 'View and update patient billing information'
        }
      ],
      inheritsFrom: [Role.RECEPTIONIST]
    });

    // RECORDS_MANAGER - Medical records administration
    this.roleDefinitions.set(Role.RECORDS_MANAGER, {
      role: Role.RECORDS_MANAGER,
      displayName: 'Records Manager',
      description: 'Staff managing medical records and documentation',
      permissions: [
        {
          resource: 'medical_records',
          actions: ['read', 'create', 'update', 'delete', 'archive'],
          description: 'Full medical records management'
        },
        {
          resource: 'documents',
          actions: ['read', 'upload', 'delete', 'organize'],
          description: 'Manage medical documents and files'
        },
        {
          resource: 'records_audit',
          actions: ['read'],
          description: 'View records access audit logs'
        },
        {
          resource: 'data_export',
          actions: ['create'],
          description: 'Export patient records (with consent)'
        }
      ],
      inheritsFrom: [Role.NURSE]
    });

    // DOCTOR - Primary care physician
    this.roleDefinitions.set(Role.DOCTOR, {
      role: Role.DOCTOR,
      displayName: 'Doctor',
      description: 'Licensed physician providing medical care',
      permissions: [
        {
          resource: 'medical_records',
          actions: ['read', 'create', 'update'],
          description: 'Full access to patient medical records'
        },
        {
          resource: 'prescriptions',
          actions: ['read', 'create', 'update', 'cancel'],
          description: 'Prescribe and manage medications'
        },
        {
          resource: 'diagnoses',
          actions: ['read', 'create', 'update'],
          description: 'Record and update diagnoses'
        },
        {
          resource: 'treatment_plans',
          actions: ['read', 'create', 'update'],
          description: 'Create and manage treatment plans'
        },
        {
          resource: 'lab_orders',
          actions: ['read', 'create', 'cancel'],
          description: 'Order laboratory tests'
        },
        {
          resource: 'referrals',
          actions: ['read', 'create'],
          description: 'Create patient referrals'
        },
        {
          resource: 'medical_certificates',
          actions: ['create'],
          description: 'Issue medical certificates'
        }
      ],
      inheritsFrom: [Role.NURSE]
    });

    // SPECIALIST - Specialized medical professional
    this.roleDefinitions.set(Role.SPECIALIST, {
      role: Role.SPECIALIST,
      displayName: 'Specialist',
      description: 'Specialized physician (Orthopedic, Cardiology, etc.)',
      permissions: [
        {
          resource: 'specialized_procedures',
          actions: ['read', 'create', 'perform'],
          description: 'Perform specialized medical procedures'
        },
        {
          resource: 'surgical_notes',
          actions: ['read', 'create', 'update'],
          description: 'Create and manage surgical notes'
        },
        {
          resource: 'specialist_consultations',
          actions: ['read', 'create'],
          description: 'Provide specialist consultations'
        }
      ],
      inheritsFrom: [Role.DOCTOR]
    });

    // CLINIC_MANAGER - Operational management
    this.roleDefinitions.set(Role.CLINIC_MANAGER, {
      role: Role.CLINIC_MANAGER,
      displayName: 'Clinic Manager',
      description: 'Manager overseeing clinic operations',
      permissions: [
        {
          resource: 'staff_management',
          actions: ['read', 'update'],
          description: 'View and manage staff schedules'
        },
        {
          resource: 'clinic_reports',
          actions: ['read', 'generate'],
          description: 'Generate operational reports'
        },
        {
          resource: 'inventory',
          actions: ['read', 'update'],
          description: 'Manage clinic inventory'
        },
        {
          resource: 'quality_metrics',
          actions: ['read'],
          description: 'View quality and performance metrics'
        },
        {
          resource: 'patient_feedback',
          actions: ['read', 'respond'],
          description: 'View and respond to patient feedback'
        },
        {
          resource: 'financial_overview',
          actions: ['read'],
          description: 'View financial summaries and reports'
        }
      ],
      inheritsFrom: [Role.DOCTOR, Role.BILLING_CLERK, Role.RECORDS_MANAGER]
    });

    // SYSTEM_ADMIN - Technical administration
    this.roleDefinitions.set(Role.SYSTEM_ADMIN, {
      role: Role.SYSTEM_ADMIN,
      displayName: 'System Administrator',
      description: 'Technical administrator managing system configuration',
      permissions: [
        {
          resource: 'system_settings',
          actions: ['read', 'update'],
          description: 'Configure system settings'
        },
        {
          resource: 'audit_logs',
          actions: ['read', 'export'],
          description: 'View and export system audit logs'
        },
        {
          resource: 'backups',
          actions: ['read', 'create', 'restore'],
          description: 'Manage system backups'
        },
        {
          resource: 'integrations',
          actions: ['read', 'configure'],
          description: 'Configure external integrations'
        },
        {
          resource: 'security_settings',
          actions: ['read', 'update'],
          description: 'Manage security configurations'
        },
        {
          resource: 'system_monitoring',
          actions: ['read'],
          description: 'Monitor system health and performance'
        }
      ],
      inheritsFrom: [Role.CLINIC_MANAGER]
    });

    // SUPER_ADMIN - Complete system control
    this.roleDefinitions.set(Role.SUPER_ADMIN, {
      role: Role.SUPER_ADMIN,
      displayName: 'Super Administrator',
      description: 'Highest level administrator with complete system access',
      permissions: [
        {
          resource: 'user_management',
          actions: ['read', 'create', 'update', 'delete', 'assign_roles'],
          description: 'Full user and role management'
        },
        {
          resource: 'role_management',
          actions: ['read', 'create', 'update', 'delete'],
          description: 'Manage roles and permissions'
        },
        {
          resource: 'system_configuration',
          actions: ['read', 'update', 'delete'],
          description: 'Complete system configuration access'
        },
        {
          resource: 'data_management',
          actions: ['read', 'export', 'import', 'delete'],
          description: 'Manage all system data'
        },
        {
          resource: 'emergency_access',
          actions: ['grant', 'revoke'],
          description: 'Grant emergency access to records'
        }
      ],
      inheritsFrom: [Role.SYSTEM_ADMIN]
    });
  }

  /**
   * Get role definition
   */
  getRoleDefinition(role: Role): RoleDefinition | undefined {
    return this.roleDefinitions.get(role);
  }

  /**
   * Get all permissions for a role (including inherited)
   */
  getAllPermissions(role: Role): Permission[] {
    const definition = this.roleDefinitions.get(role);
    if (!definition) return [];

    const permissions = [...definition.permissions];

    // Add inherited permissions
    if (definition.inheritsFrom) {
      for (const inheritedRole of definition.inheritsFrom) {
        const inheritedPerms = this.getAllPermissions(inheritedRole);
        permissions.push(...inheritedPerms);
      }
    }

    // Remove duplicates
    const uniquePermissions = new Map<string, Permission>();
    for (const perm of permissions) {
      const key = perm.resource;
      if (!uniquePermissions.has(key)) {
        uniquePermissions.set(key, perm);
      } else {
        // Merge actions
        const existing = uniquePermissions.get(key)!;
        existing.actions = [...new Set([...existing.actions, ...perm.actions])];
      }
    }

    return Array.from(uniquePermissions.values());
  }

  /**
   * Check if role has permission for action on resource
   */
  hasPermission(role: Role, resource: string, action: string): boolean {
    const permissions = this.getAllPermissions(role);
    const permission = permissions.find(p => p.resource === resource);
    return permission ? permission.actions.includes(action) : false;
  }

  /**
   * Get all roles that can access a resource
   */
  getRolesWithAccess(resource: string, action: string): Role[] {
    const roles: Role[] = [];
    for (const [role] of this.roleDefinitions) {
      if (this.hasPermission(role, resource, action)) {
        roles.push(role);
      }
    }
    return roles;
  }

  /**
   * Get role hierarchy level (higher number = more privileges)
   */
  getRoleLevel(role: Role): number {
    const levels: Record<Role, number> = {
      [Role.PATIENT]: 1,
      [Role.RECEPTIONIST]: 2,
      [Role.NURSE]: 3,
      [Role.BILLING_CLERK]: 3,
      [Role.RECORDS_MANAGER]: 4,
      [Role.DOCTOR]: 5,
      [Role.SPECIALIST]: 6,
      [Role.CLINIC_MANAGER]: 7,
      [Role.SYSTEM_ADMIN]: 8,
      [Role.SUPER_ADMIN]: 9
    };
    return levels[role] || 0;
  }

  /**
   * Check if role1 has higher privileges than role2
   */
  isHigherRole(role1: Role, role2: Role): boolean {
    return this.getRoleLevel(role1) > this.getRoleLevel(role2);
  }

  /**
   * Get all available roles
   */
  getAllRoles(): RoleDefinition[] {
    return Array.from(this.roleDefinitions.values());
  }

  /**
   * Get roles suitable for staff (excludes patient)
   */
  getStaffRoles(): RoleDefinition[] {
    return this.getAllRoles().filter(r => r.role !== Role.PATIENT);
  }

  /**
   * Get administrative roles
   */
  getAdminRoles(): RoleDefinition[] {
    return this.getAllRoles().filter(r => 
      this.getRoleLevel(r.role) >= this.getRoleLevel(Role.CLINIC_MANAGER)
    );
  }
}

export const rolePermissionsService = new RolePermissionsService();
