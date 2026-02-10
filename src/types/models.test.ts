/**
 * Tests for TypeScript type definitions
 * Validates that all interfaces and enums are correctly defined
 */

import {
  Role,
  AuditEventType,
  LogoutReason,
  Address,
  User,
  Session,
  AuditEvent,
  Permission,
  RegistrationRequest,
  RegistrationResponse,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  PatientProfile,
  ProfileUpdateRequest,
  ProfileUpdateResponse,
  PasswordChangeRequest,
  PasswordChangeResponse,
  DashboardData,
  NavigationOption,
  ValidationResult,
  ErrorResponse,
  SessionCreateOptions,
  AuditEventOptions,
  AuditLogQuery
} from './models';

describe('Type Definitions', () => {
  describe('Enums', () => {
    it('should define Role enum with PATIENT value', () => {
      expect(Role.PATIENT).toBe('patient');
    });

    it('should define AuditEventType enum with all event types', () => {
      expect(AuditEventType.ACCOUNT_CREATED).toBe('account_created');
      expect(AuditEventType.LOGIN_SUCCESS).toBe('login_success');
      expect(AuditEventType.LOGIN_FAILURE).toBe('login_failure');
      expect(AuditEventType.LOGOUT).toBe('logout');
      expect(AuditEventType.PASSWORD_CHANGED).toBe('password_changed');
      expect(AuditEventType.PROFILE_UPDATED).toBe('profile_updated');
      expect(AuditEventType.ACCESS_DENIED).toBe('access_denied');
      expect(AuditEventType.ACCOUNT_LOCKED).toBe('account_locked');
    });

    it('should define LogoutReason enum with all reasons', () => {
      expect(LogoutReason.EXPLICIT).toBe('explicit');
      expect(LogoutReason.TIMEOUT).toBe('timeout');
      expect(LogoutReason.PASSWORD_CHANGE).toBe('password_change');
      expect(LogoutReason.ADMIN_ACTION).toBe('admin_action');
    });
  });

  describe('Core Data Models', () => {
    it('should create a valid Address object', () => {
      const address: Address = {
        street: '123 Main St',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101',
        country: 'USA'
      };

      expect(address.street).toBe('123 Main St');
      expect(address.city).toBe('Boston');
      expect(address.state).toBe('MA');
      expect(address.zipCode).toBe('02101');
      expect(address.country).toBe('USA');
    });

    it('should create a valid User object', () => {
      const user: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        passwordHash: '$2b$12$hashedpassword',
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
        },
        role: Role.PATIENT,
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(user.email).toBe('test@example.com');
      expect(user.role).toBe(Role.PATIENT);
      expect(user.failedLoginAttempts).toBe(0);
      expect(user.lockedUntil).toBeNull();
    });

    it('should create a valid Session object', () => {
      const session: Session = {
        id: 'random-session-id',
        userId: '123e4567-e89b-12d3-a456-426614174000',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 30 * 60 * 1000),
        invalidated: false
      };

      expect(session.userId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(session.invalidated).toBe(false);
    });

    it('should create a valid AuditEvent object', () => {
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

      expect(auditEvent.eventType).toBe(AuditEventType.LOGIN_SUCCESS);
      expect(auditEvent.outcome).toBe('success');
      expect(auditEvent.details.method).toBe('password');
    });

    it('should create a valid Permission object', () => {
      const permission: Permission = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        role: Role.PATIENT,
        action: 'read',
        resource: 'own_profile'
      };

      expect(permission.role).toBe(Role.PATIENT);
      expect(permission.action).toBe('read');
      expect(permission.resource).toBe('own_profile');
    });
  });

  describe('Request/Response Types', () => {
    it('should create a valid RegistrationRequest', () => {
      const request: RegistrationRequest = {
        email: 'test@example.com',
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

      expect(request.email).toBe('test@example.com');
      expect(request.dateOfBirth).toBe('1990-01-01');
    });

    it('should create a valid LoginRequest', () => {
      const request: LoginRequest = {
        email: 'test@example.com',
        password: 'SecurePass123!'
      };

      expect(request.email).toBe('test@example.com');
    });

    it('should create a valid PatientProfile', () => {
      const profile: PatientProfile = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
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
        },
        role: Role.PATIENT,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(profile.email).toBe('test@example.com');
      expect(profile.role).toBe(Role.PATIENT);
    });

    it('should create a valid ProfileUpdateRequest with optional fields', () => {
      const request: ProfileUpdateRequest = {
        email: 'newemail@example.com',
        phoneNumber: '555-0200'
      };

      expect(request.email).toBe('newemail@example.com');
      expect(request.phoneNumber).toBe('555-0200');
      expect(request.firstName).toBeUndefined();
    });

    it('should create a valid PasswordChangeRequest', () => {
      const request: PasswordChangeRequest = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass456!'
      };

      expect(request.currentPassword).toBe('OldPass123!');
      expect(request.newPassword).toBe('NewPass456!');
    });

    it('should create a valid DashboardData', () => {
      const dashboard: DashboardData = {
        welcomeMessage: 'Welcome, John Doe!',
        user: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'test@example.com'
        },
        navigationOptions: [
          { label: 'Profile', path: '/profile' },
          { label: 'Logout', path: '/logout' }
        ]
      };

      expect(dashboard.welcomeMessage).toBe('Welcome, John Doe!');
      expect(dashboard.navigationOptions).toHaveLength(2);
    });

    it('should create a valid ValidationResult', () => {
      const result: ValidationResult = {
        isValid: false,
        errors: {
          email: 'Invalid email format',
          password: 'Password too weak'
        }
      };

      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Invalid email format');
    });

    it('should create a valid ErrorResponse', () => {
      const error: ErrorResponse = {
        error: 'Validation failed',
        fields: {
          email: 'Email already exists'
        }
      };

      expect(error.error).toBe('Validation failed');
      expect(error.fields?.email).toBe('Email already exists');
    });
  });

  describe('Service Method Types', () => {
    it('should create valid SessionCreateOptions', () => {
      const options: SessionCreateOptions = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0'
      };

      expect(options.userId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(options.ipAddress).toBe('127.0.0.1');
    });

    it('should create valid AuditEventOptions', () => {
      const options: AuditEventOptions = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: AuditEventType.LOGIN_SUCCESS,
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success',
        details: { method: 'password' }
      };

      expect(options.eventType).toBe(AuditEventType.LOGIN_SUCCESS);
      expect(options.outcome).toBe('success');
    });

    it('should create valid AuditLogQuery with optional fields', () => {
      const query: AuditLogQuery = {
        userId: '123e4567-e89b-12d3-a456-426614174000',
        eventType: AuditEventType.LOGIN_SUCCESS,
        limit: 10
      };

      expect(query.userId).toBe('123e4567-e89b-12d3-a456-426614174000');
      expect(query.limit).toBe(10);
      expect(query.startDate).toBeUndefined();
    });
  });

  describe('Type Safety', () => {
    it('should enforce User has all required fields', () => {
      // This test validates TypeScript compilation
      // If any required field is missing, TypeScript will fail to compile
      const user: User = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        email: 'test@example.com',
        passwordHash: '$2b$12$hashedpassword',
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
        },
        role: Role.PATIENT,
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(user).toBeDefined();
    });

    it('should allow null for optional fields', () => {
      const auditEvent: AuditEvent = {
        id: 1,
        userId: null, // Should be allowed for failed login attempts
        eventType: AuditEventType.LOGIN_FAILURE,
        timestamp: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'failure',
        details: {},
        hash: 'hash'
      };

      expect(auditEvent.userId).toBeNull();
    });

    it('should enforce outcome is either success or failure', () => {
      const successEvent: AuditEvent = {
        id: 1,
        userId: '123',
        eventType: AuditEventType.LOGIN_SUCCESS,
        timestamp: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'success',
        details: {},
        hash: 'hash'
      };

      const failureEvent: AuditEvent = {
        id: 2,
        userId: '123',
        eventType: AuditEventType.LOGIN_FAILURE,
        timestamp: new Date(),
        ipAddress: '127.0.0.1',
        userAgent: 'Mozilla/5.0',
        outcome: 'failure',
        details: {},
        hash: 'hash'
      };

      expect(successEvent.outcome).toBe('success');
      expect(failureEvent.outcome).toBe('failure');
    });
  });
});
