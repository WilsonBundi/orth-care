/**
 * Password Reset Controller
 */

import { Request, Response } from 'express';
import { passwordResetService } from '../services/PasswordResetService';

/**
 * Request password reset - sends reset email
 */
export async function requestPasswordReset(req: Request, res: Response) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    await passwordResetService.requestPasswordReset(email);

    // Always return success to prevent email enumeration
    res.json({ 
      message: 'If this email exists, a password reset link has been sent',
      success: true 
    });
  } catch (error: any) {
    console.error('Password reset request error:', error);
    // Don't reveal specific errors
    res.json({ 
      message: 'If this email exists, a password reset link has been sent',
      success: true 
    });
  }
}

/**
 * Verify reset token validity
 */
export async function verifyResetToken(req: Request, res: Response) {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token is required', valid: false });
    }

    const isValid = await passwordResetService.verifyResetToken(token);

    res.json({ valid: isValid });
  } catch (error: any) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Failed to verify token', valid: false });
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(req: Request, res: Response) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    await passwordResetService.resetPassword(token, newPassword);

    res.json({ 
      message: 'Password reset successful. You can now login with your new password.',
      success: true 
    });
  } catch (error: any) {
    console.error('Password reset error:', error);
    res.status(400).json({ error: error.message });
  }
}
