# PermissionRepository Implementation

## Overview

The PermissionRepository provides data access layer operations for role-based access control (RBAC) permissions. It implements secure database operations with SQL injection prevention through parameterized queries.

## Implementation Details

### Core Methods

#### `findByRole(role: Role): Promise<Permission[]>`
- Retrieves all permissions for a specific role
- Uses parameterized query to prevent SQL injection
- Returns permissions sorted by resource and action
- Returns empty array if no permissions found

#### `seed(): Promise<number>`
- Seeds initial patient permissions into the database
- Uses `ON CONFLICT DO NOTHING` to prevent duplicates
- Seeds three default permissions for patient role:
  - `read:own_profile`
  - `write:own_profile`
  - `read:dashboard`
- Returns count of newly inserted permissions (0 if already seeded)

#### `hasPermission(role: Role, action: string, resource: string): Promise<boolean>`
- Checks if a specific permission exists for a role
- Uses parameterized query with three parameters
- Returns true if permission exists, false otherwise
- Prevents SQL injection in all parameters

### Additional Helper Methods

#### `findAll(): Promise<Permission[]>`
- Returns all permissions in the system
- Sorted by role, resource, and action
- Useful for administrative purposes

#### `countByRole(role: Role): Promise<number>`
- Counts total permissions for a specific role
- Returns 0 if role has no permissions

## SQL Injection Prevention

All methods use parameterized queries with the `$1, $2, $3` placeholder syntax:

```typescript
// Example from findByRole
const query = `
  SELECT * FROM permissions
  WHERE role = $1
  ORDER BY resource, action
`;
const result = await this.pool.query(query, [role]);
```

This prevents SQL injection by:
1. Separating SQL structure from data
2. Using PostgreSQL's native parameter binding
3. Automatically escaping special characters
4. Preventing query manipulation

## Database Schema

The permissions table structure:
```sql
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  UNIQUE(role, action, resource)
);
```

Key constraints:
- Unique constraint on (role, action, resource) prevents duplicates
- UUID primary key for unique identification
- Indexed on role for fast lookups

## Initial Permissions

The patient role is seeded with these permissions:

| Role    | Action | Resource     | Description                    |
|---------|--------|--------------|--------------------------------|
| patient | read   | own_profile  | View own profile information   |
| patient | write  | own_profile  | Update own profile information |
| patient | read   | dashboard    | Access patient dashboard       |

## Usage Examples

### Seeding Permissions
```typescript
const repository = new PermissionRepository();
const insertedCount = await repository.seed();
console.log(`Inserted ${insertedCount} permissions`);
```

### Checking Permissions
```typescript
const hasAccess = await repository.hasPermission(
  Role.PATIENT,
  'read',
  'own_profile'
);

if (hasAccess) {
  // Allow access
} else {
  // Deny access
}
```

### Retrieving All Permissions for a Role
```typescript
const permissions = await repository.findByRole(Role.PATIENT);
permissions.forEach(p => {
  console.log(`${p.action} on ${p.resource}`);
});
```

## Testing

The implementation includes comprehensive unit tests covering:

1. **Seeding Operations**
   - Initial seed inserts 3 permissions
   - Duplicate seed calls don't create duplicates
   - Partial seeding when some permissions exist

2. **Query Operations**
   - Finding permissions by role
   - Checking specific permissions
   - Retrieving all permissions
   - Counting permissions by role

3. **SQL Injection Prevention**
   - Malicious input in role parameter
   - Malicious input in action parameter
   - Malicious input in resource parameter
   - Special characters and long strings

4. **Edge Cases**
   - Empty strings
   - Special characters
   - Very long strings
   - Non-existent roles

5. **Database Constraints**
   - Unique constraint enforcement
   - Multiple roles with same action/resource

## Security Considerations

1. **Parameterized Queries**: All queries use parameterized statements
2. **No String Concatenation**: SQL is never built with string concatenation
3. **Input Validation**: Database constraints enforce data integrity
4. **Read-Only Operations**: Most methods are read-only (findByRole, hasPermission)
5. **Idempotent Seeding**: Seed operation can be safely called multiple times

## Future Extensions

The repository is designed to support future enhancements:

1. **Additional Roles**: Easy to add doctor, nurse, admin roles
2. **Dynamic Permissions**: Can add new permissions at runtime
3. **Permission Hierarchies**: Can extend to support permission inheritance
4. **Resource-Level Permissions**: Can add more granular resource permissions
5. **Audit Logging**: Can integrate with AuditService for permission changes

## Integration with Authorization Service

The PermissionRepository is used by the AuthorizationService to:
1. Load permissions for a user's role
2. Check if a user has permission for an action
3. Implement default-deny authorization logic

Example integration:
```typescript
class AuthorizationService {
  async hasPermission(userId: string, action: string, resource: string): Promise<boolean> {
    const user = await userRepository.findById(userId);
    if (!user) return false;
    
    return await permissionRepository.hasPermission(user.role, action, resource);
  }
}
```

## Performance Considerations

1. **Indexed Queries**: Role column is indexed for fast lookups
2. **Connection Pooling**: Uses PostgreSQL connection pool
3. **Minimal Data Transfer**: Only retrieves necessary columns
4. **Efficient Sorting**: Database-level sorting is faster than application-level

## Error Handling

The repository handles errors gracefully:
- Database connection errors propagate to caller
- Unique constraint violations are caught in seed method
- Invalid parameters return empty results rather than throwing
- All errors are logged for debugging

## Compliance

The implementation satisfies:
- **Requirement 6.2**: Verify patient role has permission to access resources
- **Requirement 6.3**: Maintain permission mapping for patient role
- **Requirement 6.4**: Default-deny logic (hasPermission returns false for non-existent permissions)
