/**
 * Unit tests for validation utilities
 * 
 * Tests email, phone number, and address validation functions
 * with various valid and invalid inputs, edge cases, and error messages.
 */

import {
  validateEmail,
  validatePhoneNumber,
  validateAddress,
  validateContactInfo,
  sanitizeString,
  sanitizeAddress
} from './validation';
import { Address } from './models';

describe('Email Validation', () => {
  describe('Valid emails', () => {
    it('should accept standard email format', () => {
      const result = validateEmail('user@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept email with subdomain', () => {
      const result = validateEmail('user@mail.example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept email with plus sign', () => {
      const result = validateEmail('user+tag@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept email with dots in local part', () => {
      const result = validateEmail('first.last@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept email with numbers', () => {
      const result = validateEmail('user123@example456.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept email with hyphens', () => {
      const result = validateEmail('user-name@example-domain.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept email with underscores', () => {
      const result = validateEmail('user_name@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept email with percentage sign', () => {
      const result = validateEmail('user%name@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should trim whitespace from valid email', () => {
      const result = validateEmail('  user@example.com  ');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('Invalid emails', () => {
    it('should reject empty email', () => {
      const result = validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Email address is required');
    });

    it('should reject whitespace-only email', () => {
      const result = validateEmail('   ');
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Email address is required');
    });

    it('should reject email without @ symbol', () => {
      const result = validateEmail('userexample.com');
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Email address must be in valid format (e.g., user@example.com)');
    });

    it('should reject email without domain', () => {
      const result = validateEmail('user@');
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Email address must be in valid format (e.g., user@example.com)');
    });

    it('should reject email without local part', () => {
      const result = validateEmail('@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Email address must be in valid format (e.g., user@example.com)');
    });

    it('should reject email without TLD', () => {
      const result = validateEmail('user@example');
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Email address must be in valid format (e.g., user@example.com)');
    });

    it('should reject email with multiple @ symbols', () => {
      const result = validateEmail('user@@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Email address must be in valid format (e.g., user@example.com)');
    });

    it('should reject email with consecutive dots', () => {
      const result = validateEmail('user..name@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Email address must not contain consecutive dots');
    });

    it('should reject email starting with dot', () => {
      const result = validateEmail('.user@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Email local part must not start or end with a dot');
    });

    it('should reject email ending with dot in local part', () => {
      const result = validateEmail('user.@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Email local part must not start or end with a dot');
    });

    it('should reject email with spaces', () => {
      const result = validateEmail('user name@example.com');
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Email address must be in valid format (e.g., user@example.com)');
    });

    it('should reject email exceeding 320 characters', () => {
      const longEmail = 'a'.repeat(310) + '@example.com';
      const result = validateEmail(longEmail);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Email address must not exceed 320 characters');
    });

    it('should reject email with local part exceeding 64 characters', () => {
      const longLocal = 'a'.repeat(65) + '@example.com';
      const result = validateEmail(longLocal);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Email local part (before @) must not exceed 64 characters');
    });

    it('should reject email with domain exceeding 255 characters', () => {
      const longDomain = 'user@' + 'a'.repeat(250) + '.com';
      const result = validateEmail(longDomain);
      expect(result.isValid).toBe(false);
      expect(result.errors.email).toBe('Email domain part (after @) must not exceed 255 characters');
    });
  });
});

describe('Phone Number Validation', () => {
  describe('Valid phone numbers', () => {
    it('should accept US format with parentheses', () => {
      const result = validatePhoneNumber('(123) 456-7890');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept US format with hyphens', () => {
      const result = validatePhoneNumber('123-456-7890');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept US format with dots', () => {
      const result = validatePhoneNumber('123.456.7890');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept US format without formatting', () => {
      const result = validatePhoneNumber('1234567890');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept international format with country code', () => {
      const result = validatePhoneNumber('+1 123 456 7890');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept UK format', () => {
      const result = validatePhoneNumber('+44 20 1234 5678');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept phone with extension (ext.)', () => {
      const result = validatePhoneNumber('123-456-7890 ext. 123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept phone with extension (ext)', () => {
      const result = validatePhoneNumber('123-456-7890 ext 123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept phone with extension (x)', () => {
      const result = validatePhoneNumber('123-456-7890 x123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should trim whitespace from valid phone', () => {
      const result = validatePhoneNumber('  123-456-7890  ');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept 11-digit number with country code', () => {
      const result = validatePhoneNumber('11234567890');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('Invalid phone numbers', () => {
    it('should reject empty phone number', () => {
      const result = validatePhoneNumber('');
      expect(result.isValid).toBe(false);
      expect(result.errors.phoneNumber).toBe('Phone number is required');
    });

    it('should reject whitespace-only phone number', () => {
      const result = validatePhoneNumber('   ');
      expect(result.isValid).toBe(false);
      expect(result.errors.phoneNumber).toBe('Phone number is required');
    });

    it('should reject phone with less than 10 digits', () => {
      const result = validatePhoneNumber('123-456-789');
      expect(result.isValid).toBe(false);
      expect(result.errors.phoneNumber).toBe('Phone number must contain at least 10 digits');
    });

    it('should reject phone with more than 15 digits', () => {
      const result = validatePhoneNumber('1234567890123456');
      expect(result.isValid).toBe(false);
      expect(result.errors.phoneNumber).toBe('Phone number must not exceed 15 digits');
    });

    it('should reject phone exceeding 30 characters', () => {
      const longPhone = '1'.repeat(31);
      const result = validatePhoneNumber(longPhone);
      expect(result.isValid).toBe(false);
      expect(result.errors.phoneNumber).toBe('Phone number must not exceed 30 characters');
    });

    it('should reject phone with letters', () => {
      const result = validatePhoneNumber('123-ABC-7890');
      expect(result.isValid).toBe(false);
      expect(result.errors.phoneNumber).toBe('Phone number must be in valid format (e.g., (123) 456-7890, 123-456-7890, +1 123 456 7890)');
    });

    it('should reject phone with special characters', () => {
      const result = validatePhoneNumber('123-456-7890!');
      expect(result.isValid).toBe(false);
      expect(result.errors.phoneNumber).toBe('Phone number must be in valid format (e.g., (123) 456-7890, 123-456-7890, +1 123 456 7890)');
    });

    it('should reject phone with only 5 digits', () => {
      const result = validatePhoneNumber('12345');
      expect(result.isValid).toBe(false);
      expect(result.errors.phoneNumber).toBe('Phone number must contain at least 10 digits');
    });
  });
});

describe('Address Validation', () => {
  const validAddress: Address = {
    street: '123 Main Street',
    city: 'Boston',
    state: 'MA',
    zipCode: '02101',
    country: 'USA'
  };

  describe('Valid addresses', () => {
    it('should accept complete valid address', () => {
      const result = validateAddress(validAddress);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept address with apartment number', () => {
      const address: Address = {
        ...validAddress,
        street: '123 Main Street Apt 4B'
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept city with spaces', () => {
      const address: Address = {
        ...validAddress,
        city: 'New York'
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept city with hyphens', () => {
      const address: Address = {
        ...validAddress,
        city: 'Winston-Salem'
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept city with apostrophes', () => {
      const address: Address = {
        ...validAddress,
        city: "O'Fallon"
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept state with full name', () => {
      const address: Address = {
        ...validAddress,
        state: 'Massachusetts'
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept zip code with hyphen (ZIP+4)', () => {
      const address: Address = {
        ...validAddress,
        zipCode: '02101-1234'
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept Canadian postal code', () => {
      const address: Address = {
        ...validAddress,
        zipCode: 'A1A 1A1'
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should accept country with full name', () => {
      const address: Address = {
        ...validAddress,
        country: 'United States'
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });
  });

  describe('Invalid addresses', () => {
    it('should reject null address', () => {
      const result = validateAddress(null);
      expect(result.isValid).toBe(false);
      expect(result.errors.address).toBe('Address is required');
    });

    it('should reject undefined address', () => {
      const result = validateAddress(undefined);
      expect(result.isValid).toBe(false);
      expect(result.errors.address).toBe('Address is required');
    });

    it('should reject empty street', () => {
      const address: Address = {
        ...validAddress,
        street: ''
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors['address.street']).toBe('Street address is required');
    });

    it('should reject whitespace-only street', () => {
      const address: Address = {
        ...validAddress,
        street: '   '
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors['address.street']).toBe('Street address is required');
    });

    it('should reject street exceeding 255 characters', () => {
      const address: Address = {
        ...validAddress,
        street: 'a'.repeat(256)
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors['address.street']).toBe('Street address must not exceed 255 characters');
    });

    it('should reject empty city', () => {
      const address: Address = {
        ...validAddress,
        city: ''
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors['address.city']).toBe('City is required');
    });

    it('should reject city exceeding 100 characters', () => {
      const address: Address = {
        ...validAddress,
        city: 'a'.repeat(101)
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors['address.city']).toBe('City must not exceed 100 characters');
    });

    it('should reject city with numbers', () => {
      const address: Address = {
        ...validAddress,
        city: 'Boston123'
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors['address.city']).toBe('City must contain only letters, spaces, hyphens, apostrophes, and periods');
    });

    it('should reject city with special characters', () => {
      const address: Address = {
        ...validAddress,
        city: 'Boston@City'
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors['address.city']).toBe('City must contain only letters, spaces, hyphens, apostrophes, and periods');
    });

    it('should reject empty state', () => {
      const address: Address = {
        ...validAddress,
        state: ''
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors['address.state']).toBe('State/Province is required');
    });

    it('should reject state with less than 2 characters', () => {
      const address: Address = {
        ...validAddress,
        state: 'M'
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors['address.state']).toBe('State/Province must be at least 2 characters');
    });

    it('should reject state exceeding 50 characters', () => {
      const address: Address = {
        ...validAddress,
        state: 'a'.repeat(51)
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors['address.state']).toBe('State/Province must not exceed 50 characters');
    });

    it('should reject state with numbers', () => {
      const address: Address = {
        ...validAddress,
        state: 'MA123'
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors['address.state']).toBe('State/Province must contain only letters, spaces, and hyphens');
    });

    it('should reject empty zip code', () => {
      const address: Address = {
        ...validAddress,
        zipCode: ''
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors['address.zipCode']).toBe('Zip/Postal code is required');
    });

    it('should reject zip code with less than 5 characters', () => {
      const address: Address = {
        ...validAddress,
        zipCode: '1234'
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors['address.zipCode']).toBe('Zip/Postal code must be at least 5 characters');
    });

    it('should reject zip code exceeding 10 characters', () => {
      const address: Address = {
        ...validAddress,
        zipCode: '12345678901'
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors['address.zipCode']).toBe('Zip/Postal code must not exceed 10 characters');
    });

    it('should reject zip code with special characters', () => {
      const address: Address = {
        ...validAddress,
        zipCode: '12345@'
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors['address.zipCode']).toBe('Zip/Postal code must contain only letters, numbers, spaces, and hyphens');
    });

    it('should reject empty country', () => {
      const address: Address = {
        ...validAddress,
        country: ''
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors['address.country']).toBe('Country is required');
    });

    it('should reject country with less than 2 characters', () => {
      const address: Address = {
        ...validAddress,
        country: 'U'
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors['address.country']).toBe('Country must be at least 2 characters');
    });

    it('should reject country exceeding 100 characters', () => {
      const address: Address = {
        ...validAddress,
        country: 'a'.repeat(101)
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors['address.country']).toBe('Country must not exceed 100 characters');
    });

    it('should reject country with numbers', () => {
      const address: Address = {
        ...validAddress,
        country: 'USA123'
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(result.errors['address.country']).toBe('Country must contain only letters, spaces, and hyphens');
    });

    it('should return multiple errors for multiple invalid fields', () => {
      const address: Address = {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      };
      const result = validateAddress(address);
      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBe(5);
      expect(result.errors['address.street']).toBeDefined();
      expect(result.errors['address.city']).toBeDefined();
      expect(result.errors['address.state']).toBeDefined();
      expect(result.errors['address.zipCode']).toBeDefined();
      expect(result.errors['address.country']).toBeDefined();
    });
  });
});

describe('Combined Contact Info Validation', () => {
  const validAddress: Address = {
    street: '123 Main Street',
    city: 'Boston',
    state: 'MA',
    zipCode: '02101',
    country: 'USA'
  };

  it('should accept all valid contact information', () => {
    const result = validateContactInfo(
      'user@example.com',
      '123-456-7890',
      validAddress
    );
    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('should return combined errors for all invalid fields', () => {
    const result = validateContactInfo(
      'invalid-email',
      '123',
      null
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBeDefined();
    expect(result.errors.phoneNumber).toBeDefined();
    expect(result.errors.address).toBeDefined();
  });

  it('should return only email error when email is invalid', () => {
    const result = validateContactInfo(
      'invalid-email',
      '123-456-7890',
      validAddress
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBeDefined();
    expect(result.errors.phoneNumber).toBeUndefined();
    expect(result.errors.address).toBeUndefined();
  });

  it('should return only phone error when phone is invalid', () => {
    const result = validateContactInfo(
      'user@example.com',
      '123',
      validAddress
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBeUndefined();
    expect(result.errors.phoneNumber).toBeDefined();
    expect(result.errors.address).toBeUndefined();
  });

  it('should return only address errors when address is invalid', () => {
    const invalidAddress: Address = {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    };
    const result = validateContactInfo(
      'user@example.com',
      '123-456-7890',
      invalidAddress
    );
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBeUndefined();
    expect(result.errors.phoneNumber).toBeUndefined();
    expect(result.errors['address.street']).toBeDefined();
  });
});

describe('Sanitization Utilities', () => {
  describe('sanitizeString', () => {
    it('should trim whitespace from string', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
    });

    it('should return empty string for null', () => {
      expect(sanitizeString(null)).toBe('');
    });

    it('should return empty string for undefined', () => {
      expect(sanitizeString(undefined)).toBe('');
    });

    it('should return empty string for empty string', () => {
      expect(sanitizeString('')).toBe('');
    });

    it('should preserve internal whitespace', () => {
      expect(sanitizeString('  hello world  ')).toBe('hello world');
    });
  });

  describe('sanitizeAddress', () => {
    it('should trim all address fields', () => {
      const address: Address = {
        street: '  123 Main St  ',
        city: '  Boston  ',
        state: '  MA  ',
        zipCode: '  02101  ',
        country: '  USA  '
      };
      const sanitized = sanitizeAddress(address);
      expect(sanitized).toEqual({
        street: '123 Main St',
        city: 'Boston',
        state: 'MA',
        zipCode: '02101',
        country: 'USA'
      });
    });

    it('should return null for null address', () => {
      expect(sanitizeAddress(null)).toBeNull();
    });

    it('should return null for undefined address', () => {
      expect(sanitizeAddress(undefined)).toBeNull();
    });

    it('should handle address with empty strings', () => {
      const address: Address = {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      };
      const sanitized = sanitizeAddress(address);
      expect(sanitized).toEqual({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: ''
      });
    });
  });
});
