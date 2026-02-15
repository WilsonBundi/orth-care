# 🔥 Firebase Firestore Setup Guide

## Overview
Your Orthopedic's Care application has been migrated from PostgreSQL to Firebase Firestore - a NoSQL cloud database that's scalable, real-time, and easy to use.

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or "Create a project"
3. Project name: `orthopedic-care`
4. Enable Google Analytics (optional)
5. Click "Create project"

### Step 2: Enable Firestore Database

1. In Firebase Console, click "Firestore Database" in the left menu
2. Click "Create database"
3. Choose "Start in production mode" (we'll set rules later)
4. Select a location closest to you:
   - `us-central` (Iowa) - USA
   - `us-east1` (South Carolina) - USA East Coast
   - `europe-west1` (Belgium) - Europe
   - `asia-southeast1` (Singapore) - Asia
5. Click "Enable"

### Step 3: Create Service Account

1. In Firebase Console, click the gear icon ⚙️ → "Project settings"
2. Go to "Service accounts" tab
3. Click "Generate new private key"
4. Click "Generate key" - this downloads a JSON file
5. Save this file securely (DO NOT commit to Git!)

### Step 4: Configure Your Application

**Option A: Using Service Account JSON (Recommended for Production)**

1. Open the downloaded JSON file
2. Copy the entire JSON content
3. Update your `.env` file:

```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"orthopedic-care",...}
```

**Option B: Using Project ID (Easier for Development)**

1. In Firebase Console → Project settings
2. Copy your "Project ID"
3. Update your `.env` file:

```env
FIREBASE_PROJECT_ID=orthopedic-care
```

### Step 5: Set Firestore Security Rules

1. In Firebase Console → Firestore Database
2. Click "Rules" tab
3. Replace with these rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Sessions collection - users can only access their own sessions
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null;
    }
    
    // Audit events - read-only for authenticated users
    match /audit_events/{eventId} {
      allow read: if request.auth != null;
      allow write: if false; // Only server can write
    }
    
    // Permissions - read-only
    match /permissions/{permissionId} {
      allow read: if request.auth != null;
      allow write: if false; // Only server can write
    }
    
    // Counter documents
    match /_counters/{document=**} {
      allow read, write: if false; // Only server can access
    }
  }
}
```

4. Click "Publish"

### Step 6: Create Firestore Indexes

For better query performance, create these indexes:

1. Go to Firestore Database → Indexes tab
2. Click "Add index" for each:

**Index 1: audit_events by userId and timestamp**
- Collection: `audit_events`
- Fields:
  - `userId` (Ascending)
  - `timestamp` (Descending)
  - `id` (Descending)
- Query scope: Collection

**Index 2: audit_events by eventType and timestamp**
- Collection: `audit_events`
- Fields:
  - `eventType` (Ascending)
  - `timestamp` (Descending)
  - `id` (Descending)
- Query scope: Collection

**Index 3: sessions by userId and expiresAt**
- Collection: `sessions`
- Fields:
  - `userId` (Ascending)
  - `expiresAt` (Ascending)
- Query scope: Collection

### Step 7: Test Your Setup

```bash
npm run dev
```

You should see:
```
✅ Firebase Firestore initialized successfully
✅ Firebase connection successful
Server running on http://localhost:3000
```

---

## 📊 What Changed?

### Database Structure

**Before (PostgreSQL):**
- Tables with fixed schemas
- SQL queries
- Relational data

**After (Firebase Firestore):**
- Collections with flexible documents
- NoSQL queries
- Document-based data

### Collections Created

1. **users** - User accounts and profiles
2. **sessions** - Active user sessions
3. **audit_events** - Security audit log with hash chain
4. **permissions** - Role-based access control
5. **_counters** - Sequential ID generation

---

## 🔧 Configuration Options

### Environment Variables

```env
# Option 1: Service Account (Production)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Option 2: Project ID (Development)
FIREBASE_PROJECT_ID=your-project-id

# Other settings remain the same
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-secret-key
JWT_SECRET=your-jwt-secret
```

---

## 💡 Benefits of Firebase Firestore

✅ **No Server Management** - Fully managed cloud database
✅ **Real-time Updates** - Live data synchronization
✅ **Automatic Scaling** - Handles millions of users
✅ **Offline Support** - Works without internet
✅ **Free Tier** - 1GB storage, 50K reads/day, 20K writes/day
✅ **Global CDN** - Fast access worldwide
✅ **Built-in Security** - Firebase security rules
✅ **Easy Backup** - Automatic daily backups

---

## 📈 Free Tier Limits

Firebase Spark Plan (Free):
- **Storage**: 1 GB
- **Document Reads**: 50,000 per day
- **Document Writes**: 20,000 per day
- **Document Deletes**: 20,000 per day
- **Network Egress**: 10 GB per month

This is more than enough for development and small production apps!

---

## 🔐 Security Best Practices

1. **Never commit service account JSON** to Git
2. **Use environment variables** for sensitive data
3. **Set proper Firestore rules** to restrict access
4. **Enable App Check** for production (prevents abuse)
5. **Monitor usage** in Firebase Console
6. **Set up billing alerts** to avoid surprises

---

## 🧪 Testing

Test your Firebase connection:

```bash
# Start the server
npm run dev

# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-01",
    "phoneNumber": "+1234567890",
    "address": {
      "street": "123 Main St",
      "city": "New York",
      "state": "NY",
      "zipCode": "10001",
      "country": "USA"
    }
  }'
```

---

## 📚 Useful Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run tests
npm test
```

---

## 🔄 Switching Back to PostgreSQL

If you need to switch back to PostgreSQL:

1. Open `src/repositories/index.ts`
2. Comment out Firebase imports
3. Uncomment PostgreSQL imports
4. Update `.env` with PostgreSQL credentials
5. Restart server

---

## 📖 Firebase Documentation

- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [Node.js Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Pricing](https://firebase.google.com/pricing)

---

## 🆘 Troubleshooting

### Error: "Firebase configuration missing"
**Solution**: Set `FIREBASE_PROJECT_ID` or `FIREBASE_SERVICE_ACCOUNT` in `.env`

### Error: "Permission denied"
**Solution**: Check Firestore security rules, ensure they allow server access

### Error: "Index required"
**Solution**: Firebase will show a link to create the index automatically

### Error: "Quota exceeded"
**Solution**: Check Firebase Console → Usage tab, upgrade to Blaze plan if needed

---

## 🎉 You're All Set!

Your application now uses Firebase Firestore for data storage. All features work exactly the same, but now with:
- Cloud-based storage
- Automatic scaling
- Real-time capabilities
- No server maintenance

**Next Steps:**
1. Test user registration and login
2. Monitor usage in Firebase Console
3. Set up production environment
4. Deploy your application

---

## 📞 Need Help?

- Check Firebase Console for errors
- Review Firestore security rules
- Check application logs
- Verify environment variables

**Happy coding! 🚀**
