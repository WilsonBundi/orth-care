import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { profileService } from '../services/ProfileService';

export async function getProfile(req: AuthRequest, res: Response) {
  try {
    const profile = await profileService.getProfile(req.userId!);
    res.json(profile);
  } catch (error: any) {
    res.status(404).json({ error: error.message });
  }
}

export async function updateProfile(req: AuthRequest, res: Response) {
  try {
    const updates = req.body;
    const profile = await profileService.updateProfile(
      req.userId!,
      updates,
      req.ip || 'unknown',
      req.get('user-agent') || 'unknown'
    );

    res.json({
      profile,
      message: 'Profile updated successfully'
    });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
}
