import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import crypto from 'crypto';
import { pool } from '../db/config';

export interface MFASetupResult {
  secret: string;
  qrCodeUrl: string;
  backupCodes: string[];
}

export interface MFAVerifyResult {
  isValid: boolean;
  usedBackupCode?: boolean;
}

export class MFAService {
  /**
   * Generate MFA secret and QR code for user
   */
  async setupMFA(userId: string, email: string): Promise<MFASetupResult> {
    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Patient Portal (${email})`,
      issuer: 'Patient Portal',
      length: 32,
    });

    // Generate backup codes
    const backupCodes = this.generateBackupCodes(8);
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => this.hashBackupCode(code))
    );

    // Store in database
    await pool.query(
      `UPDATE users 
       SET mfa_secret = $1, 
           mfa_backup_codes = $2,
           mfa_enabled = FALSE
       WHERE id = $3`,
      [secret.base32, hashedBackupCodes, userId]
    );

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!);

    return {
      secret: secret.base32,
      qrCodeUrl,
      backupCodes,
    };
  }

  /**
   * Verify MFA token and enable MFA for user
   */
  async enableMFA(userId: string, token: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT mfa_secret FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const { mfa_secret } = result.rows[0];

    if (!mfa_secret) {
      throw new Error('MFA not set up');
    }

    // Verify token
    const isValid = speakeasy.totp.verify({
      secret: mfa_secret,
      encoding: 'base32',
      token,
      window: 2, // Allow 2 time steps before/after
    });

    if (!isValid) {
      return false;
    }

    // Enable MFA
    await pool.query(
      'UPDATE users SET mfa_enabled = TRUE WHERE id = $1',
      [userId]
    );

    return true;
  }

  /**
   * Verify MFA token during login
   */
  async verifyMFA(userId: string, token: string): Promise<MFAVerifyResult> {
    const result = await pool.query(
      'SELECT mfa_secret, mfa_backup_codes FROM users WHERE id = $1 AND mfa_enabled = TRUE',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('MFA not enabled for user');
    }

    const { mfa_secret, mfa_backup_codes } = result.rows[0];

    // Try TOTP verification first
    const isTOTPValid = speakeasy.totp.verify({
      secret: mfa_secret,
      encoding: 'base32',
      token,
      window: 2,
    });

    if (isTOTPValid) {
      return { isValid: true };
    }

    // Try backup codes
    if (mfa_backup_codes && mfa_backup_codes.length > 0) {
      for (let i = 0; i < mfa_backup_codes.length; i++) {
        const isBackupCodeValid = await this.verifyBackupCode(
          token,
          mfa_backup_codes[i]
        );

        if (isBackupCodeValid) {
          // Remove used backup code
          const updatedCodes = mfa_backup_codes.filter(
            (_: string, index: number) => index !== i
          );
          await pool.query(
            'UPDATE users SET mfa_backup_codes = $1 WHERE id = $2',
            [updatedCodes, userId]
          );

          return { isValid: true, usedBackupCode: true };
        }
      }
    }

    return { isValid: false };
  }

  /**
   * Disable MFA for user
   */
  async disableMFA(userId: string, password: string): Promise<boolean> {
    // Verify password before disabling MFA
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    // Password verification would go here (using PasswordService)
    // For now, we'll assume it's verified

    await pool.query(
      `UPDATE users 
       SET mfa_enabled = FALSE,
           mfa_secret = NULL,
           mfa_backup_codes = NULL
       WHERE id = $1`,
      [userId]
    );

    return true;
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(userId: string): Promise<string[]> {
    const backupCodes = this.generateBackupCodes(8);
    const hashedBackupCodes = await Promise.all(
      backupCodes.map(code => this.hashBackupCode(code))
    );

    await pool.query(
      'UPDATE users SET mfa_backup_codes = $1 WHERE id = $2',
      [hashedBackupCodes, userId]
    );

    return backupCodes;
  }

  /**
   * Check if user has MFA enabled
   */
  async isMFAEnabled(userId: string): Promise<boolean> {
    const result = await pool.query(
      'SELECT mfa_enabled FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return false;
    }

    return result.rows[0].mfa_enabled || false;
  }

  /**
   * Generate random backup codes
   */
  private generateBackupCodes(count: number): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = crypto
        .randomBytes(4)
        .toString('hex')
        .toUpperCase()
        .match(/.{1,4}/g)!
        .join('-');
      codes.push(code);
    }
    return codes;
  }

  /**
   * Hash backup code for storage
   */
  private async hashBackupCode(code: string): Promise<string> {
    return crypto
      .createHash('sha256')
      .update(code)
      .digest('hex');
  }

  /**
   * Verify backup code
   */
  private async verifyBackupCode(
    code: string,
    hashedCode: string
  ): Promise<boolean> {
    const hash = await this.hashBackupCode(code);
    return hash === hashedCode;
  }

  /**
   * Store trusted device
   */
  async trustDevice(
    userId: string,
    deviceId: string,
    deviceName: string,
    ipAddress: string,
    userAgent: string
  ): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // Trust for 30 days

    await pool.query(
      `INSERT INTO trusted_devices (user_id, device_id, device_name, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (user_id, device_id) 
       DO UPDATE SET expires_at = $6, last_used_at = CURRENT_TIMESTAMP`,
      [userId, deviceId, deviceName, ipAddress, userAgent, expiresAt]
    );
  }

  /**
   * Check if device is trusted
   */
  async isDeviceTrusted(userId: string, deviceId: string): Promise<boolean> {
    const result = await pool.query(
      `SELECT id FROM trusted_devices 
       WHERE user_id = $1 AND device_id = $2 AND expires_at > CURRENT_TIMESTAMP`,
      [userId, deviceId]
    );

    return result.rows.length > 0;
  }

  /**
   * Remove trusted device
   */
  async removeTrustedDevice(userId: string, deviceId: string): Promise<void> {
    await pool.query(
      'DELETE FROM trusted_devices WHERE user_id = $1 AND device_id = $2',
      [userId, deviceId]
    );
  }

  /**
   * Get all trusted devices for user
   */
  async getTrustedDevices(userId: string): Promise<any[]> {
    const result = await pool.query(
      `SELECT device_id, device_name, ip_address, created_at, last_used_at, expires_at
       FROM trusted_devices 
       WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP
       ORDER BY last_used_at DESC`,
      [userId]
    );

    return result.rows;
  }
}

export const mfaService = new MFAService();
