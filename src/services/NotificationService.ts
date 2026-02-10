import { pool } from '../db/config';
import { v4 as uuidv4 } from 'uuid';
import sgMail from '@sendgrid/mail';
import twilio from 'twilio';

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize Twilio
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

export interface Notification {
  id: string;
  userId: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  channel: string;
  title: string;
  message: string;
  status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read';
  sentAt?: Date;
  deliveredAt?: Date;
  readAt?: Date;
  metadata?: any;
}

export interface CreateNotificationInput {
  userId: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  channel: string;
  title: string;
  message: string;
  metadata?: any;
}

export class NotificationService {
  async createNotification(input: CreateNotificationInput): Promise<Notification> {
    const id = uuidv4();

    const result = await pool.query(
      `INSERT INTO notifications (
        id, user_id, type, channel, title, message, metadata, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
      RETURNING *`,
      [
        id,
        input.userId,
        input.type,
        input.channel,
        input.title,
        input.message,
        JSON.stringify(input.metadata || {}),
      ]
    );

    const notification = this.mapToNotification(result.rows[0]);

    // Send notification asynchronously
    this.sendNotification(notification).catch(err => {
      console.error('Failed to send notification:', err);
    });

    return notification;
  }

  async sendNotification(notification: Notification): Promise<void> {
    try {
      switch (notification.type) {
        case 'email':
          await this.sendEmail(notification);
          break;
        case 'sms':
          await this.sendSMS(notification);
          break;
        case 'in_app':
          await this.markAsDelivered(notification.id);
          break;
        default:
          throw new Error(`Unsupported notification type: ${notification.type}`);
      }

      await this.updateStatus(notification.id, 'sent');
    } catch (error) {
      console.error('Notification send error:', error);
      await this.updateStatus(notification.id, 'failed');
      await this.incrementRetryCount(notification.id);
    }
  }

  private async sendEmail(notification: Notification): Promise<void> {
    if (!process.env.SENDGRID_API_KEY) {
      console.log('SendGrid not configured, skipping email');
      return;
    }

    // Get user email
    const userResult = await pool.query(
      'SELECT email FROM users WHERE id = $1',
      [notification.userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const email = userResult.rows[0].email;

    await sgMail.send({
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'noreply@patientportal.com',
      subject: notification.title,
      text: notification.message,
      html: `<p>${notification.message}</p>`,
    });
  }

  private async sendSMS(notification: Notification): Promise<void> {
    if (!twilioClient) {
      console.log('Twilio not configured, skipping SMS');
      return;
    }

    // Get user phone
    const userResult = await pool.query(
      'SELECT phone_number FROM users WHERE id = $1',
      [notification.userId]
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].phone_number) {
      throw new Error('User phone not found');
    }

    const phoneNumber = userResult.rows[0].phone_number;

    await twilioClient.messages.create({
      body: notification.message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });
  }

  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT $2`,
      [userId, limit]
    );

    return result.rows.map(row => this.mapToNotification(row));
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    const result = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = $1 AND read_at IS NULL
       ORDER BY created_at DESC`,
      [userId]
    );

    return result.rows.map(row => this.mapToNotification(row));
  }

  async markAsRead(notificationId: string): Promise<void> {
    await pool.query(
      `UPDATE notifications 
       SET read_at = CURRENT_TIMESTAMP, status = 'read'
       WHERE id = $1`,
      [notificationId]
    );
  }

  async markAllAsRead(userId: string): Promise<void> {
    await pool.query(
      `UPDATE notifications 
       SET read_at = CURRENT_TIMESTAMP, status = 'read'
       WHERE user_id = $1 AND read_at IS NULL`,
      [userId]
    );
  }

  async deleteNotification(notificationId: string): Promise<void> {
    await pool.query('DELETE FROM notifications WHERE id = $1', [notificationId]);
  }

  private async updateStatus(notificationId: string, status: string): Promise<void> {
    await pool.query(
      'UPDATE notifications SET status = $1, sent_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, notificationId]
    );
  }

  private async markAsDelivered(notificationId: string): Promise<void> {
    await pool.query(
      'UPDATE notifications SET status = $1, delivered_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['delivered', notificationId]
    );
  }

  private async incrementRetryCount(notificationId: string): Promise<void> {
    await pool.query(
      `UPDATE notifications 
       SET retry_count = retry_count + 1,
           next_retry_at = CURRENT_TIMESTAMP + INTERVAL '5 minutes'
       WHERE id = $1`,
      [notificationId]
    );
  }

  // Template methods
  async sendWelcomeEmail(userId: string, firstName: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'email',
      channel: 'welcome',
      title: 'Welcome to Patient Portal',
      message: `Hi ${firstName}, welcome to our patient portal! We're excited to have you.`,
    });
  }

  async sendPasswordResetEmail(userId: string, resetToken: string): Promise<void> {
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    
    await this.createNotification({
      userId,
      type: 'email',
      channel: 'password_reset',
      title: 'Password Reset Request',
      message: `Click here to reset your password: ${resetUrl}`,
      metadata: { resetToken },
    });
  }

  async sendAppointmentReminder(userId: string, appointmentDate: Date, doctorName: string): Promise<void> {
    await this.createNotification({
      userId,
      type: 'sms',
      channel: 'appointment_reminder',
      title: 'Appointment Reminder',
      message: `Reminder: You have an appointment with Dr. ${doctorName} on ${appointmentDate.toLocaleDateString()}.`,
    });
  }

  async sendAppointmentConfirmation(userId: string, appointmentDate: Date): Promise<void> {
    await this.createNotification({
      userId,
      type: 'email',
      channel: 'appointment_confirmation',
      title: 'Appointment Confirmed',
      message: `Your appointment on ${appointmentDate.toLocaleDateString()} has been confirmed.`,
    });
  }

  private mapToNotification(row: any): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      channel: row.channel,
      title: row.title,
      message: row.message,
      status: row.status,
      sentAt: row.sent_at,
      deliveredAt: row.delivered_at,
      readAt: row.read_at,
      metadata: row.metadata,
    };
  }
}

export const notificationService = new NotificationService();
