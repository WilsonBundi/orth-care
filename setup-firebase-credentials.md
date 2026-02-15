# 🔑 Firebase Credentials Setup

## You Need Firebase Credentials to Connect

Your Project ID is set correctly (`orthopedic-care`), but Firebase needs authentication credentials to access your database.

---

## ✅ EASIEST METHOD: Service Account JSON

### Step 1: Get Service Account JSON

1. Go to Firebase Console: https://console.firebase.google.com/
2. Select your project: **orthopedic-care**
3. Click the **gear icon ⚙️** → **Project settings**
4. Click the **"Service accounts"** tab
5. Click **"Generate new private key"** button
6. Click **"Generate key"** in the popup
7. A JSON file will download (e.g., `orthopedic-care-firebase-adminsdk-xxxxx.json`)

### Step 2: Copy JSON Content

1. Open the downloaded JSON file in a text editor
2. Copy the ENTIRE content (it looks like this):

```json
{
  "type": "service_account",
  "project_id": "orthopedic-care",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@orthopedic-care.iam.gserviceaccount.com",
  "client_id": "123456789",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### Step 3: Update .env File

Open your `.env` file and update it like this:

```env
# Firebase Configuration - Use Service Account
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"orthopedic-care","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@orthopedic-care.iam.gserviceaccount.com","client_id":"123456789","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/..."}

# You can remove or comment out FIREBASE_PROJECT_ID
# FIREBASE_PROJECT_ID=orthopedic-care
```

**IMPORTANT**: 
- Put the ENTIRE JSON on ONE line
- No line breaks inside the JSON
- Keep all the quotes and special characters

### Step 4: Save and Test

1. Save the `.env` file
2. Run: `npm run dev`
3. You should see: ✅ Firebase Firestore initialized successfully

---

## ⚠️ SECURITY WARNING

**NEVER commit the service account JSON to Git!**

The `.env` file should already be in `.gitignore`, but double-check:

1. Open `.gitignore`
2. Make sure it contains: `.env`
3. Never share your service account JSON publicly

---

## 🔄 Alternative: Save JSON as Separate File

If the one-line JSON is too messy, you can save it as a file:

### Step 1: Save JSON File

1. Save the downloaded JSON file as: `firebase-credentials.json`
2. Put it in your project root (same folder as `.env`)

### Step 2: Update .env

```env
# Firebase Configuration - Use JSON file path
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json
```

### Step 3: Update firebase.ts

I'll need to modify `src/config/firebase.ts` to support file paths. Let me know if you want this option.

---

## 📋 Quick Checklist

- [ ] Go to Firebase Console
- [ ] Project Settings → Service Accounts
- [ ] Generate new private key
- [ ] Download JSON file
- [ ] Copy entire JSON content
- [ ] Paste into .env as FIREBASE_SERVICE_ACCOUNT=...
- [ ] Save .env file
- [ ] Run npm run dev
- [ ] See success message

---

## 🆘 Troubleshooting

### Error: "Could not load the default credentials"
**Solution**: You need to set FIREBASE_SERVICE_ACCOUNT in .env

### Error: "Invalid service account"
**Solution**: Make sure the JSON is on ONE line with no line breaks

### Error: "Permission denied"
**Solution**: Make sure Firestore is enabled in Firebase Console

---

## ✅ What to Do Next

Once you have the service account JSON:

1. Copy it
2. Tell me "I have the JSON"
3. I'll help you format it correctly for the .env file
4. We'll test the connection

---

**Need help? Just paste your JSON here (I'll help format it) or tell me if you're stuck on any step!**
