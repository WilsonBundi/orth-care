# Professional Healthcare Role System

## Overview

A comprehensive, enterprise-grade role-based access control (RBAC) system designed specifically for healthcare organizations. This system implements a clear hierarchy with appropriate permissions for each role.

---

## Role Hierarchy

```
Level 9: SUPER_ADMIN          (Complete System Control)
Level 8: SYSTEM_ADMIN          (Technical Administration)
Level 7: CLINIC_MANAGER        (Operational Management)
Level 6: SPECIALIST            (Specialized Medical Care)
Level 5: DOCTOR                (Primary Medical Care)
Level 4: RECORDS_MANAGER       (Medical Records Administration)
Level 3: NURSE / BILLING_CLERK (Clinical Support / Financial Operations)
Level 2: RECEPTIONIST          (Front Desk Operations)
Level 1: PATIENT               (Personal Health Access)
```

---

## Role Definitions

### 1. PATIENT (Level 1)
**Purpose:** Registered patient with access to personal health information

**Permissions:**
- ✓ View and update own profile
- ✓ Book, view, and cancel own appointments
- ✓ View own medical records (read-only)
- ✓ View own invoices and billing
- ✓ Access patient dashboard

**Use Case:** Regular patients accessing their health information

---

### 2. RECEPTIONIST (Level 2)
**Purpose:** Front desk staff managing appointments and patient registration

**Permissions:**
- ✓ All PATIENT permissions
- ✓ Full appointment management (all patients)
- ✓ Patient registration and basic info management
- ✓ View clinic schedule
- ✓ Manage waiting list

**Use Case:** Front desk operations, patient check-in/out

---

### 3. NURSE (Level 3)
**Purpose:** Clinical staff providing patient care and support

**Permissions:**
- ✓ All RECEPTIONIST permissions
- ✓ View and update patient medical records
- ✓ Record and update patient vitals
- ✓ View medications and record administration
- ✓ View and upload lab results
- ✓ Add nursing notes to patient records

**Use Case:** Clinical care, patient monitoring, medication administration

---

### 4. BILLING_CLERK (Level 3)
**Purpose:** Staff managing financial operations

**Permissions:**
- ✓ All RECEPTIONIST permissions
- ✓ Full invoice management
- ✓ Process and record payments
- ✓ Generate billing reports
- ✓ Manage insurance claims
- ✓ Update patient billing information

**Use Case:** Financial operations, billing, payment processing

---

### 5. RECORDS_MANAGER (Level 4)
**Purpose:** Staff managing medical records and documentation

**Permissions:**
- ✓ All NURSE permissions
- ✓ Full medical records management (CRUD + Archive)
- ✓ Manage medical documents and files
- ✓ View records access audit logs
- ✓ Export patient records (with consent)

**Use Case:** Medical records administration, document management

---

### 6. DOCTOR (Level 5)
**Purpose:** Licensed physician providing medical care

**Permissions:**
- ✓ All NURSE permissions
- ✓ Full access to patient medical records
- ✓ Prescribe and manage medications
- ✓ Record and update diagnoses
- ✓ Create and manage treatment plans
- ✓ Order laboratory tests
- ✓ Create patient referrals
- ✓ Issue medical certificates

**Use Case:** Primary medical care, diagnosis, treatment

---

### 7. SPECIALIST (Level 6)
**Purpose:** Specialized physician (Orthopedic, Cardiology, etc.)

**Permissions:**
- ✓ All DOCTOR permissions
- ✓ Perform specialized medical procedures
- ✓ Create and manage surgical notes
- ✓ Provide specialist consultations

**Use Case:** Specialized medical care, surgical procedures

---

### 8. CLINIC_MANAGER (Level 7)
**Purpose:** Manager overseeing clinic operations

**Permissions:**
- ✓ All DOCTOR, BILLING_CLERK, and RECORDS_MANAGER permissions
- ✓ View and manage staff schedules
- ✓ Generate operational reports
- ✓ Manage clinic inventory
- ✓ View quality and performance metrics
- ✓ View and respond to patient feedback
- ✓ View financial summaries and reports

**Use Case:** Operational management, staff coordination, performance monitoring

---

### 9. SYSTEM_ADMIN (Level 8)
**Purpose:** Technical administrator managing system configuration

**Permissions:**
- ✓ All CLINIC_MANAGER permissions
- ✓ Configure system settings
- ✓ View and export system audit logs
- ✓ Manage system backups
- ✓ Configure external integrations
- ✓ Manage security configurations
- ✓ Monitor system health and performance

**Use Case:** Technical administration, system configuration, security management

---

### 10. SUPER_ADMIN (Level 9)
**Purpose:** Highest level administrator with complete system access

**Permissions:**
- ✓ All SYSTEM_ADMIN permissions
- ✓ Full user and role management
- ✓ Manage roles and permissions
- ✓ Complete system configuration access
- ✓ Manage all system data
- ✓ Grant/revoke emergency access

**Use Case:** Complete system control, user management, emergency situations

---

## Permission Inheritance

Higher-level roles automatically inherit all permissions from lower-level roles:

```
SUPER_ADMIN
    └─ SYSTEM_ADMIN
        └─ CLINIC_MANAGER
            ├─ DOCTOR
            │   └─ SPECIALIST
            ├─ RECORDS_MANAGER
            │   └─ NURSE
            └─ BILLING_CLERK
                └─ RECEPTIONIST
                    └─ PATIENT
```

---

## Access Control Examples

### Medical Records Access
- **View:** NURSE and above
- **Edit:** DOCTOR and above
- **Delete:** RECORDS_MANAGER and above

### Billing Access
- **View:** BILLING_CLERK and above
- **Create/Edit:** BILLING_CLERK and above
- **Financial Reports:** CLINIC_MANAGER and above

### System Administration
- **System Settings:** SYSTEM_ADMIN and above
- **User Management:** SUPER_ADMIN only
- **Audit Logs:** SYSTEM_ADMIN and above

---

## Creating Users with Different Roles

### Create Super Administrator
```bash
node create-admin-user.js
```
Creates: `admin@orthopedicscare.com` with `super_admin` role

### Assign Role to Existing User
```bash
node make-user-admin.js email@example.com
```
Then manually update role in Firebase to desired level

### Manual Role Assignment (Firebase Console)
1. Go to Firebase Console → Firestore
2. Find user in `users` collection
3. Update `role` field to one of:
   - `patient`
   - `receptionist`
   - `nurse`
   - `billing_clerk`
   - `records_manager`
   - `doctor`
   - `specialist`
   - `clinic_manager`
   - `system_admin`
   - `super_admin`

---

## Security Features

### Role-Based Access Control
- ✓ Hierarchical permission system
- ✓ Automatic permission inheritance
- ✓ Granular resource-level permissions
- ✓ Action-level access control

### Audit Logging
- ✓ All access attempts logged
- ✓ Role information in audit trails
- ✓ Failed access attempts tracked
- ✓ Compliance-ready audit logs

### Frontend Protection
- ✓ Role-based UI rendering
- ✓ Dynamic navigation based on role
- ✓ Client-side access guards
- ✓ Clear error messages

### Backend Protection
- ✓ Middleware-based enforcement
- ✓ API endpoint protection
- ✓ Role hierarchy validation
- ✓ Comprehensive error handling

---

## Best Practices

### 1. Principle of Least Privilege
- Assign the minimum role necessary for job function
- Regularly review and audit role assignments
- Remove unnecessary permissions

### 2. Separation of Duties
- Clinical staff (NURSE, DOCTOR) focus on patient care
- Administrative staff (BILLING_CLERK) handle finances
- Technical staff (SYSTEM_ADMIN) manage system
- Management (CLINIC_MANAGER) oversee operations

### 3. Role Assignment Guidelines
- **PATIENT:** All registered patients
- **RECEPTIONIST:** Front desk staff only
- **NURSE:** Licensed nursing staff
- **BILLING_CLERK:** Finance department staff
- **RECORDS_MANAGER:** Medical records department
- **DOCTOR:** Licensed physicians
- **SPECIALIST:** Board-certified specialists
- **CLINIC_MANAGER:** Operations managers
- **SYSTEM_ADMIN:** IT department only
- **SUPER_ADMIN:** Owner/Director only (1-2 people max)

### 4. Security Recommendations
- ✓ Limit SUPER_ADMIN accounts to 1-2 people
- ✓ Enable MFA for all administrative roles
- ✓ Regular password changes for high-privilege accounts
- ✓ Monitor audit logs for suspicious activity
- ✓ Review role assignments quarterly
- ✓ Document all role changes

---

## Compliance Considerations

### HIPAA Compliance
- ✓ Role-based access to PHI (Protected Health Information)
- ✓ Audit trails for all access
- ✓ Minimum necessary access principle
- ✓ Emergency access procedures

### Data Protection
- ✓ Granular access controls
- ✓ Audit logging
- ✓ User accountability
- ✓ Access review procedures

---

## Migration from Old System

### If you have existing "admin" users:

1. **Identify their actual function:**
   - System management → `system_admin`
   - Clinical oversight → `clinic_manager`
   - Medical care → `doctor` or `specialist`
   - Records management → `records_manager`
   - Billing → `billing_clerk`

2. **Update role in Firebase:**
   ```javascript
   // In Firebase Console or via script
   userDoc.update({ role: 'appropriate_role' })
   ```

3. **Notify users:**
   - Inform them of role change
   - Explain new permissions
   - Provide training if needed

---

## API Usage Examples

### Check User Role
```typescript
import { rolePermissionsService } from './services/RolePermissionsService';

const userRole = user.role;
const roleLevel = rolePermissionsService.getRoleLevel(userRole);
```

### Check Permission
```typescript
const hasPermission = rolePermissionsService.hasPermission(
  userRole,
  'medical_records',
  'update'
);
```

### Protect Route
```typescript
import { requireMinimumRole } from './middleware/roleCheck';
import { Role } from './types/models';

router.get('/medical-records', 
  authenticate,
  requireMinimumRole(Role.NURSE),
  handler
);
```

---

## Support and Documentation

### For Administrators
- Review role definitions before assignment
- Monitor audit logs regularly
- Follow security best practices
- Document role changes

### For Developers
- Use `rolePermissionsService` for permission checks
- Apply appropriate middleware to routes
- Log all access attempts
- Follow principle of least privilege

### For Users
- Understand your role and permissions
- Report access issues immediately
- Don't share credentials
- Use MFA when available

---

## Summary

This professional role system provides:

✅ Clear role hierarchy (10 levels)
✅ Granular permissions per role
✅ Automatic permission inheritance
✅ Healthcare-specific roles
✅ HIPAA-compliant access controls
✅ Comprehensive audit logging
✅ Easy role management
✅ Scalable architecture

**Status:** Production-ready and fully implemented
