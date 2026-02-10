/**
 * Password Service
 * 
 * Handles password hashing, validation, and changes.
 * Implements secure password management using bcrypt with work factor 12.
 * 
 * Requirements:
 * - 1.2: Hash passwords using cryptographically secure algorithm
 * - 1.4: Validate password meets minimum security requirements
 * - 5.2: Validate new password strength
 * - 5.3: Hash new password before storage
 */

import bcrypt from 'bcrypt';
import { ValidationResult } from '../types/models';

/**
 * Work factor for bcrypt hashing
 * Higher values increase security but also increase computation time
 * 12 is recommended for 2024 hardware
 */
const BCRYPT_WORK_FACTOR = 12;

/**
 * Password strength requirements
 */
const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber: true,
  requireSpecialChar: true
};

/**
 * Regular expressions for password validation
 */
const PASSWORD_PATTERNS = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  number: /[0-9]/,
  specialChar: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/
};

export class PasswordService {
  /**
   * Hash a password using bcrypt with work factor 12
   * 
   * @param password - The plaintext password to hash
   * @returns Promise resolving to the bcrypt hash
   * 
   * Requirements: 1.2, 5.3
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_WORK_FACTOR);
  }

  /**
   * Verify a password against a hash
   * 
   * @param password - The plaintext password to verify
   * @param hash - The bcrypt hash to compare against
   * @returns Promise resolving to true if password matches, false otherwise
   * 
   * Requirements: 1.2, 2.1
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Validate password meets security requirements
   * 
   * Requirements:
   * - Minimum 8 characters
   * - At least one uppercase letter
   * - At least one lowercase letter
   * - At least one number
   * - At least one special character
   * 
   * @param password - The password to validate
   * @returns ValidationResult with isValid flag and error messages
   * 
   * Requirements: 1.4, 5.2
   */
  validatePasswordStrength(password: string): ValidationResult {
    const errors: Record<string, string> = {};

    // Check minimum length
    if (password.length < PASSWORD_REQUIREMENTS.minLength) {
      errors['password'] = `Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters long`;
    }

    // Check for uppercase letter
    if (PASSWORD_REQUIREMENTS.requireUppercase && !PASSWORD_PATTERNS.uppercase.test(password)) {
      errors['password'] = errors['password'] 
        ? `${errors['password']}. Must contain at least one uppercase letter`
        : 'Password must contain at least one uppercase letter';
    }

    // Check for lowercase letter
    if (PASSWORD_REQUIREMENTS.requireLowercase && !PASSWORD_PATTERNS.lowercase.test(password)) {
      errors['password'] = errors['password']
        ? `${errors['password']}. Must contain at least one lowercase letter`
        : 'Password must contain at least one lowercase letter';
    }

    // Check for number
    if (PASSWORD_REQUIREMENTS.requireNumber && !PASSWORD_PATTERNS.number.test(password)) {
      errors['password'] = errors['password']
        ? `${errors['password']}. Must contain at least one number`
        : 'Password must contain at least one number';
    }

    // Check for special character
    if (PASSWORD_REQUIREMENTS.requireSpecialChar && !PASSWORD_PATTERNS.specialChar.test(password)) {
      errors['password'] = errors['password']
        ? `${errors['password']}. Must contain at least one special character`
        : 'Password must contain at least one special character';
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}
