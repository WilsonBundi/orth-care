import { userRepository } from '../repositories/UserRepository';
import { sessionRepository } from '../repositories/SessionRepository';
import { PasswordService } from './PasswordService';
import { auditService } from './AuditService';
import { User, Session, AuditEventType, Address } from '../types/models';
import crypto from 'crypto';

const passwordService = new PasswordService();

export class AuthenticationService {
  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    dateOfBirth: Date,
    phoneNumber: string,
    address: Address,
    ipAddress: string,
    userAgent: string
  ): Promise<User> {
    // Check if email already exists
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new Error(`Email ${email} is already registered`);
    }

    // Validate password strength
    const validation = passwordService.validatePasswordStrength(password);
    if (!validation.isValid) {
      throw new Error(validation.errors.password || 'Invalid password');
    }

    // Hash password
    const passwordHash = await passwordService.hashPassword(password);

    // Create user
    const user = await userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      dateOfBirth,
      phoneNumber,
      address
    });

    // Log audit event
    await auditService.logEvent({
      userId: user.id,
      eventType: AuditEventType.ACCOUNT_CREATED,
      ipAddress,
      userAgent,
      outcome: 'success'
    });

    return user;
  }

  async login(email: string, password: string, ipAddress: string, userAgent: string): Promise<Session> {
    // Check if account is locked
    const isLocked = await userRepository.isAccountLocked(email);
    if (isLocked) {
      const user = await userRepository.findByEmail(email);
      throw new Error(`Account is locked until ${user?.lockedUntil?.toISOString()}`);
    }

    // Find user
    const user = await userRepository.findByEmail(email);
    if (!user) {
      await auditService.logEvent({
        userId: null,
        eventType: AuditEventType.LOGIN_FAILURE,
        ipAddress,
        userAgent,
        outcome: 'failure',
        details: { reason: 'user_not_found' }
      });
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValid = await passwordService.verifyPassword(password, user.passwordHash);
    if (!isValid) {
      await userRepository.incrementFailedLoginAttempts(email);
      const attempts = user.failedLoginAttempts + 1;
      
      if (attempts >= 3) {
        const lockUntil = new Date(Date.now() + 15 * 60 * 1000);
        await userRepository.lockAccount(email, lockUntil);
        await auditService.logEvent({
          userId: user.id,
          eventType: AuditEventType.ACCOUNT_LOCKED,
          ipAddress,
          userAgent,
          outcome: 'success'
        });
      }

      await auditService.logEvent({
        userId: user.id,
        eventType: AuditEventType.LOGIN_FAILURE,
        ipAddress,
        userAgent,
        outcome: 'failure',
        details: { reason: 'invalid_password' }
      });
      throw new Error('Invalid email or password');
    }

    // Reset failed attempts
    await userRepository.resetFailedLoginAttempts(email);

    // Create session
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    const session = await sessionRepository.create({
      id: sessionId,
      userId: user.id,
      ipAddress,
      userAgent,
      expiresAt
    });

    // Log audit event
    await auditService.logEvent({
      userId: user.id,
      eventType: AuditEventType.LOGIN_SUCCESS,
      ipAddress,
      userAgent,
      outcome: 'success'
    });

    return session;
  }
}

export const authenticationService = new AuthenticationService();
