# How to Access Admin Pages

## Quick Start

### Step 1: Create an Admin User

Run this command in your terminal:

```bash
node create-admin-user.js
```

This will create an admin account with:
- **Email:** `admin@orthopedicscare.com`
- **Password:** `Admin@123456`

### Step 2: Start the Server

```bash
npm run dev
```

### Step 3: Login as Admin

1. Open your browser to `http://localhost:3000/login.html`
2. Login with the admin credentials above
3. You'll be redirected to the dashboard

### Step 4: Access Admin Features

After logging in as admin, you'll see these additional cards on your dashboard:

- **📋 Medical Records** - Manage patient medical records
- **💰 Billing & Invoices** - Manage billing and payments
- **⚙️ Admin Dashboard** - Access admin portal

Click any of these to access admin-only pages.

---

## Admin Pages Available

### 1. Admin Dashboard
**URL:** `http://localhost:3000/admin-dashboard.html`

Features:
- Overview of all admin functions
- Quick access to medical records
- Quick access to billing
- View all appointments
- View patient profiles

### 2. Medical Records
**URL:** `http://localhost:3000/medical-records.html`

Features:
- Upload medical documents
- View all patient records
- Filter by document type
- Search records
- Download/view documents

### 3. Billing & Invoices
**URL:** `http://localhost:3000/billing.html`

Features:
- View all invoices
- Create new invoices
- Process payments
- Track outstanding balances
- View payment history

---

## Manual Method: Update Existing User to Admin

If you already have a user account and want to make it admin:

### Option A: Using Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Firestore Database
4. Find the `users` collection
5. Find your user document
6. Edit the `role` field from `patient` to `admin`
7. Save changes
8. Logout and login again

### Option B: Using a Script

Create a file `make-user-admin.js`:

```javascript
const admin = require('firebase-admin');
require('dotenv').config();

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64 || '', 'base64').toString('utf-8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = admin.firestore();

async function makeUserAdmin(email) {
  const usersSnapshot = await db.collection('users')
    .where('email', '==', email)
    .get();

  if (usersSnapshot.empty) {
    console.log('User not found');
    return;
  }

  const userDoc = usersSnapshot.docs[0];
  await userDoc.ref.update({ role: 'admin' });
  
  console.log('✅ User is now admin!');
  console.log('Logout and login again to see admin features');
}

// Replace with your email
makeUserAdmin('your-email@example.com');
```

Run with:
```bash
node make-user-admin.js
```

---

## Testing Admin Access

### Test 1: Dashboard Shows Admin Cards
1. Login as admin
2. Go to dashboard
3. You should see 5 cards total:
   - Appointments
   - My Profile
   - Medical Records (admin only)
   - Billing & Invoices (admin only)
   - Admin Dashboard (admin only)

### Test 2: Access Medical Records
1. Click "Medical Records" from dashboard
2. Page should load successfully
3. You can upload documents and view records

### Test 3: Access Billing
1. Click "Billing & Invoices" from dashboard
2. Page should load successfully
3. You can view invoices and process payments

### Test 4: Patient Cannot Access
1. Logout
2. Register/login as a regular patient
3. Dashboard should only show 2 cards (Appointments, Profile)
4. Try to access `/medical-records.html` directly
5. Should see error: "Access denied: This page is restricted to administrators only"
6. Should be redirected to dashboard

---

## Troubleshooting

### "Access denied" even though I'm admin

**Solution:**
1. Logout completely
2. Clear browser localStorage: Open DevTools (F12) → Console → Run:
   ```javascript
   localStorage.clear()
   ```
3. Login again with admin credentials

### Admin cards not showing on dashboard

**Solution:**
1. Check if user role is actually 'admin' in Firebase
2. Clear browser cache and localStorage
3. Make sure you're logged in with the admin account
4. Check browser console for any JavaScript errors

### Cannot create admin user

**Solution:**
1. Make sure Firebase credentials are configured in `.env`
2. Check that `FIREBASE_CREDENTIALS_BASE64` is set
3. Verify Firebase project ID is correct
4. Make sure you have internet connection

---

## Security Notes

⚠️ **Important Security Considerations:**

1. **Change Default Password**
   - The default admin password is `Admin@123456`
   - Change it immediately after first login
   - Go to Profile → Change Password

2. **Protect Admin Credentials**
   - Never commit admin credentials to git
   - Use strong passwords in production
   - Enable MFA for admin accounts

3. **Monitor Admin Access**
   - All admin actions are logged in audit trail
   - Review logs regularly for suspicious activity
   - Check Firestore `audit_events` collection

4. **Production Deployment**
   - Remove the `create-admin-user.js` script before deploying
   - Create admin users through secure admin panel
   - Use environment-specific admin accounts

---

## Admin User Management (Future)

Currently, admin users must be created manually. Future enhancements could include:

- Admin user management UI
- Role assignment interface
- Permission management
- Admin invitation system
- Multi-level admin roles (super admin, admin, moderator)

---

## Quick Reference

| Page | URL | Access |
|------|-----|--------|
| Login | `/login.html` | Everyone |
| Dashboard | `/dashboard.html` | Authenticated |
| Admin Dashboard | `/admin-dashboard.html` | Admin only |
| Medical Records | `/medical-records.html` | Admin only |
| Billing | `/billing.html` | Admin only |
| Appointments | `/appointments.html` | Everyone |
| Profile | `/patient-profile.html` | Everyone |

---

## Need Help?

If you're still having trouble accessing admin pages:

1. Check that the server is running (`npm run dev`)
2. Verify Firebase is connected (check server logs)
3. Confirm admin user exists in Firestore
4. Check browser console for errors (F12)
5. Review audit logs in Firestore for access attempts

---

**Ready to get started?**

Run: `node create-admin-user.js` and follow the steps above!
