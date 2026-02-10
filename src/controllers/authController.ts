import { Request, Response } from 'express';
import { authenticationService } from '../services/AuthenticationService';
import { sessionService } from '../services/SessionService';
import { PasswordService } from '../services/PasswordService';
import { userRepository } from '../repositories/UserRepository';
import { auditService } from '../services/AuditService';
import { AuthRequest } from '../middleware/auth';
import { AuditEventType, LogoutReason } from '../types/models';

const passwordService = new PasswordService();

export async function register(req: Request, res: Response) {
  try {
    const { 
      email, 
      password, 
      firstName, 
      lastName, 
      dateOfBirth, 
      phoneNumber, 
      address,
      country,
      county,
      constituency,
      ward
    } = req.body;

    // Map the location fields to Address interface
    const addressObj = {
      street: address || '',
      city: constituency || '',
      state: county || '',
      zipCode: ward || '',
      country: country || 'Kenya'
    };

    const user = await authenticationService.register(
      email,
      password,
      firstName,
      lastName,
      new Date(dateOfBirth),
      phoneNumber,
      addressObj,
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown'
    );

    // Auto-login after registration
    const session = await authenticationService.login(
      email,
      password,
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown'
    );

    res.cookie('sessionId', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60 * 1000
    });

    res.status(201).json({
      token: session.id,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      message: 'Registration successful'
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}

export async function login(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    const session = await authenticationService.login(
      email,
      password,
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown'
    );

    // Get user data
    const user = await userRepository.findById(session.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.cookie('sessionId', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 60 * 1000
    });

    res.json({
      token: session.id, // For compatibility with frontend
      sessionId: session.id,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      message: 'Login successful'
    });
  } catch (error: any) {
    res.status(401).json({ error: error.message });
  }
}

export async function logout(req: AuthRequest, res: Response) {
  try {
    if (req.sessionId) {
      await sessionService.invalidateSession(
        req.sessionId,
        LogoutReason.EXPLICIT,
        req.ip || 'unknown',
        req.get('user-agent') || 'unknown'
      );
    }

    res.clearCookie('sessionId');
    res.json({ message: 'Logout successful' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function changePassword(req: AuthRequest, res: Response) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId!;

    const user = await userRepository.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await passwordService.verifyPassword(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Validate new password
    const validation = passwordService.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      return res.status(400).json({ error: validation.errors.password });
    }

    // Check if new password is same as current
    const isSame = await passwordService.verifyPassword(newPassword, user.passwordHash);
    if (isSame) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    // Hash and update password
    const newHash = await passwordService.hashPassword(newPassword);
    await userRepository.updatePasswordHash(userId, newHash);

    // Invalidate all other sessions
    await sessionService.invalidateAllSessionsExcept(userId, req.sessionId!);

    // Log audit event
    await auditService.logEvent({
      userId,
      eventType: AuditEventType.PASSWORD_CHANGED,
      ipAddress: req.ip || 'unknown',
      userAgent: req.get('user-agent') || 'unknown',
      outcome: 'success'
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
