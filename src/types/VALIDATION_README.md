# Validation Utilities

This document describes the validation utilities implemented for the Patient Portal with Secure Authentication feature.

## Overview

The validation utilities provide comprehensive validation for email addresses, phone numbers, and physical addresses with detailed, user-friendly error messages. These utilities are used throughout the application to ensure data quality and provide clear feedback to users.

## Validation Functions

### `validateEmail(email: string): ValidationResult`

Validates email format according to RFC 5322 simplified pattern.

**Requirements:**
- Must contain exactly one @ symbol
- Local part (before @) must be 1-64 characters
- Domain part (after @) must be 1-255 characters
- Must contain at least one dot in domain
- Valid characters: alphanumeric, dots, hyphens, underscores, plus signs
- Total length must not exceed 320 characters
- No consecutive dots allowed
- Local part must not start or end with a dot

**Examples:**

```typescript
// Valid emails
validateEmail('user@example.com');           // ✓
validateEmail('first.last@example.com');     // ✓
validateEmail('user+tag@example.com');       // ✓
validateEmail('user@mail.example.com');      // ✓

// Invalid emails
validateEmail('');                           // ✗ Email address is required
validateEmail('userexample.com');            // ✗ Must be in valid format
validateEmail('user@');                      // ✗ Must be in valid format
validateEmail('user..name@example.com');     // ✗ Must not contain consecutive dots
validateEmail('.user@example.com');          // ✗ Must not start with a dot
```

### `validatePhoneNumber(phoneNumber: string): ValidationResult`

Validates phone number format supporting multiple international formats.

**Supported Formats:**
- US format: `(123) 456-7890`, `123-456-7890`, `1234567890`
- International format: `+1 123 456 7890`, `+44 20 1234 5678`
- With extensions: `123-456-7890 ext. 123`, `123-456-7890 x123`

**Requirements:**
- Must contain 10-15 digits (excluding country code prefix)
- May include country code with + prefix
- May include formatting characters: spaces, hyphens, parentheses, dots
- May include extension with 'ext', 'ext.', or 'x' prefix
- Maximum length: 30 characters

**Examples:**

```typescript
// Valid phone numbers
validatePhoneNumber('(123) 456-7890');       // ✓
validatePhoneNumber('123-456-7890');         // ✓
validatePhoneNumber('1234567890');           // ✓
validatePhoneNumber('+1 123 456 7890');      // ✓
validatePhoneNumber('123-456-7890 ext. 123'); // ✓

// Invalid phone numbers
validatePhoneNumber('');                     // ✗ Phone number is required
validatePhoneNumber('123-456-789');          // ✗ Must contain at least 10 digits
validatePhoneNumber('1234567890123456');     // ✗ Must not exceed 15 digits
validatePhoneNumber('123-ABC-7890');         // ✗ Must be in valid format
```

### `validateAddress(address: Address): ValidationResult`

Validates a complete address object with all required fields.

**Requirements:**

**Street:**
- Required
- 1-255 characters

**City:**
- Required
- 1-100 characters
- Letters, spaces, hyphens, apostrophes, and periods only

**State:**
- Required
- 2-50 characters
- Letters, spaces, and hyphens only

**Zip Code:**
- Required
- 5-10 characters
- Supports US format (12345, 12345-6789) and international formats (A1A 1A1)
- Alphanumeric characters, spaces, and hyphens only

**Country:**
- Required
- 2-100 characters
- Letters, spaces, and hyphens only

**Examples:**

```typescript
// Valid address
validateAddress({
  street: '123 Main Street',
  city: 'Boston',
  state: 'MA',
  zipCode: '02101',
  country: 'USA'
}); // ✓

// Valid address with apartment
validateAddress({
  street: '123 Main Street Apt 4B',
  city: 'New York',
  state: 'New York',
  zipCode: '10001-1234',
  country: 'United States'
}); // ✓

// Invalid address - empty fields
validateAddress({
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: ''
}); // ✗ Multiple field errors

// Invalid address - city with numbers
validateAddress({
  street: '123 Main St',
  city: 'Boston123',
  state: 'MA',
  zipCode: '02101',
  country: 'USA'
}); // ✗ City must contain only letters, spaces, hyphens, apostrophes, and periods
```

### `validateContactInfo(email: string, phoneNumber: string, address: Address): ValidationResult`

Validates all contact information fields together. Useful for registration and profile update validation.

**Returns:** Combined validation result with errors from all validations.

**Example:**

```typescript
validateContactInfo(
  'user@example.com',
  '123-456-7890',
  {
    street: '123 Main Street',
    city: 'Boston',
    state: 'MA',
    zipCode: '02101',
    country: 'USA'
  }
); // ✓ All valid

validateContactInfo(
  'invalid-email',
  '123',
  null
); // ✗ Returns errors for email, phoneNumber, and address
```

## Sanitization Functions

### `sanitizeString(value: string | null | undefined): string`

Trims whitespace from a string. Returns empty string if input is null or undefined.

**Example:**

```typescript
sanitizeString('  hello  ');     // 'hello'
sanitizeString('  hello world  '); // 'hello world'
sanitizeString(null);            // ''
sanitizeString(undefined);       // ''
```

### `sanitizeAddress(address: Address | null | undefined): Address | null`

Trims whitespace from all address fields. Returns null if input is null or undefined.

**Example:**

```typescript
sanitizeAddress({
  street: '  123 Main St  ',
  city: '  Boston  ',
  state: '  MA  ',
  zipCode: '  02101  ',
  country: '  USA  '
});
// Returns:
// {
//   street: '123 Main St',
//   city: 'Boston',
//   state: 'MA',
//   zipCode: '02101',
//   country: 'USA'
// }

sanitizeAddress(null); // null
```

## ValidationResult Type

All validation functions return a `ValidationResult` object:

```typescript
interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;  // Field name -> error message
}
```

**Example:**

```typescript
const result = validateEmail('invalid-email');
console.log(result.isValid);  // false
console.log(result.errors);   // { email: 'Email address must be in valid format...' }
```

## Usage in Application

### Registration Validation

```typescript
import { validateContactInfo, sanitizeString, sanitizeAddress } from './types/validation';

// Sanitize input first
const email = sanitizeString(req.body.email);
const phoneNumber = sanitizeString(req.body.phoneNumber);
const address = sanitizeAddress(req.body.address);

// Validate all contact info
const validation = validateContactInfo(email, phoneNumber, address);

if (!validation.isValid) {
  return res.status(400).json({
    error: 'Validation failed',
    fields: validation.errors
  });
}

// Proceed with registration...
```

### Profile Update Validation

```typescript
import { validateEmail, validatePhoneNumber, validateAddress } from './types/validation';

const errors: Record<string, string> = {};

// Validate only fields being updated
if (updates.email) {
  const emailResult = validateEmail(updates.email);
  if (!emailResult.isValid) {
    Object.assign(errors, emailResult.errors);
  }
}

if (updates.phoneNumber) {
  const phoneResult = validatePhoneNumber(updates.phoneNumber);
  if (!phoneResult.isValid) {
    Object.assign(errors, phoneResult.errors);
  }
}

if (updates.address) {
  const addressResult = validateAddress(updates.address);
  if (!addressResult.isValid) {
    Object.assign(errors, addressResult.errors);
  }
}

if (Object.keys(errors).length > 0) {
  return res.status(400).json({
    error: 'Validation failed',
    fields: errors
  });
}

// Proceed with update...
```

## Error Messages

All validation functions provide clear, actionable error messages:

### Email Errors
- `Email address is required`
- `Email address must not exceed 320 characters`
- `Email address must be in valid format (e.g., user@example.com)`
- `Email local part (before @) must not exceed 64 characters`
- `Email domain part (after @) must not exceed 255 characters`
- `Email address must not contain consecutive dots`
- `Email local part must not start or end with a dot`

### Phone Number Errors
- `Phone number is required`
- `Phone number must not exceed 30 characters`
- `Phone number must contain at least 10 digits`
- `Phone number must not exceed 15 digits`
- `Phone number must be in valid format (e.g., (123) 456-7890, 123-456-7890, +1 123 456 7890)`

### Address Errors
- `Address is required`
- `Street address is required`
- `Street address must not exceed 255 characters`
- `City is required`
- `City must not exceed 100 characters`
- `City must contain only letters, spaces, hyphens, apostrophes, and periods`
- `State/Province is required`
- `State/Province must be at least 2 characters`
- `State/Province must not exceed 50 characters`
- `State/Province must contain only letters, spaces, and hyphens`
- `Zip/Postal code is required`
- `Zip/Postal code must be at least 5 characters`
- `Zip/Postal code must not exceed 10 characters`
- `Zip/Postal code must contain only letters, numbers, spaces, and hyphens`
- `Country is required`
- `Country must be at least 2 characters`
- `Country must not exceed 100 characters`
- `Country must contain only letters, spaces, and hyphens`

## Testing

The validation utilities have comprehensive unit tests covering:

- Valid inputs in various formats
- Invalid inputs with appropriate error messages
- Edge cases (empty strings, whitespace, length limits)
- Special characters and formatting
- International formats
- Sanitization functions

Run tests with:

```bash
npm test src/types/validation.test.ts
```

## Design Decisions

### Why These Validation Rules?

1. **Email Validation**: Based on RFC 5322 simplified pattern, balancing strictness with usability. Supports common email formats while preventing obvious errors.

2. **Phone Number Validation**: Flexible format support for international users while ensuring minimum data quality. Accepts various formatting styles to improve user experience.

3. **Address Validation**: Strict field requirements ensure complete addresses for healthcare communication. Character restrictions prevent data quality issues while supporting international addresses.

4. **Error Messages**: Specific, actionable messages help users correct their input quickly. Each error explains what's wrong and how to fix it.

5. **Sanitization**: Automatic whitespace trimming prevents common user input errors and ensures consistent data storage.

## Future Enhancements

Potential improvements for future versions:

1. **Email Domain Validation**: Check MX records to verify domain exists
2. **Phone Number Formatting**: Auto-format phone numbers to consistent format
3. **Address Geocoding**: Validate addresses against postal service databases
4. **International Support**: More comprehensive international phone/address formats
5. **Custom Validation Rules**: Allow configuration of validation rules per deployment
6. **Async Validation**: Support for database lookups (e.g., email uniqueness)

## Related Files

- `src/types/models.ts` - Type definitions for Address and ValidationResult
- `src/types/validation.test.ts` - Comprehensive unit tests
- `.kiro/specs/patient-portal-auth/requirements.md` - Requirement 4.2 (Profile Update Validation)
- `.kiro/specs/patient-portal-auth/design.md` - Validation design specifications
