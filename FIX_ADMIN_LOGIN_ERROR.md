# Fix: "No account found with this email or ID"

## The Problem

You're seeing this error when trying to login with `admin@orthopedicscare.com`:

```
Account not found. Please check your credentials or register.
No account found with this email or ID
```

## The Solution

The admin user doesn't exist in Firebase yet. You need to create it first.

---

## Step-by-Step Fix

### 1. Stop the Server (if running)
Press `Ctrl+C` in the terminal where the server is running.

### 2. Create the Admin User

Run this command in your terminal:

```bash
node create-admin-user.js
```

You should see:
```
Creating admin user...
✅ Admin user created successfully!

📧 Email: admin@orthopedicscare.com
🔑 Password: Admin@123456

⚠️  IMPORTANT: Change the password after first login!

🚀 You can now login at: http://localhost:3000/login.html
   After login, you will see admin options on the dashboard
```

### 3. Start the Server Again

```bash
npm run dev
```

### 4. Login

Go to `http://localhost:3000/login.html` and use:
- **Email:** `admin@orthopedicscare.com`
- **Password:** `Admin@123456`

### 5. Success!

You should now:
- Login successfully
- See the dashboard with 5 cards (including admin options)
- Be able to access Medical Records, Billing, and Admin Dashboard

---

## If the Script Fails

### Error: "Cannot find module 'firebase-admin'"

**Solution:**
```bash
npm install
```

### Error: "FIREBASE_CREDENTIALS_BASE64 is not defined"

**Solution:**
Check your `.env` file has:
```
FIREBASE_CREDENTIALS_BASE64=your_base64_credentials_here
FIREBASE_PROJECT_ID=your_project_id_here
```

If missing, follow the Firebase setup guide in `FIREBASE_SETUP.md`

### Error: "Permission denied" or "Firestore error"

**Solution:**
1. Check your Firebase credentials are correct
2. Verify your Firebase project has Firestore enabled
3. Check your internet connection
4. Make sure the service account has proper permissions

---

## Alternative: Use Existing Account

If you already have a registered account and want to make it admin:

```bash
node make-user-admin.js your-email@example.com
```

Then:
1. Logout from the application
2. Clear browser cache (F12 → Console → `localStorage.clear()`)
3. Login again
4. You should see admin options

---

## Verify Admin User Exists

You can check if the admin user was created:

### Option 1: Firebase Console
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Firestore Database
4. Look for `users` collection
5. Find document with email `admin@orthopedicscare.com`
6. Check that `role` field is `admin`

### Option 2: Check via Script

Create `check-admin.js`:
```javascript
const admin = require('firebase-admin');
require('dotenv').config();

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf-8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = admin.firestore();

async function checkAdmin() {
  const users = await db.collection('users')
    .where('email', '==', 'admin@orthopedicscare.com')
    .get();
  
  if (users.empty) {
    console.log('❌ Admin user NOT found');
  } else {
    const user = users.docs[0].data();
    console.log('✅ Admin user found:');
    console.log('   Email:', user.email);
    console.log('   Role:', user.role);
    console.log('   Name:', user.firstName, user.lastName);
  }
  process.exit(0);
}

checkAdmin();
```

Run: `node check-admin.js`

---

## Still Having Issues?

### Check Server Logs

Look at the terminal where you ran `npm run dev`. You should see:
```
🚀 Orthopedic's Care Portal Server
📍 Running on http://localhost:3000
💾 Database: Firebase Firestore (your-project-id)
```

If you see errors about Firebase connection, fix those first.

### Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Try to login
4. Look for any error messages

Common errors:
- Network errors → Check if server is running
- 401 Unauthorized → Wrong password
- 404 Not Found → User doesn't exist (run create-admin-user.js)

### Test with Regular User First

If admin creation keeps failing, try:
1. Register a regular user through the UI
2. Use `make-user-admin.js` to upgrade them
3. Login with that account

---

## Quick Checklist

- [ ] Firebase credentials configured in `.env`
- [ ] Server is running (`npm run dev`)
- [ ] Ran `node create-admin-user.js` successfully
- [ ] Admin user exists in Firebase (check console)
- [ ] Using correct email: `admin@orthopedicscare.com`
- [ ] Using correct password: `Admin@123456`
- [ ] Browser cache cleared if needed

---

## Summary

The error means the admin user doesn't exist yet. Simply run:

```bash
node create-admin-user.js
```

Then login with the credentials shown. That's it!
