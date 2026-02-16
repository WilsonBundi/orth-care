import { Request, Response } from 'express';
import { getFirestore } from '../config/firebase';

export class AdminController {
  /**
   * Get all patients (admin only)
   */
  async getAllPatients(req: Request, res: Response) {
    try {
      const db = getFirestore();
      
      // Try without orderBy first to avoid index issues
      const usersSnapshot = await db.collection('users')
        .where('role', '==', 'patient')
        .get();

      const patients = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        // Remove sensitive data
        delete data.passwordHash;
        return {
          id: doc.id,
          ...data
        };
      });

      // Sort in memory by createdAt
      patients.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      console.log(`Found ${patients.length} patients`);
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
      const db = getFirestore();
      const { id } = req.params;

      const userDoc = await db.collection('users').doc(id).get();

      if (!userDoc.exists) {
        return res.status(404).json({ error: 'Patient not found' });
      }

      const patient = userDoc.data();
      // Remove sensitive data
      delete patient?.passwordHash;

      res.json({ id: userDoc.id, ...patient });
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
      const db = getFirestore();
      
      const usersSnapshot = await db.collection('users').get();

      const users = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        // Remove sensitive data
        delete data.passwordHash;
        return {
          id: doc.id,
          ...data
        };
      });

      // Sort in memory by createdAt
      users.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate?.() || new Date(0);
        const dateB = b.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
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
      const db = getFirestore();
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
      const db = getFirestore();
      
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
