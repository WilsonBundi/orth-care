import { permissionRepository } from '../repositories/PermissionRepository';
import { userRepository } from '../repositories/UserRepository';
import { Permission, Role } from '../types/models';

export class AuthorizationService {
  async hasPermission(userId: string, action: string, resource: string): Promise<boolean> {
    const user = await userRepository.findById(userId);
    if (!user) {
      return false;
    }

    return await permissionRepository.hasPermission(user.role, action, resource);
  }

  async getPermissions(userId: string): Promise<Permission[]> {
    const user = await userRepository.findById(userId);
    if (!user) {
      return [];
    }

    return await permissionRepository.findByRole(user.role);
  }

  async assignRole(userId: string, role: Role): Promise<void> {
    // This would be implemented when we add role management
    throw new Error('Not implemented');
  }
}

export const authorizationService = new AuthorizationService();
