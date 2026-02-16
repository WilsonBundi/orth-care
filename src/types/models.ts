/**
 * Core data models for the Patient Portal with Secure Authentication
 * 
 * This file defines all TypeScript interfaces and enums for the data models
 * used throughout the application, matching the design document specifications.
 */

// ============================================================================
// Enums
// ============================================================================

/**
 * User roles in the system - Healthcare Organization Hierarchy
 * Implements role-based access control with clear separation of duties
 */
export enum Role {
  // Patient Role
  PATIENT = 'patient',
  
  // Clinical Staff Roles
  NURSE = 'nurse',
  DOCTOR = 'doctor',
  SPECIALIST = 'specialist',
  
  // Administrative Roles
  RECEPTIONIST = 'receptionist',
  BILLING_CLERK = 'billing_clerk',
  RECORDS_MANAGER = 'records_manager',
  
  // Management Roles
  CLINIC_MANAGER = 'clinic_manager',
  SYSTEM_ADMIN = 'system_admin',
  SUPER_ADMIN = 'super_admin'
}

/**
 * Types of audit events logged by the system
 */
export enum AuditEventType {
  ACCOUNT_CREATED = 'account_created',
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  PASSWORD_CHANGED = 'password_changed',
  PROFILE_UPDATED = 'profile_updated',
  ACCESS_DENIED = 'access_denied',
  ACCESS_GRANTED = 'access_granted',
  ACCOUNT_LOCKED = 'account_locked',
  // MFA events
  MFA_SETUP = 'mfa_setup',
  MFA_ENABLED = 'mfa_enabled',
  MFA_DISABLED = 'mfa_disabled',
  MFA_VERIFICATION_SUCCESS = 'mfa_verification_success',
  MFA_VERIFICATION_FAILURE = 'mfa_verification_failure',
  MFA_BACKUP_CODES_REGENERATED = 'mfa_backup_codes_regenerated',
  TRUSTED_DEVICE_REMOVED = 'trusted_device_removed',
  // Appointment events
  APPOINTMENT_CREATED = 'appointment_created',
  APPOINTMENT_UPDATED = 'appointment_updated',
  APPOINTMENT_CANCELLED = 'appointment_cancelled',
  APPOINTMENT_RESCHEDULED = 'appointment_rescheduled'
}

/**
 * Reasons for session invalidation
 */
export enum LogoutReason {
  EXPLICIT = 'explicit',           // User explicitly logged out
  TIMEOUT = 'timeout',             // Session expired due to inactivity
  PASSWORD_CHANGE = 'password_change', // Session invalidated due to password change
  ADMIN_ACTION = 'admin_action'    // Session invalidated by administrator
}

// ============================================================================
// Core Data Models
// ============================================================================

/**
 * Physical address information
 */
export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

/**
 * User account in the system
 * Represents a registered patient with authentication credentials
 */
export interface User {
  id: string;                      // UUID
  email: string;                   // Unique, indexed
  passwordHash: string;            // Bcrypt hash
  firstName: string;
  lastName: string;
  dateOfBirth: Date;               // Immutable after creation
  phoneNumber: string;
  address: Address;
  role: Role;                      // Currently always 'patient'
  failedLoginAttempts: number;     // Reset on successful login
  lockedUntil: Date | null;        // Null if not locked
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Active session for an authenticated user
 */
export interface Session {
  id: string;                      // Cryptographically random, indexed
  userId: string;                  // Foreign key to User
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
  expiresAt: Date;                 // 30 minutes from last activity
  invalidated: boolean;            // True if explicitly logged out
}

/**
 * Audit log entry for security-relevant events
 * Immutable once created for tamper-evident logging
 */
export interface AuditEvent {
  id: number;                      // Sequential ID for ordering
  userId: string | null;           // Null for failed login attempts
  eventType: AuditEventType;
  timestamp: Date;                 // Indexed
  ipAddress: string;
  userAgent: string;
  outcome: 'success' | 'failure';
  details: Record<string, any>;    // JSON field for event-specific data
  hash: string;                    // Hash of previous event for tamper detection
}

/**
 * Permission mapping for role-based access control
 */
export interface Permission {
  id: string;                      // UUID
  role: Role;
  action: string;                  // e.g., 'read', 'write', 'delete'
  resource: string;                // e.g., 'profile', 'appointments', 'medical_records'
}

// ============================================================================
// Request/Response Types
// ============================================================================

/**
 * Request body for patient registration
 */
export interface RegistrationRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;             // ISO date string
  phoneNumber: string;
  address: Address;
}

/**
 * Response for successful registration
 */
export interface RegistrationResponse {
  userId: string;
  message: string;
}

/**
 * Request body for login
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Response for successful login
 */
export interface LoginResponse {
  sessionId: string;
  userId: string;
  message: string;
}

/**
 * Response for logout
 */
export interface LogoutResponse {
  message: string;
}

/**
 * Patient profile information (excludes sensitive fields like passwordHash)
 */
export interface PatientProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  phoneNumber: string;
  address: Address;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Request body for profile updates
 * All fields are optional except those being changed
 */
export interface ProfileUpdateRequest {
  email?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: Address;
  // Note: dateOfBirth is intentionally excluded as it's immutable
}

/**
 * Response for successful profile update
 */
export interface ProfileUpdateResponse {
  profile: PatientProfile;
  message: string;
}

/**
 * Request body for password change
 */
export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
}

/**
 * Response for successful password change
 */
export interface PasswordChangeResponse {
  message: string;
}

/**
 * Dashboard data returned to authenticated users
 */
export interface DashboardData {
  welcomeMessage: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
  navigationOptions: NavigationOption[];
}

/**
 * Navigation option displayed on dashboard
 */
export interface NavigationOption {
  label: string;
  path: string;
  icon?: string;
}

/**
 * Validation result for input validation
 */
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;  // Field name -> error message
}

/**
 * Error response format
 */
export interface ErrorResponse {
  error: string;
  fields?: Record<string, string>; // For validation errors
  redirect?: string;               // For session expiration
}

// ============================================================================
// Service Method Types
// ============================================================================

/**
 * Options for session creation
 */
export interface SessionCreateOptions {
  userId: string;
  ipAddress: string;
  userAgent: string;
}

/**
 * Options for audit event logging
 */
export interface AuditEventOptions {
  userId: string | null;
  eventType: AuditEventType;
  ipAddress: string;
  userAgent: string;
  outcome: 'success' | 'failure';
  details?: Record<string, any>;
}

/**
 * Query parameters for audit log retrieval
 */
export interface AuditLogQuery {
  userId?: string;
  eventType?: AuditEventType;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}
