import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { profileService } from '../services/ProfileService';

export async function getDashboard(req: AuthRequest, res: Response) {
  try {
    const profile = await profileService.getProfile(req.userId!);

    res.json({
      welcomeMessage: `Welcome, ${profile.firstName} ${profile.lastName}!`,
      user: {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email
      },
      navigationOptions: [
        { label: 'Profile', path: '/profile' },
        { label: 'Logout', path: '/logout' }
      ]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
