import { getFirestore } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';

export interface Appointment {
  id: string;
  patientId: string;
  doctorId: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  status: string;
  appointmentType: string;
  reason?: string;
  notes?: string;
  symptoms?: string[];
  confirmedBy?: string;
  confirmedAt?: Date;
  completedBy?: string;
  completedAt?: Date;
  cancelledBy?: string;
  cancelledAt?: Date;
  cancellationReason?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface CreateAppointmentInput {
  patientId: string;
  doctorId: string;
  appointmentDate: Date;
  startTime: string;
  endTime: string;
  appointmentType: string;
  reason?: string;
  symptoms?: string[];
}

export class AppointmentService {
  private get collection() {
    return getFirestore().collection('appointments');
  }

  async createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    const id = uuidv4();
    const durationMinutes = this.calculateDuration(input.startTime, input.endTime);

    const appointment: Appointment = {
      id,
      patientId: input.patientId,
      doctorId: input.doctorId,
      appointmentDate: input.appointmentDate,
      startTime: input.startTime,
      endTime: input.endTime,
      durationMinutes,
      appointmentType: input.appointmentType,
      reason: input.reason,
      symptoms: input.symptoms,
      status: 'scheduled',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await this.collection.doc(id).set(appointment);
    return appointment;
  }

  async getAppointment(id: string): Promise<Appointment | null> {
    const doc = await this.collection.doc(id).get();
    if (!doc.exists) return null;
    return doc.data() as Appointment;
  }

  async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    const snapshot = await this.collection
      .where('patientId', '==', patientId)
      .orderBy('appointmentDate', 'desc')
      .get();

    return snapshot.docs.map(doc => doc.data() as Appointment);
  }

  async getDoctorAppointments(doctorId: string, date?: Date): Promise<Appointment[]> {
    let query = this.collection.where('doctorId', '==', doctorId);

    if (date) {
      query = query.where('appointmentDate', '==', date);
    }

    const snapshot = await query.orderBy('appointmentDate').orderBy('startTime').get();
    return snapshot.docs.map(doc => doc.data() as Appointment);
  }

  async getUpcomingAppointments(userId: string, role: string): Promise<Appointment[]> {
    const field = role === 'doctor' ? 'doctorId' : 'patientId';
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const snapshot = await this.collection
      .where(field, '==', userId)
      .where('appointmentDate', '>=', today)
      .where('status', 'in', ['scheduled', 'confirmed'])
      .orderBy('appointmentDate')
      .orderBy('startTime')
      .limit(10)
      .get();

    return snapshot.docs.map(doc => doc.data() as Appointment);
  }

  async getAllAppointments(): Promise<Appointment[]> {
    const snapshot = await this.collection
      .orderBy('appointmentDate', 'desc')
      .orderBy('startTime', 'desc')
      .limit(500)
      .get();

    return snapshot.docs.map(doc => doc.data() as Appointment);
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    const updateData = {
      ...updates,
      updatedAt: new Date()
    };

    await this.collection.doc(id).update(updateData);
    
    const doc = await this.collection.doc(id).get();
    return doc.data() as Appointment;
  }

  async cancelAppointment(id: string, cancelledBy: string, reason?: string): Promise<void> {
    await this.collection.doc(id).update({
      status: 'cancelled',
      cancelledBy,
      cancelledAt: new Date(),
      cancellationReason: reason,
      updatedAt: new Date()
    });
  }

  async rescheduleAppointment(
    id: string,
    newDate: Date,
    newStartTime: string,
    newEndTime: string
  ): Promise<Appointment> {
    const durationMinutes = this.calculateDuration(newStartTime, newEndTime);

    await this.collection.doc(id).update({
      appointmentDate: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      durationMinutes,
      updatedAt: new Date()
    });

    const doc = await this.collection.doc(id).get();
    return doc.data() as Appointment;
  }

  async getAvailableSlots(doctorId: string, date: Date): Promise<string[]> {
    // Get doctor's appointments for the day
    const appointments = await this.getDoctorAppointments(doctorId, date);

    // Generate all possible slots (9 AM to 5 PM, 30-minute intervals)
    const allSlots: string[] = [];
    for (let hour = 9; hour < 17; hour++) {
      allSlots.push(`${hour.toString().padStart(2, '0')}:00`);
      allSlots.push(`${hour.toString().padStart(2, '0')}:30`);
    }

    // Filter out booked slots
    const bookedSlots = appointments.map(apt => apt.startTime);
    return allSlots.filter(slot => !bookedSlots.includes(slot));
  }

  async markAsCompleted(id: string, notes?: string): Promise<void> {
    const updateData: any = {
      status: 'completed',
      updatedAt: new Date()
    };

    if (notes) {
      updateData.notes = notes;
    }

    await this.collection.doc(id).update(updateData);
  }

  async markAsNoShow(id: string): Promise<void> {
    await this.collection.doc(id).update({
      status: 'no_show',
      updatedAt: new Date()
    });
  }

  private calculateDuration(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return endMinutes - startMinutes;
  }
}

export const appointmentService = new AppointmentService();
