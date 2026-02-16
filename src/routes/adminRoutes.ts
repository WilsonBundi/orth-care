import { Router, type Router as ExpressRouter } from 'express';
import { adminController } from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { requireRole } from '../middleware/roleCheck';
import { apiRateLimiter } from '../middleware/rateLimiting';

const router: ExpressRouter = Router();

// All routes require authentication and admin role
router.use(authenticate);
router.use(apiRateLimiter);
router.use(requireRole('admin'));

// Get all users
router.get('/users', adminController.getAllUsers.bind(adminController));

// Get system statistics
router.get('/stats', adminController.getSystemStats.bind(adminController));

export default router;
