/**
 * Validation utilities for data models
 * 
 * This file provides validation functions for email, phone numbers, and addresses
 * with comprehensive error messages to help users correct their input.
 */

import { Address, ValidationResult } from './models';

// ============================================================================
// Email Validation
// ============================================================================

/**
 * Validates email format according to RFC 5322 simplified pattern
 * 
 * Requirements:
 * - Must contain exactly one @ symbol
 * - Local part (before @) must be 1-64 characters
 * - Domain part (after @) must be 1-255 characters
 * - Must contain at least one dot in domain
 * - Valid characters: alphanumeric, dots, hyphens, underscores, plus signs
 * 
 * @param email - The email address to validate
 * @returns ValidationResult with isValid flag and error message if invalid
 */
export function validateEmail(email: string): ValidationResult {
  const errors: Record<string, string> = {};

  // Check if email is provided
  if (!email || email.trim().length === 0) {
    errors.email = 'Email address is required';
    return { isValid: false, errors };
  }

  // Trim whitespace
  email = email.trim();

  // Check length constraints
  if (email.length > 320) {
    errors.email = 'Email address must not exceed 320 characters';
    return { isValid: false, errors };
  }

  // RFC 5322 simplified email regex pattern
  // This pattern validates:
  // - Local part: alphanumeric, dots, hyphens, underscores, plus signs (1-64 chars)
  // - @ symbol (exactly one)
  // - Domain: alphanumeric, dots, hyphens (1-255 chars, must contain at least one dot)
  const emailRegex = /^[a-zA-Z0-9._+%-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(email)) {
    errors.email = 'Email address must be in valid format (e.g., user@example.com)';
    return { isValid: false, errors };
  }

  // Split email into local and domain parts
  const [localPart, domainPart] = email.split('@');

  // Validate local part length (before @)
  if (localPart.length > 64) {
    errors.email = 'Email local part (before @) must not exceed 64 characters';
    return { isValid: false, errors };
  }

  // Validate domain part length (after @)
  if (domainPart.length > 255) {
    errors.email = 'Email domain part (after @) must not exceed 255 characters';
    return { isValid: false, errors };
  }

  // Check for consecutive dots
  if (email.includes('..')) {
    errors.email = 'Email address must not contain consecutive dots';
    return { isValid: false, errors };
  }

  // Check for leading/trailing dots in local part
  if (localPart.startsWith('.') || localPart.endsWith('.')) {
    errors.email = 'Email local part must not start or end with a dot';
    return { isValid: false, errors };
  }

  return { isValid: true, errors: {} };
}

// ============================================================================
// Phone Number Validation
// ============================================================================

/**
 * Validates phone number format
 * 
 * Supports multiple formats:
 * - US format: (123) 456-7890, 123-456-7890, 1234567890
 * - International format: +1 123 456 7890, +44 20 1234 5678
 * - Extensions: 123-456-7890 ext. 123, 123-456-7890 x123
 * 
 * Requirements:
 * - Must contain 10-15 digits (excluding country code prefix)
 * - May include country code with + prefix
 * - May include formatting characters: spaces, hyphens, parentheses, dots
 * - May include extension with 'ext', 'ext.', or 'x' prefix
 * 
 * @param phoneNumber - The phone number to validate
 * @returns ValidationResult with isValid flag and error message if invalid
 */
export function validatePhoneNumber(phoneNumber: string): ValidationResult {
  const errors: Record<string, string> = {};

  // Check if phone number is provided
  if (!phoneNumber || phoneNumber.trim().length === 0) {
    errors.phoneNumber = 'Phone number is required';
    return { isValid: false, errors };
  }

  // Trim whitespace
  phoneNumber = phoneNumber.trim();

  // Check maximum length (reasonable upper bound with formatting)
  if (phoneNumber.length > 30) {
    errors.phoneNumber = 'Phone number must not exceed 30 characters';
    return { isValid: false, errors };
  }

  // Extract digits only (excluding extension)
  // First, remove extension if present
  const extensionPattern = /\s*(ext\.?|x)\s*\d+$/i;
  const phoneWithoutExt = phoneNumber.replace(extensionPattern, '');

  // Extract all digits from the phone number
  const digits = phoneWithoutExt.replace(/\D/g, '');

  // Check if we have a reasonable number of digits
  if (digits.length < 10) {
    errors.phoneNumber = 'Phone number must contain at least 10 digits';
    return { isValid: false, errors };
  }

  if (digits.length > 15) {
    errors.phoneNumber = 'Phone number must not exceed 15 digits';
    return { isValid: false, errors };
  }

  // Comprehensive phone number regex pattern
  // Supports:
  // - Optional country code: +1, +44, etc.
  // - Various formats: (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890
  // - Optional extension: ext. 123, ext 123, x123
  const phoneRegex = /^(\+\d{1,3}\s?)?(\(?\d{3}\)?[\s.-]?)?\d{3}[\s.-]?\d{4}(\s*(ext\.?|x)\s*\d+)?$/i;

  if (!phoneRegex.test(phoneNumber)) {
    errors.phoneNumber = 'Phone number must be in valid format (e.g., (123) 456-7890, 123-456-7890, +1 123 456 7890)';
    return { isValid: false, errors };
  }

  return { isValid: true, errors: {} };
}

// ============================================================================
// Address Validation
// ============================================================================

/**
 * Validates a complete address object
 * 
 * Requirements:
 * - All fields are required (street, city, state, zipCode, country)
 * - Street: 1-255 characters
 * - City: 1-100 characters, letters, spaces, hyphens, apostrophes
 * - State: 2-50 characters, letters, spaces, hyphens
 * - Zip Code: 5-10 characters, supports US (12345, 12345-6789) and international formats
 * - Country: 2-100 characters, letters, spaces, hyphens
 * 
 * @param address - The address object to validate
 * @returns ValidationResult with isValid flag and field-specific error messages
 */
export function validateAddress(address: Address | null | undefined): ValidationResult {
  const errors: Record<string, string> = {};

  // Check if address object is provided
  if (!address) {
    errors.address = 'Address is required';
    return { isValid: false, errors };
  }

  // Validate street
  if (!address.street || address.street.trim().length === 0) {
    errors['address.street'] = 'Street address is required';
  } else if (address.street.trim().length > 255) {
    errors['address.street'] = 'Street address must not exceed 255 characters';
  } else if (address.street.trim().length < 1) {
    errors['address.street'] = 'Street address must be at least 1 character';
  }

  // Validate city
  if (!address.city || address.city.trim().length === 0) {
    errors['address.city'] = 'City is required';
  } else if (address.city.trim().length > 100) {
    errors['address.city'] = 'City must not exceed 100 characters';
  } else {
    // City should contain only letters, spaces, hyphens, apostrophes, and periods
    const cityRegex = /^[a-zA-Z\s\-'.]+$/;
    if (!cityRegex.test(address.city.trim())) {
      errors['address.city'] = 'City must contain only letters, spaces, hyphens, apostrophes, and periods';
    }
  }

  // Validate state
  if (!address.state || address.state.trim().length === 0) {
    errors['address.state'] = 'State/Province is required';
  } else if (address.state.trim().length > 50) {
    errors['address.state'] = 'State/Province must not exceed 50 characters';
  } else if (address.state.trim().length < 2) {
    errors['address.state'] = 'State/Province must be at least 2 characters';
  } else {
    // State should contain only letters, spaces, and hyphens
    const stateRegex = /^[a-zA-Z\s\-]+$/;
    if (!stateRegex.test(address.state.trim())) {
      errors['address.state'] = 'State/Province must contain only letters, spaces, and hyphens';
    }
  }

  // Validate zip code
  if (!address.zipCode || address.zipCode.trim().length === 0) {
    errors['address.zipCode'] = 'Zip/Postal code is required';
  } else if (address.zipCode.trim().length > 10) {
    errors['address.zipCode'] = 'Zip/Postal code must not exceed 10 characters';
  } else if (address.zipCode.trim().length < 5) {
    errors['address.zipCode'] = 'Zip/Postal code must be at least 5 characters';
  } else {
    // Zip code should contain alphanumeric characters, spaces, and hyphens
    // Supports US format (12345, 12345-6789) and international formats (A1A 1A1, etc.)
    const zipRegex = /^[a-zA-Z0-9\s\-]+$/;
    if (!zipRegex.test(address.zipCode.trim())) {
      errors['address.zipCode'] = 'Zip/Postal code must contain only letters, numbers, spaces, and hyphens';
    }
  }

  // Validate country
  if (!address.country || address.country.trim().length === 0) {
    errors['address.country'] = 'Country is required';
  } else if (address.country.trim().length > 100) {
    errors['address.country'] = 'Country must not exceed 100 characters';
  } else if (address.country.trim().length < 2) {
    errors['address.country'] = 'Country must be at least 2 characters';
  } else {
    // Country should contain only letters, spaces, and hyphens
    const countryRegex = /^[a-zA-Z\s\-]+$/;
    if (!countryRegex.test(address.country.trim())) {
      errors['address.country'] = 'Country must contain only letters, spaces, and hyphens';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

// ============================================================================
// Combined Validation Utilities
// ============================================================================

/**
 * Validates all contact information fields together
 * Useful for registration and profile update validation
 * 
 * @param email - Email address to validate
 * @param phoneNumber - Phone number to validate
 * @param address - Address object to validate
 * @returns ValidationResult with combined errors from all validations
 */
export function validateContactInfo(
  email: string,
  phoneNumber: string,
  address: Address | null | undefined
): ValidationResult {
  const emailResult = validateEmail(email);
  const phoneResult = validatePhoneNumber(phoneNumber);
  const addressResult = validateAddress(address);

  const combinedErrors = {
    ...emailResult.errors,
    ...phoneResult.errors,
    ...addressResult.errors
  };

  return {
    isValid: Object.keys(combinedErrors).length === 0,
    errors: combinedErrors
  };
}

/**
 * Sanitizes a string by trimming whitespace
 * Useful for cleaning user input before validation
 * 
 * @param value - The string to sanitize
 * @returns Sanitized string or empty string if input is null/undefined
 */
export function sanitizeString(value: string | null | undefined): string {
  if (!value) {
    return '';
  }
  return value.trim();
}

/**
 * Sanitizes an address object by trimming all string fields
 * 
 * @param address - The address object to sanitize
 * @returns Sanitized address object or null if input is null/undefined
 */
export function sanitizeAddress(address: Address | null | undefined): Address | null {
  if (!address) {
    return null;
  }

  return {
    street: sanitizeString(address.street),
    city: sanitizeString(address.city),
    state: sanitizeString(address.state),
    zipCode: sanitizeString(address.zipCode),
    country: sanitizeString(address.country)
  };
}
