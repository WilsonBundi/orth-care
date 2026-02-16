import { Router } from 'express';
import { appointmentController } from '../controllers/appointmentController';
import { authenticate } from '../middleware/auth';

const router: any = Router();

router.use(authenticate);

// Patient/Doctor endpoints
router.post('/book', appointmentController.createAppointment.bind(appointmentController));
router.get('/my', appointmentController.getMyAppointments.bind(appointmentController));
router.get('/upcoming', appointmentController.getUpcomingAppointments.bind(appointmentController));
router.get('/available-slots', appointmentController.getAvailableSlots.bind(appointmentController));

// Admin endpoints
router.get('/all', appointmentController.getAllAppointments.bind(appointmentController));
router.put('/:id/confirm', appointmentController.confirmAppointment.bind(appointmentController));
router.put('/:id/complete', appointmentController.completeAppointment.bind(appointmentController));
router.put('/:id/cancel', appointmentController.cancelAppointment.bind(appointmentController));

// General endpoints
router.get('/:id', appointmentController.getAppointment.bind(appointmentController));
router.put('/:id', appointmentController.updateAppointment.bind(appointmentController));
router.post('/:id/reschedule', appointmentController.rescheduleAppointment.bind(appointmentController));

export default router;
