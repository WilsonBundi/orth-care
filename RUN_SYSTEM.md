# Quick Start Guide - Running the Patient Portal System

## IMPORTANT: Node.js PATH Issue Detected

Node.js is installed but not in your system PATH. You need to fix this first.

### Fix Node.js PATH (Choose ONE method):

**Method 1: Restart Your Terminal/IDE**
- Close all terminal windows and Kiro
- Reopen Kiro
- Try running commands again

**Method 2: Add Node.js to PATH Manually**
1. Open System Properties → Environment Variables
2. Find "Path" in System Variables
3. Add: `C:\Program Files\nodejs`
4. Click OK and restart terminal

**Method 3: Use Full Path**
```bash
"C:\Program Files\nodejs\node.exe" --version
"C:\Program Files\nodejs\npm.cmd" install
```

## Once Node.js PATH is Fixed:

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Setup Database

**Option A: Use Cloud Database (Recommended - No Installation Required)**

1. Sign up for a free cloud PostgreSQL provider:
   - **Neon** (https://neon.tech) - Recommended, instant setup
   - **Supabase** (https://supabase.com) - Includes extras
   - **Railway** (https://railway.app) - Easy deployment
   - **Render** (https://render.com) - Free tier

2. Get your DATABASE_URL connection string
3. Skip to Step 3 and use DATABASE_URL in your .env

📖 **Detailed cloud setup guide**: See [CLOUD_DATABASE_SETUP.md](CLOUD_DATABASE_SETUP.md)

**Option B: Local PostgreSQL**

Install PostgreSQL:
- Download from: https://www.postgresql.org/download/windows/
- Install with default settings
- Remember the password you set for 'postgres' user

Create Database:
```bash
psql -U postgres
```
Then in psql:
```sql
CREATE DATABASE patient_portal;
\q
```

### Step 3: Configure Environment

Copy `.env.example` to `.env`:
```bash
copy .env.example .env
```

Edit `.env` file:

**For Cloud Database:**
```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

PORT=3000
NODE_ENV=development
SESSION_SECRET=change-this-to-random-string-in-production
```

**For Local Database:**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=patient_portal
DB_USER=postgres
DB_PASSWORD=YOUR_POSTGRES_PASSWORD_HERE

PORT=3000
NODE_ENV=development
SESSION_SECRET=change-this-to-random-string-in-production
```

### Step 4: Build and Run Migrations

```bash
npm run build
npm run migrate
npm run seed
```

### Step 5: Start the Server

```bash
npm run dev
```

### Step 6: Access the Application

Open your browser:
```
http://localhost:3000
```

You'll see the login page. Click "Register here" to create your first patient account.

## What's Included

✅ Patient registration with validation
✅ Secure login/logout
✅ Profile management
✅ Password change
✅ Dashboard
✅ Security features (CSRF, input sanitization, rate limiting)
✅ Audit logging with tamper-evident hash chain
✅ Account lockout after 3 failed attempts
✅ Session timeout (30 minutes)
✅ All 42 tasks from the spec completed

## Test Accounts

After registration, you can create test accounts with:
- Email: patient@example.com
- Password: Test123!@# (meets all requirements)

## Troubleshooting

**"Cannot find module" errors**: Run `npm install`

**Database connection failed**: 
- Check PostgreSQL is running
- Verify credentials in `.env`
- Ensure database exists

**Port 3000 in use**: Change PORT in `.env`

## System Architecture

- **Backend**: Node.js + Express + TypeScript
- **Database**: PostgreSQL with parameterized queries
- **Security**: bcrypt (work factor 12), CSRF protection, input sanitization
- **Frontend**: HTML/CSS/JavaScript (vanilla)
- **Logging**: Winston with correlation IDs
- **Testing**: Jest with 100+ test cases

## Next Steps After Running

1. Register a patient account
2. Login and explore the dashboard
3. Update your profile
4. Change your password
5. Check the audit logs in the database
6. Review the code structure
7. Run tests: `npm test`

## Production Deployment

Before deploying to production:
1. Set `NODE_ENV=production` in `.env`
2. Change `SESSION_SECRET` to a strong random string
3. Use HTTPS (configure reverse proxy like nginx)
4. Set up database backups
5. Configure log rotation
6. Review security headers
7. Set up monitoring

## Support

For issues or questions, review:
- `SETUP.md` - Detailed setup instructions
- `.kiro/specs/patient-portal-auth/` - Complete specification
- Test files - Examples of how to use each component
