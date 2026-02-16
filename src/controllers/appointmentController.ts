import { Request, Response } from 'express';
import { appointmentService } from '../services/AppointmentService';
import { notificationService } from '../services/NotificationService';
import { auditService } from '../services/AuditService';
import { AuditEventType } from '../types/models';

export class AppointmentController {
  async createAppointment(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const { doctorId, appointmentDate, startTime, endTime, appointmentType, reason, symptoms } = req.body;

      const appointment = await appointmentService.createAppointment({
        patientId: userId,
        doctorId,
        appointmentDate: new Date(appointmentDate),
        startTime,
        endTime,
        appointmentType,
        reason,
        symptoms,
      });

      // Send confirmation notification
      await notificationService.sendAppointmentConfirmation(userId, new Date(appointmentDate));

      await auditService.logEvent({
        userId,
        eventType: AuditEventType.APPOINTMENT_CREATED,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || '',
        outcome: 'success',
        details: { appointmentId: appointment.id },
      });

      res.status(201).json(appointment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAppointment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const appointment = await appointmentService.getAppointment(id);

      if (!appointment) {
        return res.status(404).json({ error: 'Appointment not found' });
      }

      res.json(appointment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getMyAppointments(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const role = (req as any).user?.role || 'patient';

      const appointments = role === 'doctor'
        ? await appointmentService.getDoctorAppointments(userId)
        : await appointmentService.getPatientAppointments(userId);

      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUpcomingAppointments(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;
      const role = (req as any).user?.role || 'patient';

      const appointments = await appointmentService.getUpcomingAppointments(userId, role);

      res.json(appointments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateAppointment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const appointment = await appointmentService.updateAppointment(id, updates);

      res.json(appointment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async cancelAppointment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).userId;
      const { reason } = req.body;

      await appointmentService.cancelAppointment(id, userId, reason);

      res.json({ message: 'Appointment cancelled successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async rescheduleAppointment(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { appointmentDate, startTime, endTime } = req.body;

      const appointment = await appointmentService.rescheduleAppointment(
        id,
        new Date(appointmentDate),
        startTime,
        endTime
      );

      res.json(appointment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  async getAvailableSlots(req: Request, res: Response) {
    try {
      const { doctorId, date } = req.query;

      if (!doctorId || !date) {
        return res.status(400).json({ error: 'doctorId and date are required' });
      }

      const slots = await appointmentService.getAvailableSlots(
        doctorId as string,
        new Date(date as string)
      );

      res.json({ slots });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const appointmentController = new AppointmentController();
