import { userRepository } from '../repositories';
import { auditService } from './AuditService';
import { PatientProfile, ProfileUpdateRequest, AuditEventType, Address } from '../types/models';
import { validateEmail, validatePhoneNumber, validateAddress } from '../types/validation';

export class ProfileService {
  async getProfile(userId: string): Promise<PatientProfile> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      dateOfBirth: user.dateOfBirth,
      phoneNumber: user.phoneNumber,
      address: user.address,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  async updateProfile(
    userId: string,
    updates: ProfileUpdateRequest,
    ipAddress: string,
    userAgent: string
  ): Promise<PatientProfile> {
    // Validate updates
    const errors: Record<string, string> = {};

    if (updates.email) {
      const emailValidation = validateEmail(updates.email);
      if (!emailValidation.isValid) {
        Object.assign(errors, emailValidation.errors);
      }
    }

    if (updates.phoneNumber) {
      const phoneValidation = validatePhoneNumber(updates.phoneNumber);
      if (!phoneValidation.isValid) {
        Object.assign(errors, phoneValidation.errors);
      }
    }

    if (updates.address) {
      const addressValidation = validateAddress(updates.address);
      if (!addressValidation.isValid) {
        Object.assign(errors, addressValidation.errors);
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new Error(JSON.stringify(errors));
    }

    // Update user
    const updatedUser = await userRepository.update(userId, updates);

    // Log audit event
    await auditService.logEvent({
      userId,
      eventType: AuditEventType.PROFILE_UPDATED,
      ipAddress,
      userAgent,
      outcome: 'success',
      details: { changedFields: Object.keys(updates) }
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      dateOfBirth: updatedUser.dateOfBirth,
      phoneNumber: updatedUser.phoneNumber,
      address: updatedUser.address,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt
    };
  }
}

export const profileService = new ProfileService();
