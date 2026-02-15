/**
 * Repository exports
 * 
 * Central export point for all data access repositories
 * Using Firebase Firestore as the database
 */

// Firebase Firestore repositories (default)
export { UserRepository, userRepository, CreateUserParams, UpdateUserParams } from './UserRepository.firebase';
export { SessionRepository, sessionRepository, CreateSessionParams, UpdateSessionParams } from './SessionRepository.firebase';
export { AuditRepository, auditRepository, CreateAuditEventParams } from './AuditRepository.firebase';
export { PermissionRepository, permissionRepository } from './PermissionRepository.firebase';

// PostgreSQL repositories (legacy - uncomment to switch back)
// export { UserRepository, userRepository, CreateUserParams, UpdateUserParams } from './UserRepository';
// export { SessionRepository, sessionRepository, CreateSessionParams, UpdateSessionParams } from './SessionRepository';
// export { AuditRepository, auditRepository, CreateAuditEventParams } from './AuditRepository';
// export { PermissionRepository, permissionRepository } from './PermissionRepository';

