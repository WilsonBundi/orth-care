/**
 * Password Reset Routes
 */

import { Router } from 'express';
import { requestPasswordReset, verifyResetToken, resetPassword } from '../controllers/passwordResetController';

const router = Router();

// Request password reset (send email with token)
router.post('/request', requestPasswordReset);

// Verify if a reset token is valid
router.get('/verify', verifyResetToken);

// Reset password with token
router.post('/reset', resetPassword);

export default router;
