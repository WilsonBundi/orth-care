# 📧 Email Setup Guide for Password Reset

## Current Status

✅ Email service is now integrated!
⚠️ Currently in **Console Mode** (emails shown in terminal)

To send actual emails, follow the setup below.

---

## 🚀 Quick Setup (Gmail - Recommended for Testing)

### Step 1: Enable 2-Factor Authentication on Gmail

1. Go to your Google Account: https://myaccount.google.com/
2. Click "Security" in the left sidebar
3. Under "Signing in to Google", click "2-Step Verification"
4. Follow the steps to enable it

### Step 2: Generate App Password

1. Go to: https://myaccount.google.com/apppasswords
2. Select app: "Mail"
3. Select device: "Other (Custom name)"
4. Enter name: "Orthopedic Care"
5. Click "Generate"
6. **Copy the 16-character password** (you won't see it again!)

### Step 3: Update .env File

Open your `.env` file and add:

```env
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

**Example:**
```env
EMAIL_USER=orthopediccare@gmail.com
EMAIL_PASSWORD=abcd efgh ijkl mnop
```

### Step 4: Restart Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

You should see:
```
✅ Email service configured (Gmail)
```

### Step 5: Test It!

1. Go to: http://localhost:3000/forgot-password.html
2. Enter your email
3. Check your email inbox for the reset link!

---

## 📧 How It Works Now

### Before (Console Mode):
```
⚠️  Email not configured. Reset links will be shown in console.

📧 ========== EMAIL (Console Mode) ==========
To: user@example.com
Subject: Password Reset Request
Reset link: http://localhost:3000/reset-password.html?token=abc123...
============================================
```

### After (Email Configured):
```
✅ Email service configured (Gmail)
✅ Email sent to user@example.com: <message-id>
```

User receives a beautiful HTML email with:
- Professional design matching your site
- Big "Reset Password" button
- Clickable link
- Security warnings
- 1-hour expiration notice

---

## 🎨 Email Template Features

The password reset email includes:

✅ **Professional Design**
- Gradient header matching your site
- Clean, readable layout
- Mobile-responsive

✅ **Security Features**
- 1-hour expiration warning
- "Didn't request this?" notice
- No password change until user acts

✅ **User-Friendly**
- Big clickable button
- Copy-paste link option
- Clear instructions

---

## 🔧 Alternative Email Services

### Option 1: SendGrid (Production Recommended)

1. Sign up at: https://sendgrid.com/
2. Get API key
3. Update `.env`:
```env
SENDGRID_API_KEY=your-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

4. Update `EmailService.ts` to use SendGrid

### Option 2: AWS SES (Scalable)

1. Set up AWS SES
2. Verify your domain
3. Get SMTP credentials
4. Update transporter in `EmailService.ts`

### Option 3: Mailgun

1. Sign up at: https://www.mailgun.com/
2. Get API credentials
3. Update `EmailService.ts`

---

## 🧪 Testing Without Email

If you don't want to set up email yet, the system works fine in Console Mode:

1. Request password reset
2. Check server terminal/console
3. Copy the reset link
4. Paste in browser
5. Reset password

---

## 🔒 Security Notes

### Gmail App Passwords:
- ✅ More secure than regular password
- ✅ Can be revoked anytime
- ✅ Specific to one app
- ❌ Don't share or commit to Git

### .env File:
- ✅ Already in `.gitignore`
- ❌ Never commit to Git
- ❌ Never share publicly

---

## 📊 Email Service Status

Check server startup logs:

```bash
# Email configured:
✅ Email service configured (Gmail)

# Email not configured:
⚠️  Email not configured. Reset links will be shown in console.
```

---

## 🆘 Troubleshooting

### Error: "Invalid login"
**Solution**: Make sure you're using an App Password, not your regular Gmail password

### Error: "Less secure app access"
**Solution**: Use App Password instead (requires 2FA enabled)

### Emails not arriving
**Solutions**:
1. Check spam folder
2. Verify EMAIL_USER is correct
3. Verify App Password is correct (no spaces)
4. Check server logs for errors

### Still showing in console
**Solution**: 
1. Verify .env has EMAIL_USER and EMAIL_PASSWORD
2. Restart server
3. Check for "✅ Email service configured" message

---

## ✅ Quick Checklist

- [ ] Gmail 2FA enabled
- [ ] App Password generated
- [ ] EMAIL_USER added to .env
- [ ] EMAIL_PASSWORD added to .env
- [ ] Server restarted
- [ ] Saw "✅ Email service configured" message
- [ ] Tested password reset
- [ ] Email received in inbox

---

## 🎉 You're Done!

Once configured, users will receive professional password reset emails automatically!

**Current Mode**: Check your server console on startup to see if email is configured.

---

**Need help? Check the server logs or test in Console Mode first!**
