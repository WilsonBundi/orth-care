# ⚡ Quick Guide: Create Admin Profile in 3 Steps

## For Super Administrator (Owner/Director)

### Step 1: Run Command
```bash
node create-admin-user.js
```

### Step 2: Note Credentials
```
Email: admin@orthopedicscare.com
Password: SuperAdmin@2026!
```

### Step 3: Login & Change Password
Go to http://localhost:3000/login.html

**Done!** ✅

---

## For Staff Members (Doctor, Nurse, etc.)

### Step 1: User Registers
1. Go to http://localhost:3000/register.html
2. Fill form and submit
3. They get `patient` role initially

### Step 2: Upgrade Role in Firebase
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select project: **orthopedic-care**
3. Click **Firestore Database**
4. Open **users** collection
5. Find user by email
6. Edit **role** field
7. Change to: `doctor`, `nurse`, `billing_clerk`, etc.
8. Click **Update**

### Step 3: User Logs Out & In
User must logout and login to see new permissions.

**Done!** ✅

---

## For Multiple Staff (Bulk Creation)

### Step 1: Edit Script
Open `create-staff-accounts.js` and edit this section:

```javascript
const staffMembers = [
  {
    email: 'dr.smith@orthopedicscare.com',
    password: 'TempPassword123!',
    firstName: 'John',
    lastName: 'Smith',
    role: 'doctor',
    phone: '+254700000001',
    dateOfBirth: '1980-01-15'
  },
  // Add more staff...
];
```

### Step 2: Run Script
```bash
node create-staff-accounts.js
```

### Step 3: Send Credentials
Script will display all credentials. Send to each staff member.

**Done!** ✅

---

## Available Roles (Copy-Paste)

```
super_admin      - Complete system control
system_admin     - Technical administration
clinic_manager   - Operational management
specialist       - Specialized medical care
doctor           - Primary medical care
records_manager  - Medical records admin
nurse            - Clinical support
billing_clerk    - Financial operations
receptionist     - Front desk operations
patient          - Personal health access
```

---

## Quick Troubleshooting

**User can't see admin features?**
→ Logout, clear cache, login again

**Forgot password?**
→ Use password reset or update in Firebase

**Wrong role assigned?**
→ Edit role field in Firebase Console

**Need to test credentials?**
```bash
node test-login.js
```

---

## Need More Details?

See: `CREATE_ADMIN_PROFILES_GUIDE.md` for complete guide

---

**That's it!** Choose your method above and create your admin profiles! 🚀
