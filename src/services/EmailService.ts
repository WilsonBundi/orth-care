/**
 * EmailService - Handles sending emails
 * 
 * Supports multiple providers with automatic fallback:
 * 1. SendGrid (recommended for production)
 * 2. Gmail (for development/testing)
 * 3. Console logging (fallback)
 */

import nodemailer from 'nodemailer';
import sgMail from '@sendgrid/mail';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

type EmailProvider = 'sendgrid' | 'gmail' | 'console';

export class EmailService {
  private transporter: any;
  private provider: EmailProvider = 'console';

  constructor() {
    this.setupEmailProvider();
  }

  /**
   * Setup email provider with automatic fallback
   */
  private setupEmailProvider() {
    // Try SendGrid first (best for production)
    const sendgridKey = process.env.SENDGRID_API_KEY;
    if (sendgridKey && sendgridKey.length > 10) {
      try {
        sgMail.setApiKey(sendgridKey);
        this.provider = 'sendgrid';
        console.log('✅ Email service configured (SendGrid)');
        return;
      } catch (error) {
        console.log('⚠️  SendGrid configuration failed, trying Gmail...');
      }
    }

    // Try Gmail as fallback
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASSWORD;
    if (emailUser && emailPass) {
      try {
        this.transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: emailUser,
            pass: emailPass
          }
        });
        this.provider = 'gmail';
        console.log('✅ Email service configured (Gmail)');
        return;
      } catch (error) {
        console.log('⚠️  Gmail configuration failed, using console mode...');
      }
    }

    // Fallback to console mode
    console.log('⚠️  No email provider configured. Using console mode.');
    console.log('📧 To enable email sending:');
    console.log('   Option 1 (Recommended): Add SENDGRID_API_KEY to .env');
    console.log('   Option 2: Add EMAIL_USER and EMAIL_PASSWORD to .env');
    this.provider = 'console';
  }

  /**
   * Send an email using the configured provider
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      switch (this.provider) {
        case 'sendgrid':
          return await this.sendWithSendGrid(options);
        
        case 'gmail':
          return await this.sendWithGmail(options);
        
        case 'console':
        default:
          return this.logToConsole(options);
      }
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      // Fallback to console
      return this.logToConsole(options);
    }
  }

  /**
   * Send email using SendGrid
   */
  private async sendWithSendGrid(options: EmailOptions): Promise<boolean> {
    try {
      const msg = {
        to: options.to,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@orthopediccare.com',
        subject: options.subject,
        text: options.text || '',
        html: options.html
      };

      await sgMail.send(msg);
      console.log(`✅ Email sent to ${options.to} via SendGrid`);
      return true;
    } catch (error: any) {
      console.error('❌ SendGrid error:', error.response?.body || error.message);
      throw error;
    }
  }

  /**
   * Send email using Gmail/Nodemailer
   */
  private async sendWithGmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Orthopedic's Care" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email sent to ${options.to} via Gmail: ${info.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Gmail error:', error);
      throw error;
    }
  }

  /**
   * Log email to console (fallback mode)
   */
  private logToConsole(options: EmailOptions): boolean {
    console.log('\n📧 ========== EMAIL (Console Mode) ==========');
    console.log(`To: ${options.to}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`\n${options.text || 'See HTML content'}`);
    console.log('============================================\n');
    return true;
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string, resetToken: string): Promise<boolean> {
    const resetLink = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password.html?token=${resetToken}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
          .button { display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
          .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔐 Password Reset Request</h1>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>We received a request to reset your password for your Orthopedic's Care account.</p>
            <p>Click the button below to reset your password:</p>
            <p style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </p>
            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background: white; padding: 10px; border-radius: 4px;">
              ${resetLink}
            </p>
            <div class="warning">
              <strong>⚠️ Important:</strong>
              <ul>
                <li>This link will expire in 1 hour</li>
                <li>If you didn't request this reset, please ignore this email</li>
                <li>Your password won't change until you create a new one</li>
              </ul>
            </div>
            <p>Best regards,<br><strong>Orthopedic's Care Team</strong></p>
          </div>
          <div class="footer">
            <p>This is an automated email. Please do not reply.</p>
            <p>&copy; ${new Date().getFullYear()} Orthopedic's Care. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
Password Reset Request

Hello,

We received a request to reset your password for your Orthopedic's Care account.

Click this link to reset your password:
${resetLink}

This link will expire in 1 hour.

If you didn't request this reset, please ignore this email.

Best regards,
Orthopedic's Care Team
    `;

    return this.sendEmail({
      to: email,
      subject: 'Password Reset Request - Orthopedic\'s Care',
      html,
      text
    });
  }
}

export const emailService = new EmailService();
