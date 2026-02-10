# Services

This directory contains business logic services for the Patient Portal application.

## PasswordService

The `PasswordService` handles all password-related operations including hashing, verification, and validation.

### Features

- **Password Hashing**: Uses bcrypt with work factor 12 for secure password storage
- **Password Verification**: Compares plaintext passwords against bcrypt hashes
- **Password Strength Validation**: Enforces security requirements

### Password Requirements

All passwords must meet the following criteria:
- Minimum 8 characters long
- At least one uppercase letter (A-Z)
- At least one lowercase letter (a-z)
- At least one number (0-9)
- At least one special character (!@#$%^&*()_+-=[]{};\':"|,.<>/?)

### Usage Example

```typescript
import { PasswordService } from './services';

const passwordService = new PasswordService();

// Validate password strength
const validation = passwordService.validatePasswordStrength('MyPass123!');
if (!validation.isValid) {
  console.error('Password validation failed:', validation.errors);
  return;
}

// Hash a password
const hash = await passwordService.hashPassword('MyPass123!');

// Verify a password
const isValid = await passwordService.verifyPassword('MyPass123!', hash);
console.log('Password is valid:', isValid);
```

### Methods

#### `hashPassword(password: string): Promise<string>`

Hashes a password using bcrypt with work factor 12.

**Parameters:**
- `password` - The plaintext password to hash

**Returns:**
- Promise resolving to the bcrypt hash (60 characters)

**Requirements:** 1.2, 5.3

---

#### `verifyPassword(password: string, hash: string): Promise<boolean>`

Verifies a password against a bcrypt hash.

**Parameters:**
- `password` - The plaintext password to verify
- `hash` - The bcrypt hash to compare against

**Returns:**
- Promise resolving to `true` if password matches, `false` otherwise

**Requirements:** 1.2, 2.1

---

#### `validatePasswordStrength(password: string): ValidationResult`

Validates that a password meets all security requirements.

**Parameters:**
- `password` - The password to validate

**Returns:**
- `ValidationResult` object with:
  - `isValid`: boolean indicating if password meets all requirements
  - `errors`: Record of field names to error messages

**Requirements:** 1.4, 5.2

### Testing

The PasswordService has comprehensive unit tests covering:
- Password hashing with salt generation
- Password verification (correct and incorrect passwords)
- Password strength validation (all requirements)
- Edge cases (empty passwords, very long passwords, special characters)
- Integration scenarios (hash and verify workflow, password change)

Run tests with:
```bash
npm test -- src/services/PasswordService.test.ts
```
