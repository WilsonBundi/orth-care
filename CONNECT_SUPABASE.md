# Connect Your Existing Supabase Organization

Quick guide to create a project in your existing Supabase organization and connect it to the Patient Portal.

## Step 1: Create New Project (2 minutes)

1. Go to your Supabase dashboard: [app.supabase.com](https://app.supabase.com)
2. Select your organization
3. Click **"New Project"**
4. Fill in:
   - **Name**: `patient-portal` (or your preferred name)
   - **Database Password**: Create a strong password
     - **IMPORTANT**: Save this password! You'll need it for the connection string
     - Example: `MySecure123!Pass`
   - **Region**: Choose closest to you
   - **Pricing Plan**: Free (or your preferred plan)
5. Click **"Create new project"**
6. Wait 2-3 minutes for provisioning

## Step 2: Get Your Connection String (30 seconds)

1. Once the project is ready, click **Settings** (gear icon in left sidebar)
2. Click **"Database"** in the settings menu
3. Scroll to **"Connection string"** section
4. Click the **"URI"** tab
5. Copy the connection string - it looks like:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
   ```
6. Replace `[YOUR-PASSWORD]` with the actual password you created in Step 1

**Example:**
```
postgresql://postgres:MySecure123!Pass@db.abcdefghijk.supabase.co:5432/postgres
```

## Step 3: Update Your .env File (30 seconds)

Open the `.env` file in your project and update the `DATABASE_URL`:

```env
DATABASE_URL=postgresql://postgres:YOUR_ACTUAL_PASSWORD@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

**Full .env example:**
```env
# Your Supabase connection string
DATABASE_URL=postgresql://postgres:MySecure123!Pass@db.abcdefghijk.supabase.co:5432/postgres

# Server settings
PORT=3000
NODE_ENV=development

# Change this to a random string
SESSION_SECRET=my-random-secret-key-12345

# Logging
LOG_LEVEL=info
```

## Step 4: Install & Build (1 minute)

```bash
npm install
npm run build
```

## Step 5: Create Database Tables (30 seconds)

```bash
npm run migrate
```

Expected output:
```
Database connection successful (cloud)
Running migrations...
✓ Created users table
✓ Created sessions table
✓ Created audit_events table
✓ Created permissions table
Migrations completed successfully!
```

## Step 6: Seed Initial Data (30 seconds)

```bash
npm run seed
```

Expected output:
```
Seeding permissions...
✓ Added 5 permissions for PATIENT role
Seeding completed!
```

## Step 7: Start the Server (10 seconds)

```bash
npm run dev
```

Expected output:
```
Database connection successful (cloud)
🚀 Server is running on http://localhost:3000
📊 Health check: http://localhost:3000/health
```

## Step 8: Test It! (1 minute)

1. Open browser: `http://localhost:3000`
2. You'll see the login page
3. Click **"Register here"**
4. Fill in the registration form:
   - Email: `test@example.com`
   - Password: `Test123!@#` (meets all requirements)
   - Fill in other fields
5. Click **"Register"**
6. You should be redirected to the dashboard!

## Verify in Supabase Dashboard

1. Go back to Supabase dashboard
2. Click **"Table Editor"** in the left sidebar
3. You should see 4 tables:
   - ✅ `users` - Your registered user should be here
   - ✅ `sessions` - Active session
   - ✅ `audit_events` - Registration and login events
   - ✅ `permissions` - 5 PATIENT role permissions

## Optional: Use Connection Pooling (Better Performance)

For better performance, especially in production:

1. In Supabase: Settings → Database
2. Find **"Connection pooling"** section
3. Copy the pooler connection string (has `pooler` in the URL)
4. Update your `.env`:
   ```env
   DATABASE_URL=postgresql://postgres.xxxxxxxxxxxxx:PASSWORD@aws-0-us-west-1.pooler.supabase.com:5432/postgres
   ```

## Quick Commands Reference

```bash
# First time setup
npm install
npm run build
npm run migrate
npm run seed

# Start development
npm run dev

# Run tests
npm test

# Production
npm run build
npm start
```

## Troubleshooting

### "Connection failed"
- Check internet connection
- Verify DATABASE_URL is correct
- Make sure password has no spaces
- Ensure project is fully provisioned (wait a few minutes)

### "Password authentication failed"
- Double-check the password in your connection string
- Make sure you replaced `[YOUR-PASSWORD]` with actual password
- No extra spaces or special characters that need escaping

### "Tables already exist"
If you need to reset:
1. Go to Supabase → SQL Editor
2. Run:
   ```sql
   DROP TABLE IF EXISTS audit_events CASCADE;
   DROP TABLE IF EXISTS sessions CASCADE;
   DROP TABLE IF EXISTS permissions CASCADE;
   DROP TABLE IF EXISTS users CASCADE;
   ```
3. Run `npm run migrate` again

## What's Next?

- ✅ Register users and test the system
- ✅ Check audit logs in Supabase Table Editor
- ✅ Explore the dashboard features
- ✅ Run tests: `npm test`
- ✅ Review the code structure
- 🚀 Deploy to production when ready

## Need Help?

- 📖 Full Supabase guide: [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- ⚡ Quick reference: [SUPABASE_QUICK_REFERENCE.md](SUPABASE_QUICK_REFERENCE.md)
- 📖 Main README: [README.md](README.md)

---

**Total setup time: ~5 minutes** ⚡

You're all set! Your Patient Portal is now connected to Supabase! 🔥
