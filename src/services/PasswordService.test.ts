/**
 * Unit tests for PasswordService
 * 
 * Tests password hashing, verification, and validation functionality
 */

import { PasswordService } from './PasswordService';

describe('PasswordService', () => {
  let passwordService: PasswordService;

  beforeEach(() => {
    passwordService = new PasswordService();
  });

  describe('hashPassword', () => {
    it('should hash a password and return a bcrypt hash', async () => {
      const password = 'TestPassword123!';
      const hash = await passwordService.hashPassword(password);

      // Bcrypt hashes start with $2b$ (or $2a$) and are 60 characters long
      expect(hash).toMatch(/^\$2[ab]\$/);
      expect(hash.length).toBe(60);
      expect(hash).not.toBe(password);
    });

    it('should generate different hashes for the same password (salt)', async () => {
      const password = 'TestPassword123!';
      const hash1 = await passwordService.hashPassword(password);
      const hash2 = await passwordService.hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      const password = '';
      const hash = await passwordService.hashPassword(password);

      expect(hash).toMatch(/^\$2[ab]\$/);
      expect(hash.length).toBe(60);
    });

    it('should handle very long passwords', async () => {
      const password = 'A'.repeat(100) + 'a1!';
      const hash = await passwordService.hashPassword(password);

      expect(hash).toMatch(/^\$2[ab]\$/);
      expect(hash.length).toBe(60);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await passwordService.hashPassword(password);

      const isValid = await passwordService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'TestPassword123!';
      const hash = await passwordService.hashPassword(password);

      const isValid = await passwordService.verifyPassword('WrongPassword123!', hash);
      expect(isValid).toBe(false);
    });

    it('should return false for empty password against valid hash', async () => {
      const password = 'TestPassword123!';
      const hash = await passwordService.hashPassword(password);

      const isValid = await passwordService.verifyPassword('', hash);
      expect(isValid).toBe(false);
    });

    it('should handle case-sensitive password verification', async () => {
      const password = 'TestPassword123!';
      const hash = await passwordService.hashPassword(password);

      const isValid = await passwordService.verifyPassword('testpassword123!', hash);
      expect(isValid).toBe(false);
    });

    it('should verify password with special characters', async () => {
      const password = 'P@ssw0rd!#$%^&*()';
      const hash = await passwordService.hashPassword(password);

      const isValid = await passwordService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });
  });

  describe('validatePasswordStrength', () => {
    describe('valid passwords', () => {
      it('should accept password with all requirements met', () => {
        const result = passwordService.validatePasswordStrength('TestPass123!');

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
      });

      it('should accept password with minimum length and all character types', () => {
        const result = passwordService.validatePasswordStrength('Abcd123!');

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
      });

      it('should accept password with multiple special characters', () => {
        const result = passwordService.validatePasswordStrength('Test@Pass#123!');

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
      });

      it('should accept very long password with all requirements', () => {
        const result = passwordService.validatePasswordStrength('ThisIsAVeryLongPassword123!WithManyCharacters');

        expect(result.isValid).toBe(true);
        expect(result.errors).toEqual({});
      });
    });

    describe('invalid passwords - length', () => {
      it('should reject password shorter than 8 characters', () => {
        const result = passwordService.validatePasswordStrength('Test1!');

        expect(result.isValid).toBe(false);
        expect(result.errors.password).toContain('at least 8 characters');
      });

      it('should reject empty password', () => {
        const result = passwordService.validatePasswordStrength('');

        expect(result.isValid).toBe(false);
        expect(result.errors.password).toContain('at least 8 characters');
      });

      it('should reject password with exactly 7 characters', () => {
        const result = passwordService.validatePasswordStrength('Test12!');

        expect(result.isValid).toBe(false);
        expect(result.errors.password).toContain('at least 8 characters');
      });
    });

    describe('invalid passwords - missing uppercase', () => {
      it('should reject password without uppercase letter', () => {
        const result = passwordService.validatePasswordStrength('testpass123!');

        expect(result.isValid).toBe(false);
        expect(result.errors.password).toContain('uppercase letter');
      });

      it('should reject password with only lowercase, numbers, and special chars', () => {
        const result = passwordService.validatePasswordStrength('password123!@#');

        expect(result.isValid).toBe(false);
        expect(result.errors.password).toContain('uppercase letter');
      });
    });

    describe('invalid passwords - missing lowercase', () => {
      it('should reject password without lowercase letter', () => {
        const result = passwordService.validatePasswordStrength('TESTPASS123!');

        expect(result.isValid).toBe(false);
        expect(result.errors.password).toContain('lowercase letter');
      });

      it('should reject password with only uppercase, numbers, and special chars', () => {
        const result = passwordService.validatePasswordStrength('PASSWORD123!@#');

        expect(result.isValid).toBe(false);
        expect(result.errors.password).toContain('lowercase letter');
      });
    });

    describe('invalid passwords - missing number', () => {
      it('should reject password without number', () => {
        const result = passwordService.validatePasswordStrength('TestPassword!');

        expect(result.isValid).toBe(false);
        expect(result.errors.password).toContain('number');
      });

      it('should reject password with only letters and special chars', () => {
        const result = passwordService.validatePasswordStrength('TestPassword!@#');

        expect(result.isValid).toBe(false);
        expect(result.errors.password).toContain('number');
      });
    });

    describe('invalid passwords - missing special character', () => {
      it('should reject password without special character', () => {
        const result = passwordService.validatePasswordStrength('TestPass123');

        expect(result.isValid).toBe(false);
        expect(result.errors.password).toContain('special character');
      });

      it('should reject password with only letters and numbers', () => {
        const result = passwordService.validatePasswordStrength('TestPassword123');

        expect(result.isValid).toBe(false);
        expect(result.errors.password).toContain('special character');
      });
    });

    describe('invalid passwords - multiple violations', () => {
      it('should report all violations when multiple requirements are not met', () => {
        const result = passwordService.validatePasswordStrength('test');

        expect(result.isValid).toBe(false);
        expect(result.errors.password).toContain('at least 8 characters');
        expect(result.errors.password).toContain('uppercase letter');
        expect(result.errors.password).toContain('number');
        expect(result.errors.password).toContain('special character');
      });

      it('should report missing uppercase and number', () => {
        const result = passwordService.validatePasswordStrength('testpass!');

        expect(result.isValid).toBe(false);
        expect(result.errors.password).toContain('uppercase letter');
        expect(result.errors.password).toContain('number');
      });

      it('should report missing lowercase and special character', () => {
        const result = passwordService.validatePasswordStrength('TESTPASS123');

        expect(result.isValid).toBe(false);
        expect(result.errors.password).toContain('lowercase letter');
        expect(result.errors.password).toContain('special character');
      });
    });

    describe('edge cases', () => {
      it('should accept password with various special characters', () => {
        const specialChars = '!@#$%^&*()_+-=[]{};\':"|,.<>/?';
        for (const char of specialChars) {
          const result = passwordService.validatePasswordStrength(`Test123${char}`);
          expect(result.isValid).toBe(true);
        }
      });

      it('should reject password with only spaces', () => {
        const result = passwordService.validatePasswordStrength('        ');

        expect(result.isValid).toBe(false);
        expect(result.errors.password).toContain('uppercase letter');
        expect(result.errors.password).toContain('lowercase letter');
        expect(result.errors.password).toContain('number');
        expect(result.errors.password).toContain('special character');
      });

      it('should handle password with unicode characters', () => {
        const result = passwordService.validatePasswordStrength('Test123!café');

        expect(result.isValid).toBe(true);
      });

      it('should handle password with emojis', () => {
        const result = passwordService.validatePasswordStrength('Test123!😀');

        expect(result.isValid).toBe(true);
      });
    });
  });

  describe('integration - hash and verify workflow', () => {
    it('should successfully hash and verify a valid password', async () => {
      const password = 'ValidPass123!';
      
      // Validate password strength
      const validation = passwordService.validatePasswordStrength(password);
      expect(validation.isValid).toBe(true);

      // Hash the password
      const hash = await passwordService.hashPassword(password);
      expect(hash).not.toBe(password);

      // Verify the password
      const isValid = await passwordService.verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject weak password before hashing', async () => {
      const weakPassword = 'weak';
      
      // Validate password strength
      const validation = passwordService.validatePasswordStrength(weakPassword);
      expect(validation.isValid).toBe(false);
      expect(validation.errors.password).toBeDefined();
    });

    it('should handle password change scenario', async () => {
      const oldPassword = 'OldPass123!';
      const newPassword = 'NewPass456@';

      // Hash old password
      const oldHash = await passwordService.hashPassword(oldPassword);

      // Verify old password works
      const oldValid = await passwordService.verifyPassword(oldPassword, oldHash);
      expect(oldValid).toBe(true);

      // Validate new password
      const validation = passwordService.validatePasswordStrength(newPassword);
      expect(validation.isValid).toBe(true);

      // Hash new password
      const newHash = await passwordService.hashPassword(newPassword);

      // Verify new password works with new hash
      const newValid = await passwordService.verifyPassword(newPassword, newHash);
      expect(newValid).toBe(true);

      // Verify old password doesn't work with new hash
      const oldWithNewHash = await passwordService.verifyPassword(oldPassword, newHash);
      expect(oldWithNewHash).toBe(false);

      // Verify new password doesn't work with old hash
      const newWithOldHash = await passwordService.verifyPassword(newPassword, oldHash);
      expect(newWithOldHash).toBe(false);
    });
  });
});
