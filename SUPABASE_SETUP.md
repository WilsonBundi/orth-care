# 🔥 Supabase Setup Guide for Patient Portal

Complete guide to set up your Patient Portal with Supabase PostgreSQL database.

## Why Supabase?

- ✅ **Free tier**: 500MB storage, 2 projects
- ✅ **PostgreSQL 15+**: Latest features
- ✅ **Built-in features**: Authentication, Storage, Real-time
- ✅ **Connection pooling**: Better performance
- ✅ **Auto backups**: Daily backups included
- ✅ **Dashboard**: Easy database management
- ✅ **No credit card**: Free tier doesn't require payment info

---

## Step-by-Step Setup

### Step 1: Create Supabase Account (2 minutes)

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"**
3. Sign up with GitHub, Google, or email
4. Verify your email if required

### Step 2: Create New Project (2 minutes)

1. Click **"New Project"**
2. Fill in the details:
   - **Name**: `patient-portal` (or any name you prefer)
   - **Database Password**: Create a strong password (SAVE THIS!)
   - **Region**: Choose closest to you (e.g., `US West`, `EU Central`)
   - **Pricing Plan**: Select **"Free"**
3. Click **"Create new project"**
4. Wait 2-3 minutes for database provisioning

### Step 3: Get Connection String (1 minute)

1. Once project is ready, go to **Settings** (gear icon in sidebar)
2. Click **"Database"** in the left menu
3. Scroll down to **"Connection string"** section
4. Select the **"URI"** tab (not "Connection pooling" yet)
5. You'll see something like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
6. **Important**: Replace `[YOUR-PASSWORD]` with the actual password you created in Step 2

**Example:**
```
postgresql://postgres:MySecurePass123!@db.abcdefghijk.supabase.co:5432/postgres
```

### Step 4: Configure Your Application (1 minute)

1. In your project folder, copy the example environment file:
   ```bash
   copy .env.example .env
   ```

2. Open `.env` in your editor and add your Supabase connection string:
   ```env
   # Supabase Database
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # Session Configuration
   SESSION_SECRET=change-this-to-random-string-12345
   
   # Logging
   LOG_LEVEL=info
   ```

3. **Important**: Comment out or remove the local database settings:
   ```env
   # DB_HOST=localhost
   # DB_PORT=5432
   # DB_NAME=patient_portal
   # DB_USER=postgres
   # DB_PASSWORD=postgres
   ```

### Step 5: Install Dependencies (if not done)

```bash
npm install
```

### Step 6: Build the Project

```bash
npm run build
```

### Step 7: Run Database Migrations

This creates all the tables (users, sessions, audit_events, permissions):

```bash
npm run migrate
```

You should see:
```
Database connection successful (cloud)
Running migrations...
✓ Created users table
✓ Created sessions table
✓ Created audit_events table
✓ Created permissions table
Migrations completed successfully!
```

### Step 8: Seed Initial Data

This adds the default PATIENT role permissions:

```bash
npm run seed
```

You should see:
```
Seeding permissions...
✓ Added 5 permissions for PATIENT role
Seeding completed!
```

### Step 9: Start the Server

```bash
npm run dev
```

You should see:
```
Database connection successful (cloud)
🚀 Server is running on http://localhost:3000
```

### Step 10: Access Your Application

Open your browser and go to:
```
http://localhost:3000
```

You'll be redirected to the login page. Click **"Register here"** to create your first patient account!

---

## Verify Database in Supabase Dashboard

1. Go back to your Supabase project dashboard
2. Click **"Table Editor"** in the sidebar
3. You should see 4 tables:
   - `users`
   - `sessions`
   - `audit_events`
   - `permissions`

4. Click on `permissions` table to verify the seeded data

---

## Using Connection Pooling (Recommended for Production)

For better performance, use Supabase's connection pooling:

1. In Supabase Dashboard → Settings → Database
2. Find **"Connection pooling"** section
3. Copy the **"Connection string"** (it will have `pooler` in the URL)
4. Update your `.env`:
   ```env
   DATABASE_URL=postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
   ```

**Note**: The pooler URL is different from the direct connection URL.

---

## Testing Your Setup

### Test 1: Health Check

```bash
# Start the server
npm run dev

# In another terminal:
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### Test 2: Register a Patient

1. Go to `http://localhost:3000`
2. Click "Register here"
3. Fill in the form:
   - Email: `test@example.com`
   - Password: `Test123!@#` (meets all requirements)
   - First Name: `John`
   - Last Name: `Doe`
   - Date of Birth: Select a date
   - Gender: Select one
   - Phone: `+1234567890`
4. Click "Register"

### Test 3: Login

1. Use the credentials you just created
2. You should see the dashboard

### Test 4: Check Database

1. Go to Supabase Dashboard → Table Editor
2. Click on `users` table
3. You should see your newly created user
4. Click on `audit_events` table
5. You should see registration and login events

---

## Supabase Features You Can Use

### 1. SQL Editor

Run custom queries:
1. Go to **SQL Editor** in Supabase Dashboard
2. Try this query:
   ```sql
   SELECT * FROM users;
   ```

### 2. Database Backups

Automatic daily backups are included in the free tier!

### 3. Database Logs

View real-time database logs:
1. Go to **Logs** → **Database**
2. See all queries and connections

### 4. API Auto-Generation

Supabase automatically creates a REST API for your tables (optional to use).

---

## Environment Variables Reference

```env
# Required: Supabase Database Connection
DATABASE_URL=postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres

# Server Settings
PORT=3000
NODE_ENV=development

# Security (Change in production!)
SESSION_SECRET=your-random-secret-key-here

# Logging
LOG_LEVEL=info

# Optional: If using connection pooling
# DATABASE_URL=postgresql://postgres.xxx:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres
```

---

## Troubleshooting

### Issue: "Connection timeout"

**Solution:**
- Check your internet connection
- Verify the DATABASE_URL is correct
- Make sure you replaced `[YOUR-PASSWORD]` with actual password

### Issue: "Password authentication failed"

**Solution:**
- Double-check your database password
- Make sure there are no extra spaces in the connection string
- Try resetting the database password in Supabase Settings

### Issue: "SSL connection error"

**Solution:**
- Supabase requires SSL by default (this is good!)
- The code is already configured for SSL
- If issues persist, try adding `?sslmode=require` to the end of DATABASE_URL

### Issue: "Too many connections"

**Solution:**
- Use the connection pooling URL instead
- Close other applications connected to the database
- Restart your application

### Issue: "Tables already exist"

**Solution:**
If you need to reset the database:
1. Go to Supabase Dashboard → SQL Editor
2. Run this query:
   ```sql
   DROP TABLE IF EXISTS audit_events CASCADE;
   DROP TABLE IF EXISTS sessions CASCADE;
   DROP TABLE IF EXISTS permissions CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   ```
3. Run migrations again: `npm run migrate`

---

## Production Deployment Tips

### 1. Use Connection Pooling
Always use the pooler URL for production:
```env
DATABASE_URL=postgresql://postgres.xxx:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres
```

### 2. Environment Variables
Never commit `.env` to git. Use environment variables in your hosting platform.

### 3. Change SESSION_SECRET
Generate a strong random secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Enable Row Level Security (Optional)
For extra security, enable RLS in Supabase:
1. Go to Authentication → Policies
2. Enable RLS for sensitive tables

### 5. Monitor Usage
Check your Supabase dashboard regularly:
- Database size
- Number of connections
- Query performance

---

## Supabase Free Tier Limits

- **Storage**: 500MB
- **Bandwidth**: 2GB
- **Projects**: 2 active projects
- **Rows**: Unlimited
- **API Requests**: Unlimited
- **Backups**: Daily (7 days retention)

Perfect for development and small production apps!

---

## Upgrading to Pro (Optional)

If you need more resources:
- **Pro Plan**: $25/month
- **8GB storage**
- **50GB bandwidth**
- **Unlimited projects**
- **Daily backups (14 days retention)**
- **Point-in-time recovery**

---

## Next Steps

1. ✅ Create Supabase account
2. ✅ Create project and get DATABASE_URL
3. ✅ Configure `.env` file
4. ✅ Run migrations and seed
5. ✅ Start the server
6. ✅ Register and test the application
7. 🚀 Deploy to production (optional)

---

## Support & Resources

- **Supabase Docs**: https://supabase.com/docs
- **Supabase Discord**: https://discord.supabase.com
- **Project Docs**: See [README.md](README.md)
- **Cloud Setup**: See [CLOUD_DATABASE_SETUP.md](CLOUD_DATABASE_SETUP.md)

---

## Quick Commands Reference

```bash
# Setup
npm install
npm run build

# Database
npm run migrate    # Create tables
npm run seed       # Add initial data

# Development
npm run dev        # Start server

# Testing
npm test           # Run tests
npm run test:coverage  # With coverage

# Production
npm run build
npm start
```

---

Happy coding with Supabase! 🔥
