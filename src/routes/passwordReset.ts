/**
 * Password Reset Routes
 */

import { Router, type Router as ExpressRouter } from 'express';
import { requestPasswordReset, verifyResetToken, resetPassword } from '../controllers/passwordResetController';

const router: ExpressRouter = Router();

// Request password reset (send email with token)
router.post('/request', requestPasswordReset);

// Verify if a reset token is valid
router.get('/verify', verifyResetToken);

// Reset password with token
router.post('/reset', resetPassword);

export default router;
