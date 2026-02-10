import { pool } from '../db/config';
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
  async createAppointment(input: CreateAppointmentInput): Promise<Appointment> {
    const id = uuidv4();
    const durationMinutes = this.calculateDuration(input.startTime, input.endTime);

    const result = await pool.query(
      `INSERT INTO appointments (
        id, patient_id, doctor_id, appointment_date, start_time, end_time,
        duration_minutes, appointment_type, reason, symptoms, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'scheduled')
      RETURNING *`,
      [
        id,
        input.patientId,
        input.doctorId,
        input.appointmentDate,
        input.startTime,
        input.endTime,
        durationMinutes,
        input.appointmentType,
        input.reason,
        input.symptoms,
      ]
    );

    return this.mapToAppointment(result.rows[0]);
  }

  async getAppointment(id: string): Promise<Appointment | null> {
    const result = await pool.query(
      'SELECT * FROM appointments WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) return null;
    return this.mapToAppointment(result.rows[0]);
  }

  async getPatientAppointments(patientId: string): Promise<Appointment[]> {
    const result = await pool.query(
      `SELECT * FROM appointments 
       WHERE patient_id = $1 
       ORDER BY appointment_date DESC, start_time DESC`,
      [patientId]
    );

    return result.rows.map(row => this.mapToAppointment(row));
  }

  async getDoctorAppointments(doctorId: string, date?: Date): Promise<Appointment[]> {
    let query = 'SELECT * FROM appointments WHERE doctor_id = $1';
    const params: any[] = [doctorId];

    if (date) {
      query += ' AND appointment_date = $2';
      params.push(date);
    }

    query += ' ORDER BY appointment_date, start_time';

    const result = await pool.query(query, params);
    return result.rows.map(row => this.mapToAppointment(row));
  }

  async getUpcomingAppointments(userId: string, role: string): Promise<Appointment[]> {
    const field = role === 'doctor' ? 'doctor_id' : 'patient_id';
    
    const result = await pool.query(
      `SELECT * FROM appointments 
       WHERE ${field} = $1 
       AND appointment_date >= CURRENT_DATE
       AND status IN ('scheduled', 'confirmed')
       ORDER BY appointment_date, start_time
       LIMIT 10`,
      [userId]
    );

    return result.rows.map(row => this.mapToAppointment(row));
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined) {
        fields.push(`${this.camelToSnake(key)} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    values.push(id);

    const result = await pool.query(
      `UPDATE appointments 
       SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    return this.mapToAppointment(result.rows[0]);
  }

  async cancelAppointment(id: string, cancelledBy: string, reason?: string): Promise<void> {
    await pool.query(
      `UPDATE appointments 
       SET status = 'cancelled',
           cancelled_by = $1,
           cancelled_at = CURRENT_TIMESTAMP,
           cancellation_reason = $2
       WHERE id = $3`,
      [cancelledBy, reason, id]
    );
  }

  async rescheduleAppointment(
    id: string,
    newDate: Date,
    newStartTime: string,
    newEndTime: string
  ): Promise<Appointment> {
    const durationMinutes = this.calculateDuration(newStartTime, newEndTime);

    const result = await pool.query(
      `UPDATE appointments 
       SET appointment_date = $1,
           start_time = $2,
           end_time = $3,
           duration_minutes = $4,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [newDate, newStartTime, newEndTime, durationMinutes, id]
    );

    return this.mapToAppointment(result.rows[0]);
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
    await pool.query(
      `UPDATE appointments 
       SET status = 'completed',
           notes = COALESCE($1, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [notes, id]
    );
  }

  async markAsNoShow(id: string): Promise<void> {
    await pool.query(
      `UPDATE appointments 
       SET status = 'no_show',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [id]
    );
  }

  private calculateDuration(startTime: string, endTime: string): number {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    
    return endMinutes - startMinutes;
  }

  private camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }

  private mapToAppointment(row: any): Appointment {
    return {
      id: row.id,
      patientId: row.patient_id,
      doctorId: row.doctor_id,
      appointmentDate: row.appointment_date,
      startTime: row.start_time,
      endTime: row.end_time,
      durationMinutes: row.duration_minutes,
      status: row.status,
      appointmentType: row.appointment_type,
      reason: row.reason,
      notes: row.notes,
      symptoms: row.symptoms,
    };
  }
}

export const appointmentService = new AppointmentService();
