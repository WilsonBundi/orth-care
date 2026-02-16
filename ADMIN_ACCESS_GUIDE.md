# 🔐 Admin Access Guide - Quick Start

## TL;DR - Fastest Way to See Admin Pages

```bash
# 1. Create admin user
node create-admin-user.js

# 2. Start server
npm run dev

# 3. Open browser
# Go to: http://localhost:3000/login.html
# Login with: admin@orthopedicscare.com / Admin@123456

# 4. Done! You'll see admin options on dashboard
```

---

## Three Ways to Get Admin Access

### Method 1: Create New Admin User (Easiest)

```bash
node create-admin-user.js
```

Creates a new admin account:
- Email: `admin@orthopedicscare.com`
- Password: `Admin@123456`

### Method 2: Make Existing User Admin

```bash
node make-user-admin.js your-email@example.com
```

Converts your existing account to admin.

### Method 3: Manual (Firebase Console)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Open your project → Firestore Database
3. Find `users` collection → Your user document
4. Change `role` field from `patient` to `admin`
5. Save and logout/login

---

## What You'll See as Admin

### Dashboard Changes
**Patient sees:**
- Appointments
- My Profile

**Admin sees:**
- Appointments
- My Profile
- **📋 Medical Records** ← New!
- **💰 Billing & Invoices** ← New!
- **⚙️ Admin Dashboard** ← New!

### Admin Pages

| Page | URL | What You Can Do |
|------|-----|-----------------|
| Admin Dashboard | `/admin-dashboard.html` | Central admin hub |
| Medical Records | `/medical-records.html` | Upload/view patient records |
| Billing | `/billing.html` | Manage invoices & payments |

---

## Testing It Works

### ✅ Test 1: Login as Admin
```
1. Go to http://localhost:3000/login.html
2. Login with admin credentials
3. Dashboard should show 5 cards (not 2)
```

### ✅ Test 2: Access Admin Pages
```
1. Click "Medical Records" → Should load
2. Click "Billing" → Should load
3. Click "Admin Dashboard" → Should load
```

### ✅ Test 3: Patient Cannot Access
```
1. Logout
2. Login as regular patient
3. Try to access /medical-records.html
4. Should see: "Access denied: This page is restricted to administrators only"
5. Should redirect to dashboard
```

---

## Troubleshooting

### Problem: "Access denied" even as admin

**Solution:**
```javascript
// Open browser console (F12) and run:
localStorage.clear()
// Then logout and login again
```

### Problem: Admin cards not showing

**Check:**
1. Did you logout and login after making user admin?
2. Is the role actually 'admin' in Firebase?
3. Any errors in browser console (F12)?

### Problem: Script fails

**Check:**
1. Is `.env` file configured?
2. Is `FIREBASE_CREDENTIALS_BASE64` set?
3. Is server running?
4. Internet connection working?

---

## Security Reminders

⚠️ **Change default password immediately!**
⚠️ **Never commit admin credentials to git**
⚠️ **All admin actions are logged**

---

## Quick Commands Reference

```bash
# Create new admin user
node create-admin-user.js

# Make existing user admin
node make-user-admin.js email@example.com

# Start development server
npm run dev

# Build for production
npm run build
```

---

## Need More Help?

See detailed guide: `HOW_TO_ACCESS_ADMIN.md`

Or check the implementation docs:
- `.kiro/specs/admin-only-access-control/IMPLEMENTATION_COMPLETE.md`
- `ADMIN_SECTION_COMPLETE.md`

---

**Ready? Run `node create-admin-user.js` now!** 🚀
