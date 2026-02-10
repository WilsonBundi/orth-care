# Patient Portal Setup Guide

## Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** (v14 or higher)
3. **npm** or **yarn**

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Database Setup

**Option A: Cloud Database (Recommended)**

Use a cloud PostgreSQL provider for instant setup with no local installation:

1. Sign up for free at:
   - **Neon** (https://neon.tech) - Instant serverless PostgreSQL
   - **Supabase** (https://supabase.com) - PostgreSQL with extras
   - **Railway** (https://railway.app) - Easy deployment
   - **Render** (https://render.com) - Free tier available

2. Create a new PostgreSQL database
3. Copy the connection string (DATABASE_URL)
4. Skip to Step 3 and use DATABASE_URL in your .env

📖 **See [CLOUD_DATABASE_SETUP.md](CLOUD_DATABASE_SETUP.md) for detailed provider-specific guides**

**Option B: Local PostgreSQL**

Install and create a local database:

```bash
psql -U postgres
CREATE DATABASE patient_portal;
\q
```

### 3. Environment Configuration

Copy the example environment file:

```bash
copy .env.example .env
```

Edit `.env` with your database credentials:

**For Cloud Database (Neon, Supabase, Railway, etc.):**
```
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

PORT=3000
NODE_ENV=development
SESSION_SECRET=your-secret-key-change-this
LOG_LEVEL=info
```

**For Local PostgreSQL:**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=patient_portal
DB_USER=postgres
DB_PASSWORD=your_password

PORT=3000
NODE_ENV=development
SESSION_SECRET=your-secret-key-change-this
LOG_LEVEL=info
```

### 4. Run Database Migrations

```bash
npm run build
npm run migrate
```

### 5. Seed Initial Data

```bash
npm run seed
```

This creates the default permissions for the PATIENT role.

### 6. Start the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm run build
npm start
```

## Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

You'll be redirected to the login page. Click "Register here" to create a new patient account.

## Default Features

- **Patient Registration**: Create new patient accounts with validation
- **Secure Login**: Email/password authentication with session management
- **Profile Management**: View and update patient information
- **Password Change**: Change password with current password verification
- **Dashboard**: Patient portal dashboard with navigation
- **Security**: HTTPS redirect, security headers, input sanitization, CSRF protection
- **Audit Logging**: Tamper-evident audit trail with hash chain
- **Account Lockout**: 3 failed attempts = 15 minute lockout
- **Session Timeout**: 30 minutes of inactivity

## Testing

Run tests:
```bash
npm test
```

Run tests with coverage:
```bash
npm run test:coverage
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new patient
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `POST /api/auth/change-password` - Change password

### Profile
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile

### Dashboard
- `GET /api/dashboard` - Get dashboard data

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database exists

### Port Already in Use
- Change PORT in `.env` to a different value
- Or stop the process using port 3000

### Module Not Found Errors
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then run `npm install`

## Security Notes

- Change SESSION_SECRET in production
- Use HTTPS in production
- Keep dependencies updated
- Review audit logs regularly
- Backup database regularly

## Next Steps

This is Phase 1 (Patient Portal with Secure Authentication). Future phases include:
- Patient medical records
- Appointment management
- Communication & notifications
- Billing & invoices
- Management dashboard
