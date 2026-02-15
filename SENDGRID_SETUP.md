# 📧 SendGrid Email Setup Guide

**Recommended for Production - Free up to 100 emails/day**

---

## Why SendGrid?

✅ **No per-client configuration needed**  
✅ **Free tier: 100 emails/day forever**  
✅ **Professional email delivery**  
✅ **Better deliverability than Gmail**  
✅ **Email analytics and tracking**  
✅ **No 2FA or App Passwords needed**

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Create SendGrid Account

1. Go to: https://signup.sendgrid.com/
2. Sign up with your email
3. Verify your email address
4. Complete the onboarding questions:
   - **Role:** Developer
   - **Company:** Your clinic name
   - **Use case:** Transactional emails
   - **Monthly volume:** 0-100 emails

### Step 2: Create API Key

1. After login, go to: https://app.sendgrid.com/settings/api_keys
2. Click **"Create API Key"**
3. Settings:
   - **Name:** Orthopedic Care Portal
   - **Permissions:** Full Access (or Restricted Access → Mail Send only)
4. Click **"Create & View"**
5. **COPY THE API KEY** (you won't see it again!)
   - It looks like: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 3: Verify Sender Email

1. Go to: https://app.sendgrid.com/settings/sender_auth/senders
2. Click **"Create New Sender"**
3. Fill in your details:
   - **From Name:** Orthopedic's Care
   - **From Email:** noreply@yourdomain.com (or your Gmail)
   - **Reply To:** support@yourdomain.com (or your Gmail)
   - **Company Address:** Your clinic address
4. Click **"Create"**
5. **Check your email** and verify the sender

### Step 4: Update .env File

Open your `.env` file and add:

```env
# SendGrid Configuration (Recommended)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@yourdomain.com
```

**Replace with:**
- Your actual API key from Step 2
- Your verified sender email from Step 3

### Step 5: Restart Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

You should see:
```
✅ Email service configured (SendGrid)
```

### Step 6: Test It!

1. Go to: http://localhost:3000/forgot-password.html
2. Enter your email
3. **Check your inbox** - email should arrive in seconds!

---

## 📊 SendGrid Free Tier Limits

| Feature | Free Tier |
|---------|-----------|
| Emails per day | 100 |
| Emails per month | 3,000 |
| Cost | $0 forever |
| Email validation | ✅ Yes |
| Analytics | ✅ Yes |
| API access | ✅ Yes |
| Support | Community |

**Perfect for:**
- Small clinics
- Testing and development
- Up to 100 patients per day

---

## 🔧 Alternative: Use Your Domain Email

If you have a custom domain (e.g., orthopediccare.com):

### Option 1: Domain Authentication (Best)

1. In SendGrid, go to: https://app.sendgrid.com/settings/sender_auth
2. Click **"Authenticate Your Domain"**
3. Follow the DNS setup instructions
4. This allows you to send from: `noreply@yourdomain.com`

### Option 2: Single Sender Verification (Quick)

1. Use any email you control
2. Verify it in SendGrid
3. Use it as the sender

---

## 🎯 Email Provider Priority

The system now tries providers in this order:

1. **SendGrid** (if SENDGRID_API_KEY is set)
   - Best for production
   - No per-client setup needed
   - Professional delivery

2. **Gmail** (if EMAIL_USER and EMAIL_PASSWORD are set)
   - Good for development
   - Requires App Password
   - 500 emails/day limit

3. **Console Mode** (fallback)
   - Shows links in terminal
   - Good for testing
   - No email actually sent

---

## 📧 Current Configuration

Check your `.env` file:

```env
# Option 1: SendGrid (Recommended) ⭐
SENDGRID_API_KEY=SG.your-api-key-here
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Option 2: Gmail (Alternative)
EMAIL_USER=your.email@gmail.com
EMAIL_PASSWORD=your-app-password

# Option 3: Console Mode (Default)
# Leave both empty for console mode
```

---

## 🔍 Verify Setup

### Check Server Logs

When you start the server, you'll see one of:

```bash
# SendGrid configured ✅
✅ Email service configured (SendGrid)

# Gmail configured ✅
✅ Email service configured (Gmail)

# Console mode ⚠️
⚠️  No email provider configured. Using console mode.
📧 To enable email sending:
   Option 1 (Recommended): Add SENDGRID_API_KEY to .env
   Option 2: Add EMAIL_USER and EMAIL_PASSWORD to .env
```

### Test Email Sending

1. Request password reset
2. Check:
   - **SendGrid:** Email arrives in inbox
   - **Gmail:** Email arrives in inbox
   - **Console:** Link shown in terminal

---

## 🚨 Troubleshooting

### "API key not valid"
**Solution:** 
- Check API key is copied correctly
- No extra spaces or quotes
- Key starts with `SG.`

### "Sender email not verified"
**Solution:**
- Go to SendGrid sender verification
- Check your email for verification link
- Click to verify

### Emails going to spam
**Solution:**
- Set up domain authentication
- Add SPF and DKIM records
- Use a professional sender name

### Still using console mode
**Solution:**
- Check .env file has SENDGRID_API_KEY
- Restart server after adding key
- Check for typos in variable name

---

## 📈 Upgrade Options

### If you need more than 100 emails/day:

| Plan | Emails/Month | Cost |
|------|--------------|------|
| Free | 3,000 | $0 |
| Essentials | 50,000 | $19.95/mo |
| Pro | 100,000 | $89.95/mo |

**Most clinics stay on free tier!**

---

## 🎉 Benefits of This Setup

### For You (Developer):
- ✅ Set up once, works for all clients
- ✅ No per-client configuration
- ✅ Professional email delivery
- ✅ Email analytics included
- ✅ Easy to scale

### For Your Clients:
- ✅ Emails arrive instantly
- ✅ Professional sender name
- ✅ Better deliverability
- ✅ No spam folder issues
- ✅ No setup required

### For Patients:
- ✅ Receive emails reliably
- ✅ Professional appearance
- ✅ Fast delivery
- ✅ Works with all email providers

---

## 📝 Example .env Configuration

```env
# ============================================
# EMAIL CONFIGURATION
# ============================================

# SendGrid (Recommended for Production)
SENDGRID_API_KEY=SG.abc123def456ghi789jkl012mno345pqr678stu901vwx234yz
SENDGRID_FROM_EMAIL=noreply@orthopediccare.com

# Gmail (Alternative for Development)
# EMAIL_USER=your.email@gmail.com
# EMAIL_PASSWORD=your-app-password

# ============================================
# OTHER CONFIGURATIONS
# ============================================

# Firebase
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}
FIREBASE_PROJECT_ID=orthopedic-care

# Server
PORT=3000
NODE_ENV=production
APP_URL=https://yourdomain.com

# Session
SESSION_SECRET=your-random-secret-key
JWT_SECRET=your-jwt-secret-key
```

---

## 🔐 Security Best Practices

### DO:
- ✅ Keep API key in .env file
- ✅ Add .env to .gitignore
- ✅ Use environment variables in production
- ✅ Rotate API keys periodically
- ✅ Use restricted access (Mail Send only)

### DON'T:
- ❌ Commit API key to Git
- ❌ Share API key publicly
- ❌ Use same key for multiple projects
- ❌ Give full access if not needed

---

## 📞 Support

### SendGrid Documentation:
- Getting Started: https://docs.sendgrid.com/
- API Reference: https://docs.sendgrid.com/api-reference
- Troubleshooting: https://docs.sendgrid.com/ui/sending-email/troubleshooting-delays-and-latency

### Your Application:
- Check server logs for errors
- Test with console mode first
- Verify sender email in SendGrid
- Check spam folder if emails not arriving

---

## ✅ Quick Checklist

- [ ] Created SendGrid account
- [ ] Generated API key
- [ ] Verified sender email
- [ ] Added SENDGRID_API_KEY to .env
- [ ] Added SENDGRID_FROM_EMAIL to .env
- [ ] Restarted server
- [ ] Saw "✅ Email service configured (SendGrid)"
- [ ] Tested password reset
- [ ] Email arrived in inbox

---

## 🎊 You're Done!

Your email service is now configured for production use!

**Benefits:**
- ✅ Automatic email sending
- ✅ No client configuration needed
- ✅ Professional delivery
- ✅ Free for up to 100 emails/day
- ✅ Scalable when you grow

**Next Steps:**
1. Test with real users
2. Monitor SendGrid dashboard
3. Set up domain authentication (optional)
4. Upgrade plan if needed (later)

---

**Email Status:** 🟢 READY FOR PRODUCTION  
**Provider:** SendGrid  
**Cost:** $0/month (Free Tier)  
**Limit:** 100 emails/day

**Happy emailing! 📧**
