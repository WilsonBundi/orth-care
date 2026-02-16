# 📋 Complete Guide: Creating Admin Profiles

## Overview

This guide shows you how to create different types of admin/staff profiles for your healthcare system. You can create profiles for doctors, nurses, billing staff, managers, and system administrators.

---

## 🎯 Available Roles

Before creating profiles, understand the available roles:

| Role | Level | Purpose | Who Should Have It |
|------|-------|---------|-------------------|
| **super_admin** | 9 | Complete system control | Owner/Director (1-2 people) |
| **system_admin** | 8 | Technical administration | IT Manager |
| **clinic_manager** | 7 | Operational management | Clinic Manager |
| **specialist** | 6 | Specialized medical care | Orthopedic Specialist |
| **doctor** | 5 | Primary medical care | General Physicians |
| **records_manager** | 4 | Medical records admin | Records Department Head |
| **nurse** | 3 | Clinical support | Nursing Staff |
| **billing_clerk** | 3 | Financial operations | Billing Department |
| **receptionist** | 2 | Front desk operations | Reception Staff |
| **patient** | 1 | Personal health access | Patients |

---

## Method 1: Create Super Administrator (Highest Level)

### Use Case: Owner, Director, or Primary System Administrator

### Step 1: Run the Creation Script

```bash
node create-admin-user.js
```

### What It Creates:
- **Email:** admin@orthopedicscare.com
- **Password:** SuperAdmin@2026!
- **Role:** super_admin (Level 9)
- **Name:** Super Administrator

### Step 2: Login and Change Password

1. Go to http://localhost:3000/login.html
2. Login with the credentials above
3. Go to Profile → Change Password
4. Set a strong, unique password

### ⚠️ Important:
- Only create 1-2 super admin accounts
- This role has complete system control
- Enable MFA when available
- Never share these credentials

---

## Method 2: Create Staff Profiles (Recommended)

### Use Case: Doctors, Nurses, Billing Staff, Managers

This is the recommended method for creating staff accounts.

### Step 1: User Registers Through Website

1. Go to http://localhost:3000/register.html
2. Fill in the registration form:
   - Email (use work email)
   - Password
   - First Name
   - Last Name
   - Date of Birth
   - Phone Number
   - Address

3. Click "Register"

### Step 2: Assign Appropriate Role

After registration, the user gets `patient` role by default. You need to upgrade them.

#### Option A: Using Firebase Console (Easiest)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project: **orthopedic-care**
3. Click **Firestore Database** in left menu
4. Find the **users** collection
5. Find the user by email
6. Click on the user document
7. Find the **role** field
8. Click the pencil icon to edit
9. Change from `patient` to desired role:
   - `doctor` - for physicians
   - `nurse` - for nursing staff
   - `billing_clerk` - for billing department
   - `receptionist` - for front desk
   - `records_manager` - for records department
   - `clinic_manager` - for managers
   - `system_admin` - for IT staff
   - `specialist` - for specialists

10. Click **Update**
11. User must logout and login again to see new permissions

#### Option B: Using Script

```bash
# First, make them any admin level
node make-user-admin.js user@example.com

# Then manually update role in Firebase Console to specific role
```

---

## Method 3: Create Multiple Staff Accounts (Bulk)

### Use Case: Setting up entire staff team

### Step 1: Create a Bulk Creation Script

Create a file `create-staff-accounts.js`:

```javascript
const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Initialize Firebase
let serviceAccount;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  console.error('Firebase credentials not found');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = admin.firestore();

// Define your staff members
const staffMembers = [
  {
    email: 'dr.smith@orthopedicscare.com',
    password: 'TempPassword123!',
    firstName: 'John',
    lastName: 'Smith',
    role: 'doctor',
    phone: '+254700000001'
  },
  {
    email: 'nurse.jane@orthopedicscare.com',
    password: 'TempPassword123!',
    firstName: 'Jane',
    lastName: 'Doe',
    role: 'nurse',
    phone: '+254700000002'
  },
  {
    email: 'billing@orthopedicscare.com',
    password: 'TempPassword123!',
    firstName: 'Mary',
    lastName: 'Johnson',
    role: 'billing_clerk',
    phone: '+254700000003'
  },
  {
    email: 'reception@orthopedicscare.com',
    password: 'TempPassword123!',
    firstName: 'Sarah',
    lastName: 'Williams',
    role: 'receptionist',
    phone: '+254700000004'
  }
];

async function createStaffAccounts() {
  console.log('Creating staff accounts...\n');

  for (const staff of staffMembers) {
    try {
      // Check if user exists
      const existing = await db.collection('users')
        .where('email', '==', staff.email)
        .get();

      if (!existing.empty) {
        console.log(`⚠️  ${staff.email} already exists - skipping`);
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(staff.password, 10);

      // Create user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const userData = {
        id: userId,
        email: staff.email,
        passwordHash: passwordHash,
        firstName: staff.firstName,
        lastName: staff.lastName,
        dateOfBirth: new Date('1990-01-01'),
        phoneNumber: staff.phone,
        address: {
          street: 'Orthopedic Care Clinic',
          city: 'Nairobi',
          state: 'Nairobi County',
          zipCode: '00100',
          country: 'Kenya'
        },
        role: staff.role,
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('users').doc(userId).set(userData);

      console.log(`✅ Created: ${staff.firstName} ${staff.lastName}`);
      console.log(`   Email: ${staff.email}`);
      console.log(`   Role: ${staff.role}`);
      console.log(`   Password: ${staff.password}`);
      console.log('');

    } catch (error) {
      console.error(`❌ Error creating ${staff.email}:`, error.message);
    }
  }

  console.log('\n✅ Staff account creation complete!');
  console.log('\n⚠️  IMPORTANT: All staff must change their passwords on first login!');
  process.exit(0);
}

createStaffAccounts();
```

### Step 2: Customize the Staff List

Edit the `staffMembers` array in the script above with your actual staff details.

### Step 3: Run the Script

```bash
node create-staff-accounts.js
```

### Step 4: Notify Staff

Send each staff member their credentials and ask them to:
1. Login at http://localhost:3000/login.html
2. Change their password immediately
3. Update their profile information

---

## Method 4: Promote Existing Patient to Staff

### Use Case: A patient needs to become staff member

### Step 1: Find User in Firebase

1. Go to Firebase Console → Firestore
2. Find users collection
3. Search for user by email

### Step 2: Update Role

1. Click on user document
2. Edit `role` field
3. Change to appropriate staff role
4. Save

### Step 3: Notify User

Tell them to logout and login again to see new permissions.

---

## 📊 Role Assignment Examples

### Example 1: Orthopedic Clinic Setup

```
Owner/Director:
- Email: director@orthopedicscare.com
- Role: super_admin

Clinic Manager:
- Email: manager@orthopedicscare.com
- Role: clinic_manager

Orthopedic Specialist:
- Email: dr.specialist@orthopedicscare.com
- Role: specialist

General Doctor:
- Email: dr.general@orthopedicscare.com
- Role: doctor

Head Nurse:
- Email: head.nurse@orthopedicscare.com
- Role: nurse

Nurses (3):
- nurse1@orthopedicscare.com - Role: nurse
- nurse2@orthopedicscare.com - Role: nurse
- nurse3@orthopedicscare.com - Role: nurse

Billing Department:
- billing@orthopedicscare.com - Role: billing_clerk

Reception (2):
- reception1@orthopedicscare.com - Role: receptionist
- reception2@orthopedicscare.com - Role: receptionist

Records Manager:
- records@orthopedicscare.com - Role: records_manager

IT Administrator:
- it@orthopedicscare.com - Role: system_admin
```

---

## 🔐 Security Best Practices

### 1. Password Management

**Initial Passwords:**
- Use temporary passwords like `TempPassword123!`
- Force password change on first login
- Minimum 12 characters
- Include uppercase, lowercase, numbers, symbols

**Password Policy:**
- Change every 90 days
- No password reuse
- Use password manager
- Enable MFA when available

### 2. Role Assignment

**Principle of Least Privilege:**
- Assign minimum role needed for job function
- Don't give everyone super_admin
- Review roles quarterly
- Remove access when staff leaves

**Recommended Limits:**
- Super Admin: 1-2 people
- System Admin: 1-3 people
- Clinic Manager: 1-2 people
- Other roles: As needed

### 3. Account Management

**Regular Reviews:**
- Review all accounts monthly
- Disable inactive accounts
- Check for unauthorized access
- Update contact information

**Audit Logging:**
- Monitor access logs
- Track role changes
- Investigate suspicious activity
- Keep logs for compliance

---

## 🛠️ Troubleshooting

### Problem: User can't see admin features after role change

**Solution:**
1. User must logout completely
2. Clear browser cache: `localStorage.clear()` in console
3. Login again
4. Features should now appear

### Problem: Forgot to note down password

**Solution:**
1. Go to Firebase Console
2. Find user in users collection
3. Generate new password hash:
   ```bash
   node -e "const bcrypt = require('bcrypt'); bcrypt.hash('NewPassword123!', 10).then(console.log)"
   ```
4. Update `passwordHash` field in Firebase
5. User can now login with new password

### Problem: Need to change user's role

**Solution:**
1. Firebase Console → Firestore → users
2. Find user document
3. Edit `role` field
4. User logs out and logs in

### Problem: Created wrong role

**Solution:**
Same as above - just edit the role field in Firebase

---

## 📝 Quick Reference Commands

```bash
# Create Super Administrator
node create-admin-user.js

# Upgrade existing user to super admin
node upgrade-to-super-admin.js

# Make user any admin level (then edit in Firebase)
node make-user-admin.js user@example.com

# Check if admin exists
node check-admin.js

# Test login credentials
node test-login.js

# Create bulk staff accounts
node create-staff-accounts.js
```

---

## 📋 Checklist: Setting Up New Staff Member

- [ ] Decide appropriate role for staff member
- [ ] Create account (register or script)
- [ ] Assign correct role in Firebase
- [ ] Generate temporary password
- [ ] Send credentials to staff member
- [ ] Instruct to change password on first login
- [ ] Verify they can access appropriate features
- [ ] Add to staff directory/documentation
- [ ] Set up MFA (when available)
- [ ] Schedule role review date

---

## 🎯 Summary

**For Super Admin (Owner/Director):**
```bash
node create-admin-user.js
```

**For Staff Members:**
1. Register at /register.html
2. Update role in Firebase Console
3. User logs out and logs in

**For Bulk Staff:**
1. Create custom script with staff list
2. Run script
3. Notify all staff of credentials

**Remember:**
- ✅ Assign minimum necessary role
- ✅ Use strong passwords
- ✅ Change passwords on first login
- ✅ Review roles regularly
- ✅ Monitor audit logs
- ✅ Document all role assignments

---

## Need Help?

- Check `PROFESSIONAL_ROLE_SYSTEM.md` for role details
- Check `PROFESSIONAL_ADMIN_COMPLETE.md` for system overview
- Run `node test-login.js` to verify credentials
- Check Firebase Console for user data

---

**Ready to create your first admin profile?** Follow Method 1 or Method 2 above! 🚀
