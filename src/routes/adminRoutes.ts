import { Router, type Router as ExpressRouter } from 'express';
import { adminController } from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { requireMinimumRole } from '../middleware/roleCheck';
import { apiRateLimiter } from '../middleware/rateLimiting';
import { Role } from '../types/models';

const router: ExpressRouter = Router();

// All routes require authentication and minimum SYSTEM_ADMIN role
router.use(authenticate);
router.use(apiRateLimiter);
router.use(requireMinimumRole(Role.SYSTEM_ADMIN));

// Get all users - Requires SYSTEM_ADMIN or higher
router.get('/users', adminController.getAllUsers.bind(adminController));

// Get system statistics - Requires SYSTEM_ADMIN or higher
router.get('/stats', adminController.getSystemStats.bind(adminController));

export default router;
