import { Router } from 'express';
import { register, login, logout, changePassword } from '../controllers/authController';
import { getProfile, updateProfile } from '../controllers/profileController';
import { getDashboard } from '../controllers/dashboardController';
import { authenticate } from '../middleware/auth';
import { authorize } from '../middleware/authorization';
import mfaRoutes from './mfa';
import appointmentRoutes from './appointments';
import invoiceRoutes from './invoiceRoutes';
import fileRoutes from './fileRoutes';
import passwordResetRoutes from './passwordReset';
import adminRoutes from './adminRoutes';
import { globalRateLimiter, authRateLimiter } from '../middleware/rateLimiting';

const router: any = Router();

// Apply global rate limiting
router.use(globalRateLimiter);

// Auth routes with stricter rate limiting
router.post('/auth/register', authRateLimiter, register);
router.post('/auth/login', authRateLimiter, login);
router.post('/auth/logout', authenticate, logout);
router.post('/auth/change-password', authenticate, changePassword);

// Password reset routes
router.use('/password-reset', passwordResetRoutes);

// MFA routes
router.use('/mfa', mfaRoutes);

// Profile routes
router.get('/profile', authenticate, authorize('read', 'own_profile'), getProfile);
router.put('/profile', authenticate, authorize('write', 'own_profile'), updateProfile);

// Dashboard route
router.get('/dashboard', authenticate, authorize('read', 'dashboard'), getDashboard);

// Appointment routes
router.use('/appointments', appointmentRoutes);

// Invoice routes (admin only)
router.use('/invoices', invoiceRoutes);

// File routes for medical records (admin only)
router.use('/files', fileRoutes);

// Admin routes (admin only)
router.use('/admin', adminRoutes);

export default router;
