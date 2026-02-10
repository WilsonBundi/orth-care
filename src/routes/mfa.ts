import { Router } from 'express';
import { mfaController } from '../controllers/mfaController';
import { authenticate } from '../middleware/auth';

const router: any = Router();

// All MFA routes require authentication
router.use(authenticate);

router.post('/setup', mfaController.setupMFA.bind(mfaController));
router.post('/enable', mfaController.enableMFA.bind(mfaController));
router.post('/verify', mfaController.verifyMFA.bind(mfaController));
router.post('/disable', mfaController.disableMFA.bind(mfaController));
router.post('/backup-codes/regenerate', mfaController.regenerateBackupCodes.bind(mfaController));
router.get('/trusted-devices', mfaController.getTrustedDevices.bind(mfaController));
router.delete('/trusted-devices/:deviceId', mfaController.removeTrustedDevice.bind(mfaController));

export default router;
