import { Request, Response } from 'express';
import { mfaService } from '../services/MFAService';
import { auditService } from '../services/AuditService';
import { AuditEventType } from '../types/models';

export class MFAController {
  /**
   * Setup MFA for user
   */
  async setupMFA(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const email = (req as any).user.email;

      const result = await mfaService.setupMFA(userId, email);

      await auditService.logEvent({
        userId,
        eventType: AuditEventType.MFA_SETUP,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || '',
        outcome: 'success',
      });

      res.json({
        secret: result.secret,
        qrCodeUrl: result.qrCodeUrl,
        backupCodes: result.backupCodes,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Enable MFA after verification
   */
  async enableMFA(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      const isValid = await mfaService.enableMFA(userId, token);

      if (!isValid) {
        return res.status(400).json({ error: 'Invalid token' });
      }

      await auditService.logEvent({
        userId,
        eventType: AuditEventType.MFA_ENABLED,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || '',
        outcome: 'success',
      });

      res.json({ message: 'MFA enabled successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Verify MFA token during login
   */
  async verifyMFA(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: 'Token is required' });
      }

      const result = await mfaService.verifyMFA(userId, token);

      if (!result.isValid) {
        await auditService.logEvent({
          userId,
          eventType: AuditEventType.MFA_VERIFICATION_FAILURE,
          ipAddress: req.ip,
          userAgent: req.get('user-agent') || '',
          outcome: 'failure',
        });

        return res.status(400).json({ error: 'Invalid token' });
      }

      await auditService.logEvent({
        userId,
        eventType: AuditEventType.MFA_VERIFICATION_SUCCESS,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || '',
        outcome: 'success',
        details: { usedBackupCode: result.usedBackupCode },
      });

      res.json({ 
        message: 'MFA verified successfully',
        usedBackupCode: result.usedBackupCode,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Disable MFA
   */
  async disableMFA(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({ error: 'Password is required' });
      }

      await mfaService.disableMFA(userId, password);

      await auditService.logEvent({
        userId,
        eventType: AuditEventType.MFA_DISABLED,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || '',
        outcome: 'success',
      });

      res.json({ message: 'MFA disabled successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Regenerate backup codes
   */
  async regenerateBackupCodes(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const backupCodes = await mfaService.regenerateBackupCodes(userId);

      await auditService.logEvent({
        userId,
        eventType: AuditEventType.MFA_BACKUP_CODES_REGENERATED,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || '',
        outcome: 'success',
      });

      res.json({ backupCodes });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get trusted devices
   */
  async getTrustedDevices(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;

      const devices = await mfaService.getTrustedDevices(userId);

      res.json({ devices });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Remove trusted device
   */
  async removeTrustedDevice(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { deviceId } = req.params;

      await mfaService.removeTrustedDevice(userId, deviceId);

      await auditService.logEvent({
        userId,
        eventType: AuditEventType.TRUSTED_DEVICE_REMOVED,
        ipAddress: req.ip,
        userAgent: req.get('user-agent') || '',
        outcome: 'success',
        details: { deviceId },
      });

      res.json({ message: 'Device removed successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  }
}

export const mfaController = new MFAController();
