import { Router, type Router as ExpressRouter } from 'express';
import { adminController } from '../controllers/adminController';
import { authenticate } from '../middleware/auth';
import { requireMinimumRole } from '../middleware/roleCheck';
import { apiRateLimiter } from '../middleware/rateLimiting';
import { Role } from '../types/models';

const router: ExpressRouter = Router();

// All routes require authentication
router.use(authenticate);
router.use(apiRateLimiter);

// Get all patients - Requires RECEPTIONIST or higher
router.get('/patients', requireMinimumRole(Role.RECEPTIONIST), adminController.getAllPatients.bind(adminController));

// Get single patient - Requires RECEPTIONIST or higher
router.get('/patients/:id', requireMinimumRole(Role.RECEPTIONIST), adminController.getPatientById.bind(adminController));

// Get all users - Requires SYSTEM_ADMIN or higher
router.get('/users', requireMinimumRole(Role.SYSTEM_ADMIN), adminController.getAllUsers.bind(adminController));

// Update user role - Requires SUPER_ADMIN
router.put('/users/:id/role', requireMinimumRole(Role.SUPER_ADMIN), adminController.updateUserRole.bind(adminController));

// Get system statistics - Requires SYSTEM_ADMIN or higher
router.get('/stats', requireMinimumRole(Role.SYSTEM_ADMIN), adminController.getSystemStats.bind(adminController));

export default router;
