/**
 * PasswordResetService - Handles password reset functionality
 */

import { userRepository } from '../repositories';
import { passwordResetRepository } from '../repositories/PasswordResetRepository.firebase';
import { PasswordService } from './PasswordService';
import { emailService } from './EmailService';
import crypto from 'crypto';

const passwordService = new PasswordService();

export class PasswordResetService {
  /**
   * Request a password reset - generates token and sends email
   */
  async requestPasswordReset(email: string): Promise<{ token: string; expiresAt: Date }> {
    // Find user by email
    const user = await userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not (security)
      throw new Error('If this email exists, a password reset link has been sent');
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    
    // Token expires in 1 hour
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

    // Invalidate any existing tokens for this user
    await passwordResetRepository.invalidateUserTokens(user.id);

    // Create new token
    await passwordResetRepository.create(user.id, email, token, expiresAt);

    // Send email with reset link
    await emailService.sendPasswordResetEmail(email, token);

    return { token, expiresAt };
  }

  /**
   * Verify if a reset token is valid
   */
  async verifyResetToken(token: string): Promise<boolean> {
    const resetToken = await passwordResetRepository.findByToken(token);
    
    if (!resetToken) {
      return false;
    }

    // Check if token has expired
    if (resetToken.expiresAt < new Date()) {
      return false;
    }

    return true;
  }

  /**
   * Reset password using token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Find and validate token
    const resetToken = await passwordResetRepository.findByToken(token);
    
    if (!resetToken) {
      throw new Error('Invalid or expired reset token');
    }

    // Check if token has expired
    if (resetToken.expiresAt < new Date()) {
      throw new Error('Reset token has expired');
    }

    // Validate new password
    const validation = passwordService.validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      throw new Error(validation.errors.password || 'Invalid password');
    }

    // Hash new password
    const passwordHash = await passwordService.hashPassword(newPassword);

    // Update user password
    await userRepository.updatePasswordHash(resetToken.userId, passwordHash);

    // Mark token as used
    await passwordResetRepository.markAsUsed(resetToken.id);

    console.log(`Password reset successful for user: ${resetToken.userId}`);
  }
}

export const passwordResetService = new PasswordResetService();
