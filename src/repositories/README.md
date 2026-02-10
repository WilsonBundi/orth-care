# Repositories

This directory contains the data access layer (repositories) for the Patient Portal application.

## Overview

Repositories provide an abstraction layer between the business logic and the database. They handle all SQL queries and data mapping operations, ensuring:

- **SQL Injection Prevention**: All queries use parameterized statements
- **Type Safety**: TypeScript interfaces ensure type correctness
- **Error Handling**: Proper error handling for database operations
- **Separation of Concerns**: Business logic is isolated from data access

## Available Repositories

### UserRepository

Handles all database operations for user management:

- **CRUD Operations**: Create, read, update user records
- **Authentication Support**: Failed login tracking, account locking
- **Password Management**: Password hash storage and updates
- **Email Uniqueness**: Enforces unique email constraint

#### Key Methods

- `create(params)` - Create a new user with all required fields
- `findById(id)` - Find a user by their UUID
- `findByEmail(email)` - Find a user by their email address
- `update(id, params)` - Update user information
- `incrementFailedLoginAttempts(email)` - Track failed login attempts
- `resetFailedLoginAttempts(email)` - Reset failed attempts counter
- `lockAccount(email, lockUntil)` - Lock account until specified time
- `unlockAccount(email)` - Unlock account and reset failed attempts
- `isAccountLocked(email)` - Check if account is currently locked
- `updatePasswordHash(id, hash)` - Update user's password hash
- `getPasswordHash(id)` - Retrieve user's password hash

#### Usage Example

```typescript
import { userRepository } from './repositories';

// Create a new user
const user = await userRepository.create({
  email: 'patient@example.com',
  passwordHash: 'hashed_password',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: new Date('1990-01-01'),
  phoneNumber: '555-0100',
  address: {
    street: '123 Main St',
    city: 'Boston',
    state: 'MA',
    zipCode: '02101',
    country: 'USA'
  }
});

// Find user by email
const foundUser = await userRepository.findByEmail('patient@example.com');

// Track failed login attempt
await userRepository.incrementFailedLoginAttempts('patient@example.com');

// Lock account for 15 minutes
const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
await userRepository.lockAccount('patient@example.com', lockUntil);
```

## Security Considerations

### SQL Injection Prevention

All repositories use parameterized queries exclusively. Never use string concatenation for SQL queries:

```typescript
// ✅ CORRECT - Parameterized query
const query = 'SELECT * FROM users WHERE email = $1';
await pool.query(query, [email]);

// ❌ WRONG - String concatenation (vulnerable to SQL injection)
const query = `SELECT * FROM users WHERE email = '${email}'`;
await pool.query(query);
```

### Error Handling

Repositories handle database-specific errors and throw meaningful exceptions:

- **Unique Constraint Violations**: Detected and converted to descriptive errors
- **Not Found**: Returns `null` for find operations, throws for updates
- **Database Errors**: Propagated with full error context

### Connection Pooling

All repositories use the shared connection pool from `src/db/config.ts`:

- **Max Connections**: Configurable via `DB_MAX_CONNECTIONS` environment variable
- **Connection Timeout**: 2 seconds
- **Idle Timeout**: 30 seconds

## Testing

Each repository has comprehensive unit tests covering:

- **Happy Path**: Successful operations with valid data
- **Error Cases**: Constraint violations, not found scenarios
- **Edge Cases**: Empty updates, expired locks, etc.

Run tests with:

```bash
npm test -- UserRepository.test.ts
```

### SessionRepository

Handles all database operations for session management:

- **CRUD Operations**: Create, read, update, delete session records
- **Session Invalidation**: Invalidate single or multiple sessions
- **Cleanup**: Remove expired and invalidated sessions
- **User Sessions**: Query sessions by user

#### Key Methods

- `create(params)` - Create a new session with cryptographically random ID
- `findById(id)` - Find a session by its ID
- `update(id, params)` - Update session expiration or invalidation status
- `delete(id)` - Delete a session from the database
- `invalidateAllExcept(userId, exceptSessionId)` - Invalidate all user sessions except one (for password changes)
- `cleanupExpired()` - Remove expired and invalidated sessions
- `findByUserId(userId)` - Get all sessions for a user
- `countActiveSessions(userId)` - Count active (non-expired, non-invalidated) sessions

#### Usage Example

```typescript
import { sessionRepository } from './repositories';

// Create a new session
const session = await sessionRepository.create({
  id: 'cryptographically-random-id',
  userId: 'user-uuid',
  ipAddress: '192.168.1.1',
  userAgent: 'Mozilla/5.0',
  expiresAt: new Date(Date.now() + 30 * 60 * 1000) // 30 minutes
});

// Find session by ID
const foundSession = await sessionRepository.findById('session-id');

// Extend session expiration
await sessionRepository.update('session-id', {
  expiresAt: new Date(Date.now() + 30 * 60 * 1000)
});

// Invalidate all sessions except current (password change)
const invalidatedCount = await sessionRepository.invalidateAllExcept(
  'user-uuid',
  'current-session-id'
);

// Clean up expired sessions (run periodically)
const deletedCount = await sessionRepository.cleanupExpired();
```

### AuditRepository

Handles all database operations for tamper-evident audit logging:

- **Immutable Logging**: Create-only operations (no updates or deletes)
- **Hash Chain**: Each entry links to previous entry for tamper detection
- **Query Operations**: Find events by user, type, or date range
- **Integrity Verification**: Verify hash chain integrity

#### Key Methods

- `create(params)` - Create a new audit event with hash chain
- `findByUserId(userId, limit, offset)` - Find events for a user
- `findByType(eventType, limit, offset)` - Find events by type
- `findByDateRange(startDate, endDate, limit, offset)` - Find events in date range
- `findByUserIdAndDateRange(...)` - Combined user and date filtering
- `findById(id)` - Find a specific audit event
- `count()` - Get total count of audit events
- `verifyHashChain()` - Verify integrity of the audit log

See `AUDIT_REPOSITORY_IMPLEMENTATION.md` for detailed documentation.

### PermissionRepository

Handles all database operations for role-based access control:

- **Permission Queries**: Find permissions by role
- **Permission Seeding**: Initialize default patient permissions
- **Permission Checks**: Verify if a role has specific permission
- **SQL Injection Prevention**: All queries use parameterized statements

#### Key Methods

- `findByRole(role)` - Get all permissions for a role
- `seed()` - Seed initial patient permissions (idempotent)
- `hasPermission(role, action, resource)` - Check if permission exists
- `findAll()` - Get all permissions in the system
- `countByRole(role)` - Count permissions for a role

#### Usage Example

```typescript
import { permissionRepository } from './repositories';
import { Role } from '../types/models';

// Seed initial permissions (safe to call multiple times)
const insertedCount = await permissionRepository.seed();
console.log(`Inserted ${insertedCount} new permissions`);

// Check if patient can read their profile
const canRead = await permissionRepository.hasPermission(
  Role.PATIENT,
  'read',
  'own_profile'
);

if (canRead) {
  // Allow access
} else {
  // Deny access (default-deny)
}

// Get all permissions for patient role
const permissions = await permissionRepository.findByRole(Role.PATIENT);
permissions.forEach(p => {
  console.log(`${p.action} on ${p.resource}`);
});
```

#### Initial Permissions

The patient role is seeded with these permissions:

| Role    | Action | Resource     | Description                    |
|---------|--------|--------------|--------------------------------|
| patient | read   | own_profile  | View own profile information   |
| patient | write  | own_profile  | Update own profile information |
| patient | read   | dashboard    | Access patient dashboard       |

See `PERMISSION_REPOSITORY_IMPLEMENTATION.md` for detailed documentation.

## Database Schema

Repositories map to the following database tables:

- `users` - User accounts and authentication data
- `sessions` - Active user sessions
- `audit_events` - Security event audit log
- `permissions` - Role-based permissions

See `src/db/schema.sql` for complete schema definitions.
