# 🚀 Quick Start Guide - Orthopedic's Care

**Get started in 3 minutes!**

---

## ✅ System is Ready!

Your server is already running on **http://localhost:3000**

---

## 🎯 Test the System Now

### 1️⃣ View the Landing Page
Open your browser and go to:
```
http://localhost:3000
```

You'll see the beautiful SHA Kenya-inspired landing page with:
- Hero section with gradient background
- Features grid (6 cards)
- Services section with images
- Call-to-action section
- Professional footer

---

### 2️⃣ Test Registration

**Step-by-step:**

1. Click **"Register now"** button on landing page
   - Or go directly to: http://localhost:3000/register.html

2. **Step 1 - Citizenship:**
   - Select "Kenyan Citizen"
   - Choose "National ID"
   - Enter any ID number (e.g., "12345678")
   - Click "Next"

3. **Step 2 - Personal Info:**
   - First Name: John
   - Last Name: Doe
   - Date of Birth: 1990-01-01
   - Gender: Male
   - Click "Next"

4. **Step 3 - Location:**
   - Country: Kenya
   - County: Nairobi
   - Constituency: Westlands
   - Ward: Kitisuru
   - Address: "123 Main Street"
   - Click "Next"

5. **Step 4 - Contact:**
   - Phone: +254 700 000 000
   - Email: john.doe@example.com
   - Click "Next"

6. **Step 5 - Dependants:**
   - Skip this (optional)
   - Click "Next"

7. **Step 6 - Security:**
   - Password: Test@1234
   - Confirm Password: Test@1234
   - Check "I accept the Terms and Conditions"
   - Click "Complete Registration"

8. **Success!**
   - You'll be auto-logged in
   - Redirected to dashboard

---

### 3️⃣ Test Login

1. Go to: http://localhost:3000/login.html

2. Enter credentials:
   - Email: john.doe@example.com
   - Password: Test@1234

3. Click "Sign In"

4. You'll be redirected to dashboard

---

### 4️⃣ Test Password Reset

1. Go to: http://localhost:3000/forgot-password.html

2. Enter email: john.doe@example.com

3. Click "Send Reset Link"

4. **Check your server terminal/console** - you'll see:
   ```
   📧 ========== EMAIL (Console Mode) ==========
   To: john.doe@example.com
   Subject: Password Reset Request
   Reset link: http://localhost:3000/reset-password.html?token=abc123...
   ============================================
   ```

5. **Copy the reset link** from console

6. **Paste in browser** and press Enter

7. Enter new password: NewTest@1234

8. Click "Reset Password"

9. Login with new password

---

## 📧 Enable Email Sending (Optional)

Currently, password reset links are shown in the console. To send actual emails:

### Quick Setup (5 minutes):

1. **Enable 2FA on Gmail:**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - App: Mail
   - Device: Other (Custom name) → "Orthopedic Care"
   - Click "Generate"
   - Copy the 16-character password

3. **Update .env file:**
   ```env
   EMAIL_USER=your.email@gmail.com
   EMAIL_PASSWORD=abcd efgh ijkl mnop
   ```

4. **Restart server:**
   - Press Ctrl+C in terminal
   - Run: `npm run dev`

5. **Test:**
   - Request password reset
   - Check your email inbox!

**Detailed instructions:** See `EMAIL_SETUP_GUIDE.md`

---

## 🎨 Explore the Pages

### Landing Page
```
http://localhost:3000
```
- Hero section with animations
- Features grid
- Services section
- CTA section
- Footer

### Registration
```
http://localhost:3000/register.html
```
- 6-step registration form
- Progress indicator
- Validation
- Kenya location data

### Login
```
http://localhost:3000/login.html
```
- Email/password login
- Forgot password link
- Auto-redirect to dashboard

### Dashboard
```
http://localhost:3000/dashboard.html
```
- User information
- Quick stats
- Upcoming appointments
- Blue/purple gradient theme

### Forgot Password
```
http://localhost:3000/forgot-password.html
```
- Email input
- Reset link generation

### Reset Password
```
http://localhost:3000/reset-password.html?token=...
```
- New password input
- Token validation
- Password update

---

## 🔍 Check Server Status

### View Server Logs
Look at your terminal/console where you ran `npm run dev`

You'll see:
- ✅ Firebase connected
- ⚠️ Email in console mode
- ⚠️ Redis not connected (optional)
- 🚀 Server running on port 3000
- 📋 Available endpoints

### Health Check
```
http://localhost:3000/health
```

### Test API Endpoints

**Register (POST):**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234",
    "firstName": "Test",
    "lastName": "User",
    "dateOfBirth": "1990-01-01",
    "phoneNumber": "+254 700 000 000",
    "country": "Kenya",
    "county": "Nairobi",
    "constituency": "Westlands",
    "ward": "Kitisuru",
    "address": "123 Main St"
  }'
```

**Login (POST):**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test@1234"
  }'
```

---

## 🎯 Common Tasks

### Stop Server
Press `Ctrl+C` in the terminal

### Start Server
```bash
npm run dev
```

### View Firebase Data
1. Go to: https://console.firebase.google.com/
2. Select project: "orthopedic-care"
3. Click "Firestore Database"
4. View collections: users, sessions, password_reset_tokens

### Clear All Data
In Firebase Console:
1. Go to Firestore Database
2. Select collection (e.g., "users")
3. Delete documents

---

## 🐛 Troubleshooting

### Registration fails with 400 error
**Solution:** Make sure all required fields are filled:
- email, password, firstName, lastName, dateOfBirth, phoneNumber

### Login fails
**Possible causes:**
1. Wrong email/password
2. Account locked (3 failed attempts)
3. User doesn't exist

**Solution:** 
- Check credentials
- Wait 15 minutes if locked
- Register new account

### Password reset link doesn't work
**Possible causes:**
1. Token expired (1 hour limit)
2. Token already used
3. Invalid token

**Solution:**
- Request new reset link
- Use link within 1 hour
- Each link works only once

### Server won't start
**Solution:**
```bash
# Kill any process using port 3000
netstat -ano | findstr :3000
taskkill /PID <process_id> /F

# Start server again
npm run dev
```

---

## 📚 Documentation

- `SYSTEM_STATUS.md` - Complete system status and features
- `EMAIL_SETUP_GUIDE.md` - Email configuration guide
- `FIREBASE_MIGRATION_COMPLETE.md` - Firebase setup details
- `FORGOT_PASSWORD_FEATURE.md` - Password reset feature
- `USER_GUIDE.md` - User guide
- `README.md` - Project overview

---

## ✅ Checklist

- [x] Server running on port 3000
- [x] Firebase Firestore connected
- [x] Landing page accessible
- [x] Registration working
- [x] Login working
- [x] Password reset working (console mode)
- [ ] Email sending (optional - needs Gmail App Password)

---

## 🎉 You're All Set!

Your Orthopedic's Care portal is ready to use!

**Next steps:**
1. Test registration with your own data
2. Explore all pages
3. (Optional) Enable email sending
4. Start customizing for your needs

**Need help?** Check the documentation files or review server logs.

---

**Server:** 🟢 http://localhost:3000  
**Status:** ✅ READY  
**Database:** 🟢 Firebase Firestore  
**Email:** 🟡 Console Mode

**Happy coding! 🚀**
