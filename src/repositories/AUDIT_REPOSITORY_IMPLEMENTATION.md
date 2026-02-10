# AuditRepository Implementation

## Overview

The AuditRepository implements a tamper-evident audit logging system for the Patient Portal. It provides secure, immutable logging of all security-relevant events with cryptographic hash chaining to detect any tampering attempts.

## Key Features

### 1. Sequential ID Generation
- Uses PostgreSQL's `SERIAL` type for automatic sequential ID assignment
- IDs are strictly increasing integers with no gaps
- Maintains chronological ordering of events

### 2. Tamper-Evident Hash Chain
Each audit entry contains a SHA-256 hash that includes:
- The hash of the previous entry (creating the chain)
- All fields of the current entry (userId, eventType, timestamp, ipAddress, userAgent, outcome, details)

This creates a blockchain-like structure where:
- Any modification to a past entry breaks the chain
- Any deletion of an entry breaks the chain
- The `verifyHashChain()` method can detect tampering

### 3. Immutability
- No update or delete methods are provided
- Once created, audit entries cannot be modified
- This ensures the integrity of the audit trail

### 4. Comprehensive Query Methods

#### `findByUserId(userId, limit?, offset?)`
Retrieves all audit events for a specific user, ordered by timestamp descending.

#### `findByType(eventType, limit?, offset?)`
Retrieves all audit events of a specific type (e.g., LOGIN_SUCCESS, PASSWORD_CHANGED).

#### `findByDateRange(startDate, endDate, limit?, offset?)`
Retrieves all audit events within a date range.

#### `findByUserIdAndDateRange(userId, startDate, endDate, limit?, offset?)`
Combines user and date filtering for security investigations.

## Hash Chain Algorithm

```typescript
hash = SHA256(
  previousHash + "|" +
  userId + "|" +
  eventType + "|" +
  timestamp.toISOString() + "|" +
  ipAddress + "|" +
  userAgent + "|" +
  outcome + "|" +
  JSON.stringify(details)
)
```

The first entry in the chain uses an empty string as the previous hash.

## Usage Examples

### Creating an Audit Event

```typescript
const event = await auditRepository.create({
  userId: '123e4567-e89b-12d3-a456-426614174000',
  eventType: AuditEventType.LOGIN_SUCCESS,
  ipAddress: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
  outcome: 'success',
  details: { method: 'password' }
});
```

### Querying Audit Events

```typescript
// Get all login events for a user
const loginEvents = await auditRepository.findByUserId(userId);

// Get all failed login attempts
const failedLogins = await auditRepository.findByType(
  AuditEventType.LOGIN_FAILURE
);

// Get events in a date range
const events = await auditRepository.findByDateRange(
  new Date('2024-01-01'),
  new Date('2024-01-31')
);
```

### Verifying Hash Chain Integrity

```typescript
const verification = await auditRepository.verifyHashChain();

if (verification.isValid) {
  console.log('Audit log is intact');
} else {
  console.error('Tampering detected!');
  console.error('Broken links:', verification.brokenLinks);
}
```

## Security Considerations

1. **Hash Algorithm**: Uses SHA-256 for cryptographic strength
2. **Chain Integrity**: Any modification breaks the chain from that point forward
3. **Timestamp Integrity**: Timestamps are included in the hash, preventing backdating
4. **No Deletion**: Entries cannot be deleted without breaking the chain
5. **Parameterized Queries**: All SQL queries use parameterized statements to prevent SQL injection

## Testing

The implementation includes comprehensive unit tests covering:
- Sequential ID generation
- Hash chain creation and verification
- All query methods with various filters
- Tamper detection
- Edge cases (empty log, null userId, complex details)

Run tests with:
```bash
npm test -- src/repositories/AuditRepository.test.ts
```

## Compliance

This implementation satisfies the following requirements:
- **Requirement 8.1**: Records all security-relevant events with required fields
- **Requirement 8.3**: Tamper-evident format prevents modification or deletion
- **Requirement 8.4**: Sequential identifiers maintain ordering
- **Requirement 8.5**: Immediate persistence to durable storage
- **Requirement 8.6**: Sufficient detail for security investigations

## Future Enhancements

Potential improvements for production use:
1. **Partitioning**: Partition the audit_events table by date for better performance with large volumes
2. **Archiving**: Implement archiving strategy for old audit logs
3. **Real-time Monitoring**: Add hooks for real-time alerting on suspicious events
4. **Merkle Trees**: Consider Merkle tree structure for more efficient verification
5. **Digital Signatures**: Add digital signatures for non-repudiation
