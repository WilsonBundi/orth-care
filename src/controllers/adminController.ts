import { Request, Response } from 'express';
import { db } from '../config/firebase';

export class AdminController {
  /**
   * Get all patients (admin only)
   */
  async getAllPatients(req: Request, res: Response) {
    try {
      const usersSnapshot = await db.collection('users')
        .where('role', '==', 'patient')
        .orderBy('createdAt', 'desc')
        .get();

      const patients = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        // Remove sensitive data
        delete data.passwordHash;
        return data;
      });

      res.json(patients);
    } catch (error: any) {
      console.error('Error fetching patients:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get single patient details (admin only)
   */
  async getPatientById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const userDoc = await db.collection('users').doc(id).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const patient = userDoc.data();
      // Remove sensitive data
      delete patient?.passwordHash;

      res.json(patient);
    } catch (error: any) {
      console.error('Error fetching patient:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(req: Request, res: Response) {
    try {
      const usersSnapshot = await db.collection('users')
        .orderBy('createdAt', 'desc')
        .get();

      const users = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        // Remove sensitive data
        delete data.passwordHash;
        return data;
      });

      res.json(users);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Update user role (super admin only)
   */
  async updateUserRole(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { role } = req.body;

      if (!role) {
        return res.status(400).json({ error: 'Role is required' });
      }

      await db.collection('users').doc(id).update({
        role,
        updatedAt: new Date()
      });

      res.json({ message: 'User role updated successfully' });
    } catch (error: any) {
      console.error('Error updating user role:', error);
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * Get system statistics (admin only)
   */
  async getSystemStats(req: Request, res: Response) {
    try {
      const usersSnapshot = await db.collection('users').get();
      const appointmentsSnapshot = await db.collection('appointments').get();

      const totalUsers = usersSnapshot.size;
      const totalPatients = usersSnapshot.docs.filter(doc => doc.data().role === 'patient').length;
      const totalAppointments = appointmentsSnapshot.size;

      // Count new users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const newUsersToday = usersSnapshot.docs.filter(doc => {
        const createdAt = doc.data().createdAt?.toDate();
        return createdAt && createdAt >= today;
      }).length;

      res.json({
        totalUsers,
        totalPatients,
        totalAppointments,
        newUsersToday
      });
    } catch (error: any) {
      console.error('Error fetching system stats:', error);
      res.status(500).json({ error: error.message });
    }
  }
}

export const adminController = new AdminController();
