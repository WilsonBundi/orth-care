import { Router } from 'express';
import { appointmentController } from '../controllers/appointmentController';
import { authenticate } from '../middleware/auth';

const router: any = Router();

router.use(authenticate);

router.post('/', appointmentController.createAppointment.bind(appointmentController));
router.get('/my', appointmentController.getMyAppointments.bind(appointmentController));
router.get('/upcoming', appointmentController.getUpcomingAppointments.bind(appointmentController));
router.get('/available-slots', appointmentController.getAvailableSlots.bind(appointmentController));
router.get('/:id', appointmentController.getAppointment.bind(appointmentController));
router.put('/:id', appointmentController.updateAppointment.bind(appointmentController));
router.post('/:id/cancel', appointmentController.cancelAppointment.bind(appointmentController));
router.post('/:id/reschedule', appointmentController.rescheduleAppointment.bind(appointmentController));

export default router;
