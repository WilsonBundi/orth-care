# Type Definitions

This directory contains all TypeScript interfaces, enums, and type definitions for the Patient Portal with Secure Authentication application.

## Files

### `models.ts`
Core data models and type definitions including:

#### Enums
- **Role**: User roles in the system (currently `PATIENT`)
- **AuditEventType**: Types of security events logged by the system
- **LogoutReason**: Reasons for session invalidation

#### Core Data Models
- **Address**: Physical address information
- **User**: User account with authentication credentials
- **Session**: Active session for authenticated users
- **AuditEvent**: Immutable audit log entry for security events
- **Permission**: Role-based access control permission mapping

#### Request/Response Types
- **RegistrationRequest/Response**: Patient registration
- **LoginRequest/Response**: User authentication
- **LogoutResponse**: Session termination
- **PatientProfile**: User profile information (excludes sensitive fields)
- **ProfileUpdateRequest/Response**: Profile modification
- **PasswordChangeRequest/Response**: Password updates
- **DashboardData**: Dashboard information for authenticated users
- **ValidationResult**: Input validation results
- **ErrorResponse**: Standardized error format

#### Service Types
- **SessionCreateOptions**: Options for creating sessions
- **AuditEventOptions**: Options for logging audit events
- **AuditLogQuery**: Query parameters for audit log retrieval

### `index.ts`
Central export point for all type definitions. Import types from this file:

```typescript
import { User, Session, Role, AuditEventType } from './types';
```

## Usage Examples

### Creating a User
```typescript
import { User, Role, Address } from './types';

const address: Address = {
  street: '123 Main St',
  city: 'Boston',
  state: 'MA',
  zipCode: '02101',
  country: 'USA'
};

const user: User = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'patient@example.com',
  passwordHash: '$2b$12$...',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: new Date('1990-01-01'),
  phoneNumber: '555-0100',
  address,
  role: Role.PATIENT,
  failedLoginAttempts: 0,
  lockedUntil: null,
  createdAt: new Date(),
  updatedAt: new Date()
};
```

### Creating an Audit Event
```typescript
import { AuditEvent, AuditEventType } from './types';

const auditEvent: AuditEvent = {
  id: 1,
  userId: '123e4567-e89b-12d3-a456-426614174000',
  eventType: AuditEventType.LOGIN_SUCCESS,
  timestamp: new Date(),
  ipAddress: '127.0.0.1',
  userAgent: 'Mozilla/5.0',
  outcome: 'success',
  details: { method: 'password' },
  hash: 'previous-event-hash'
};
```

### Handling Registration Requests
```typescript
import { RegistrationRequest, RegistrationResponse } from './types';

const request: RegistrationRequest = {
  email: 'patient@example.com',
  password: 'SecurePass123!',
  firstName: 'John',
  lastName: 'Doe',
  dateOfBirth: '1990-01-01',
  phoneNumber: '555-0100',
  address: {
    street: '123 Main St',
    city: 'Boston',
    state: 'MA',
    zipCode: '02101',
    country: 'USA'
  }
};

const response: RegistrationResponse = {
  userId: '123e4567-e89b-12d3-a456-426614174000',
  message: 'Registration successful'
};
```

## Design Principles

1. **Immutability**: Certain fields like `dateOfBirth` in User are immutable after creation
2. **Type Safety**: All interfaces use strict TypeScript types with no `any` except for audit event details
3. **Null Safety**: Optional fields are explicitly marked with `| null` or `?`
4. **Separation of Concerns**: Request/Response types are separate from internal data models
5. **Security**: Sensitive fields like `passwordHash` are excluded from public-facing types like `PatientProfile`

## Testing

All type definitions are tested in `models.test.ts` to ensure:
- Enums have correct values
- Interfaces can be instantiated with valid data
- Type safety is enforced by TypeScript compiler
- Optional and nullable fields work as expected

Run tests with:
```bash
npm test src/types/models.test.ts
```

## Related Documentation

- Design Document: `.kiro/specs/patient-portal-auth/design.md`
- Requirements: `.kiro/specs/patient-portal-auth/requirements.md`
- Database Schema: `src/db/schema.sql`
