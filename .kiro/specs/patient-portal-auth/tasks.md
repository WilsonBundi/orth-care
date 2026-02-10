# Implementation Plan: Patient Portal with Secure Authentication

## Overview

This implementation plan breaks down the Patient Portal with Secure Authentication feature into discrete, incremental coding tasks. The approach follows a layered architecture, starting with foundational infrastructure (database, core types), then building up through data access, business logic, and finally the web layer. Each task builds on previous work, with testing integrated throughout to validate correctness early.

The implementation uses TypeScript with Express.js for the web framework, PostgreSQL for data persistence, and bcrypt for password hashing. Property-based testing with fast-check validates universal correctness properties, while unit tests cover specific examples and edge cases.

## Tasks

- [x] 1. Set up project infrastructure and database schema
  - Initialize TypeScript project with Express.js, PostgreSQL client (pg), bcrypt, and testing frameworks (Jest, fast-check)
  - Create database schema with users, sessions, audit_events, and permissions tables
  - Set up database migrations and connection pooling
  - Configure TypeScript compiler options for strict type checking
  - _Requirements: All (foundational)_

- [ ] 2. Implement core data models and types
  - [x] 2.1 Create TypeScript interfaces for User, Session, AuditEvent, Permission, Address
    - Define all data model interfaces matching the design document
    - Create enums for Role, AuditEventType, LogoutReason
    - Define request/response types for API endpoints
    - _Requirements: 1.1, 2.2, 3.3, 4.1, 8.1_

  - [x] 2.2 Create validation utilities for data models
    - Implement email format validation
    - Implement phone number format validation
    - Implement address validation
    - _Requirements: 4.2_

- [ ] 3. Implement Password Service
  - [x] 3.1 Create PasswordService with hashing and verification
    - Implement hashPassword using bcrypt with work factor 12
    - Implement verifyPassword for comparing plaintext against hash
    - Implement validatePasswordStrength with all security requirements
    - _Requirements: 1.2, 1.4, 5.2, 5.3_

  - [ ]* 3.2 Write property test for password hashing
    - **Property 2: Password Hashing for All Passwords**
    - **Validates: Requirements 1.2, 5.3**

  - [ ]* 3.3 Write property test for password validation
    - **Property 4: Password Strength Validation**
    - **Validates: Requirements 1.4, 5.2**

  - [ ]* 3.4 Write unit tests for password service edge cases
    - Test empty password handling
    - Test maximum length passwords
    - Test special character edge cases
    - _Requirements: 1.4, 5.2_

- [ ] 4. Implement data repositories
  - [x] 4.1 Create UserRepository for database operations
    - Implement create, findById, findByEmail, update methods
    - Implement incrementFailedLoginAttempts, resetFailedLoginAttempts
    - Implement lockAccount, unlockAccount methods
    - Use parameterized queries to prevent SQL injection
    - _Requirements: 1.1, 1.3, 2.4, 4.1, 4.3_

  - [x] 4.2 Create SessionRepository for session management
    - Implement create, findById, update, delete methods
    - Implement invalidateAllExcept for password change scenario
    - Implement cleanupExpired for removing old sessions
    - _Requirements: 2.2, 3.1, 3.3, 5.4_

  - [x] 4.3 Create AuditRepository for audit logging
    - Implement create method with sequential ID generation
    - Implement query methods (findByUserId, findByType, findByDateRange)
    - Implement tamper-evident hash chain (each entry hashes previous entry)
    - _Requirements: 1.6, 8.1, 8.3, 8.4, 8.5_

  - [x] 4.4 Create PermissionRepository for authorization
    - Implement findByRole method
    - Implement seed method to populate initial patient permissions
    - _Requirements: 6.2, 6.3_

- [ ] 5. Implement Audit Service
  - [-] 5.1 Create AuditService for logging security events
    - Implement logEvent method that creates audit entries with all required fields
    - Implement query methods wrapping AuditRepository
    - Ensure immediate persistence to database
    - _Requirements: 1.6, 2.5, 3.4, 4.4, 5.5, 8.1, 8.5_

  - [ ]* 5.2 Write property test for comprehensive audit logging
    - **Property 6: Comprehensive Audit Logging**
    - **Validates: Requirements 1.6, 2.5, 3.4, 4.4, 5.5, 8.1**

  - [ ]* 5.3 Write property test for audit log immutability
    - **Property 22: Audit Log Immutability**
    - **Validates: Requirements 8.3**

  - [ ]* 5.4 Write property test for sequential audit identifiers
    - **Property 23: Sequential Audit Log Identifiers**
    - **Validates: Requirements 8.4**

  - [ ]* 5.5 Write property test for immediate persistence
    - **Property 24: Immediate Audit Log Persistence**
    - **Validates: Requirements 8.5**

- [ ] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement Authentication Service
  - [ ] 7.1 Create AuthenticationService for registration and login
    - Implement register method with email uniqueness check, password hashing, role assignment
    - Implement login method with credential verification, session creation, audit logging
    - Implement verifyCredentials with failed attempt tracking and account lockout
    - Implement isAccountLocked to check lockout status
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 7.2 Write property test for account creation with unique identifiers
    - **Property 1: Account Creation with Unique Identifiers**
    - **Validates: Requirements 1.1**

  - [ ]* 7.3 Write property test for duplicate email rejection
    - **Property 3: Duplicate Email Rejection**
    - **Validates: Requirements 1.3, 4.3**

  - [ ]* 7.4 Write property test for patient role assignment
    - **Property 5: Patient Role Assignment**
    - **Validates: Requirements 1.5**

  - [ ]* 7.5 Write property test for credential verification round trip
    - **Property 7: Credential Verification Round Trip**
    - **Validates: Requirements 2.1, 2.3**

  - [ ]* 7.6 Write property test for session creation on login
    - **Property 8: Session Creation on Successful Login**
    - **Validates: Requirements 2.2**

  - [ ]* 7.7 Write unit test for account lockout after 3 failures
    - Test that 3 failed attempts lock account for 15 minutes
    - Test that successful login resets failed attempt counter
    - _Requirements: 2.4_

- [ ] 8. Implement Session Service
  - [ ] 8.1 Create SessionService for session lifecycle management
    - Implement createSession with cryptographically random ID generation
    - Implement validateAndExtendSession with 30-minute extension
    - Implement invalidateSession with audit logging
    - Implement invalidateAllSessionsExcept for password changes
    - Implement cleanupExpiredSessions for maintenance
    - _Requirements: 2.2, 2.6, 3.1, 3.2, 3.3, 3.4, 5.4_

  - [ ]* 8.2 Write property test for session extension on activity
    - **Property 9: Session Extension on Activity**
    - **Validates: Requirements 3.1**

  - [ ]* 8.3 Write property test for session invalidation on logout
    - **Property 10: Session Invalidation on Logout**
    - **Validates: Requirements 3.3**

  - [ ]* 8.4 Write unit test for session expiration timing
    - Test that new sessions expire in 30 minutes
    - Test that expired sessions are rejected
    - _Requirements: 2.6, 3.2_

- [ ] 9. Implement Profile Service
  - [ ] 9.1 Create ProfileService for profile management
    - Implement getProfile method
    - Implement updateProfile with validation and email uniqueness check
    - Implement validateProfileUpdate for all fields
    - Prevent date of birth modification
    - Log profile updates to audit log
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6_

  - [ ]* 9.2 Write property test for profile retrieval completeness
    - **Property 13: Profile Retrieval Completeness**
    - **Validates: Requirements 4.1**

  - [ ]* 9.3 Write property test for profile update validation
    - **Property 14: Profile Update Validation**
    - **Validates: Requirements 4.2**

  - [ ]* 9.4 Write property test for date of birth immutability
    - **Property 15: Date of Birth Immutability**
    - **Validates: Requirements 4.6**

- [ ] 10. Implement Password Change functionality
  - [ ] 10.1 Add changePassword method to PasswordService
    - Verify current password before allowing change
    - Validate new password strength
    - Hash new password before storage
    - Reject if new password equals current password
    - Invalidate all other sessions
    - Log password change to audit log
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 10.2 Write property test for current password verification
    - **Property 16: Current Password Verification for Password Change**
    - **Validates: Requirements 5.1**

  - [ ]* 10.3 Write property test for session invalidation on password change
    - **Property 17: Session Invalidation on Password Change**
    - **Validates: Requirements 5.4**

  - [ ]* 10.4 Write property test for same password rejection
    - **Property 18: Same Password Rejection**
    - **Validates: Requirements 5.6**

- [ ] 11. Implement Authorization Service
  - [ ] 11.1 Create AuthorizationService for role-based access control
    - Implement hasPermission method checking role permissions
    - Implement getPermissions method
    - Implement assignRole method (used during registration)
    - Implement default-deny logic (deny unless explicitly granted)
    - _Requirements: 6.1, 6.2, 6.3, 6.4_

  - [ ]* 11.2 Write property test for authorization checks
    - **Property 19: Authorization Check for Protected Resources**
    - **Validates: Requirements 6.2**

  - [ ]* 11.3 Write property test for default deny authorization
    - **Property 20: Default Deny Authorization**
    - **Validates: Requirements 6.4**

  - [ ]* 11.4 Write unit test for patient permissions
    - Test that patient role has expected permissions (read/write own_profile, read dashboard)
    - _Requirements: 6.3_

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement Express middleware
  - [ ] 13.1 Create authentication middleware
    - Extract session ID from cookie
    - Validate session using SessionService
    - Attach user information to request object
    - Redirect to login if session invalid
    - _Requirements: 3.5, 3.6_

  - [ ] 13.2 Create authorization middleware
    - Check user permissions for requested resource
    - Return 403 if access denied
    - Log access denials to audit log
    - _Requirements: 6.2, 6.4_

  - [ ] 13.3 Create security headers middleware
    - Set Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Strict-Transport-Security
    - Set cache control headers for sensitive pages
    - _Requirements: 9.1, 9.6_

  - [ ] 13.4 Create HTTPS redirect middleware
    - Redirect HTTP requests to HTTPS in production
    - _Requirements: 9.2_

  - [ ] 13.5 Create CSRF protection middleware
    - Generate and validate CSRF tokens for state-changing operations
    - _Requirements: 9.4_

  - [ ] 13.6 Create input sanitization middleware
    - Sanitize all user input to prevent injection attacks
    - Validate input formats
    - _Requirements: 9.3_

  - [ ] 13.7 Create error handling middleware
    - Log full error details
    - Return user-friendly error messages without sensitive details
    - Handle specific error types appropriately
    - _Requirements: 10.1, 10.3_

  - [ ]* 13.8 Write property test for secure cookie configuration
    - **Property 11: Secure Cookie Configuration**
    - **Validates: Requirements 3.5**

  - [ ]* 13.9 Write property test for authentication enforcement
    - **Property 12: Authentication Enforcement**
    - **Validates: Requirements 3.6**

  - [ ]* 13.10 Write property test for security headers
    - **Property 25: Security Headers on All Responses**
    - **Validates: Requirements 9.1**

  - [ ]* 13.11 Write property test for HTTPS enforcement
    - **Property 26: HTTPS Enforcement**
    - **Validates: Requirements 9.2**

  - [ ]* 13.12 Write property test for input sanitization
    - **Property 27: Input Sanitization**
    - **Validates: Requirements 9.3**

  - [ ]* 13.13 Write property test for CSRF protection
    - **Property 28: CSRF Protection**
    - **Validates: Requirements 9.4**

  - [ ]* 13.14 Write property test for cache control headers
    - **Property 30: Cache Control for Sensitive Pages**
    - **Validates: Requirements 9.6**

  - [ ]* 13.15 Write property test for error message safety
    - **Property 31: Error Message Safety**
    - **Validates: Requirements 10.1**

  - [ ]* 13.16 Write property test for error logging vs display separation
    - **Property 33: Error Logging vs Display Separation**
    - **Validates: Requirements 10.3**

- [ ] 14. Implement authentication controllers and routes
  - [ ] 14.1 Create registration endpoint (POST /api/auth/register)
    - Validate registration request body
    - Call AuthenticationService.register
    - Return success response with user ID
    - Handle errors (email exists, invalid password)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

  - [ ] 14.2 Create login endpoint (POST /api/auth/login)
    - Validate login request body
    - Call AuthenticationService.login
    - Set session cookie with secure attributes
    - Return success response
    - Handle errors (invalid credentials, account locked)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.5_

  - [ ] 14.3 Create logout endpoint (POST /api/auth/logout)
    - Require authentication
    - Call SessionService.invalidateSession
    - Clear session cookie
    - Return success response
    - _Requirements: 3.3, 3.4_

  - [ ] 14.4 Create password change endpoint (POST /api/auth/change-password)
    - Require authentication
    - Validate request body
    - Call PasswordService.changePassword
    - Return success response
    - Handle errors (invalid current password, same password)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ]* 14.5 Write integration tests for authentication endpoints
    - Test complete registration flow
    - Test complete login flow
    - Test complete logout flow
    - Test complete password change flow
    - _Requirements: 1.1-1.6, 2.1-2.6, 3.3-3.4, 5.1-5.6_

- [ ] 15. Implement profile controllers and routes
  - [ ] 15.1 Create get profile endpoint (GET /api/profile)
    - Require authentication
    - Call ProfileService.getProfile with authenticated user ID
    - Return profile data
    - _Requirements: 4.1_

  - [ ] 15.2 Create update profile endpoint (PUT /api/profile)
    - Require authentication
    - Validate request body
    - Call ProfileService.updateProfile
    - Return updated profile data
    - Handle errors (email exists, immutable field, validation errors)
    - _Requirements: 4.2, 4.3, 4.4, 4.6_

  - [ ]* 15.3 Write property test for field-specific validation errors
    - **Property 32: Field-Specific Validation Errors**
    - **Validates: Requirements 10.2**

  - [ ]* 15.4 Write integration tests for profile endpoints
    - Test complete profile retrieval flow
    - Test complete profile update flow
    - Test email change requiring re-authentication
    - _Requirements: 4.1-4.6_

- [ ] 16. Implement dashboard controller and routes
  - [ ] 16.1 Create dashboard endpoint (GET /api/dashboard)
    - Require authentication
    - Get user profile for welcome message
    - Return dashboard data with personalized welcome message
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

  - [ ]* 16.2 Write property test for dashboard welcome message personalization
    - **Property 21: Dashboard Welcome Message Personalization**
    - **Validates: Requirements 7.2**

  - [ ]* 16.3 Write unit test for dashboard redirect after login
    - Test that successful login redirects to dashboard
    - _Requirements: 7.1_

  - [ ]* 16.4 Write unit test for dashboard navigation options
    - Test that dashboard displays expected navigation elements
    - _Requirements: 7.3_

- [ ] 17. Implement frontend UI pages
  - [ ] 17.1 Create registration page (HTML/CSS/JS)
    - Form with email, password, name, date of birth, phone, address fields
    - Client-side validation with immediate feedback
    - Submit to /api/auth/register endpoint
    - Display validation errors inline
    - Redirect to login on success
    - _Requirements: 1.1, 1.4, 10.2_

  - [ ] 17.2 Create login page (HTML/CSS/JS)
    - Form with email and password fields
    - Submit to /api/auth/login endpoint
    - Display error messages for invalid credentials or account lockout
    - Redirect to dashboard on success
    - _Requirements: 2.1, 2.3, 2.4, 10.4_

  - [ ] 17.3 Create dashboard page (HTML/CSS/JS)
    - Display welcome message with patient name
    - Navigation menu with links to profile, logout
    - Responsive layout for different screen sizes
    - _Requirements: 7.1, 7.2, 7.3, 7.5_

  - [ ] 17.4 Create profile page (HTML/CSS/JS)
    - Display current profile information
    - Form for updating profile fields
    - Disable date of birth field (immutable)
    - Submit to /api/profile endpoint
    - Display validation errors inline
    - _Requirements: 4.1, 4.2, 4.6, 10.2_

  - [ ] 17.5 Create password change page (HTML/CSS/JS)
    - Form with current password, new password, confirm password fields
    - Client-side validation for password strength
    - Submit to /api/auth/change-password endpoint
    - Display success message or errors
    - _Requirements: 5.1, 5.2, 5.6_

  - [ ]* 17.6 Write property test for XSS prevention
    - **Property 29: XSS Prevention through Output Escaping**
    - **Validates: Requirements 9.5**

- [ ] 18. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 19. Set up logging and monitoring
  - [ ] 19.1 Configure Winston logger
    - Set up structured JSON logging
    - Configure log levels (ERROR, WARN, INFO, DEBUG)
    - Add correlation IDs for request tracing
    - Separate audit logs from application logs
    - _Requirements: 10.3_

  - [ ] 19.2 Add request logging middleware
    - Log all incoming requests with method, path, user ID
    - Log response status and duration
    - _Requirements: 8.1_

  - [ ] 19.3 Add performance monitoring
    - Track login success/failure rates
    - Track session creation/expiration rates
    - Track password change frequency
    - Track audit log write latency
    - _Requirements: All (observability)_

- [ ] 20. Create database seed script
  - [ ] 20.1 Create seed script for initial data
    - Insert initial patient permissions into permissions table
    - Create sample patient account for testing
    - _Requirements: 6.3_

- [ ] 21. Create deployment configuration
  - [ ] 21.1 Create environment configuration
    - Database connection settings
    - Session secret for cookie signing
    - HTTPS configuration
    - CORS settings
    - Rate limiting configuration
    - _Requirements: 9.2_

  - [ ] 21.2 Create Docker configuration (optional)
    - Dockerfile for application
    - Docker Compose for application + PostgreSQL
    - _Requirements: All (deployment)_

- [ ] 22. Final integration testing and validation
  - [ ]* 22.1 Run all property tests (minimum 100 iterations each)
    - Verify all 33 correctness properties pass
    - _Requirements: All_

  - [ ]* 22.2 Run all unit tests
    - Verify all edge cases and examples pass
    - _Requirements: All_

  - [ ]* 22.3 Run integration tests
    - Test complete user journeys end-to-end
    - _Requirements: All_

  - [ ]* 22.4 Run security tests
    - Test SQL injection prevention
    - Test XSS prevention
    - Test CSRF prevention
    - Test session security
    - _Requirements: 9.1-9.6_

- [ ] 23. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation at key milestones
- Property tests validate universal correctness properties (minimum 100 iterations each)
- Unit tests validate specific examples, edge cases, and error conditions
- Integration tests validate end-to-end flows and component interactions
- The implementation follows a bottom-up approach: infrastructure → data layer → business logic → web layer → UI
- All database queries use parameterized statements to prevent SQL injection
- All user input is validated and sanitized before processing
- All passwords are hashed with bcrypt before storage
- All security-relevant events are logged to the audit log
- All responses include appropriate security headers
