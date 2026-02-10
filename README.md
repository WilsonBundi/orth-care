# Patient Portal with Secure Authentication

A complete hospital management system starting with a secure patient portal featuring authentication, authorization, profile management, and comprehensive audit logging.

## 🎯 Features

### Patient Portal
- ✅ Secure patient registration with validation
- ✅ Email/password authentication
- ✅ Session management (30-minute timeout)
- ✅ Profile view and update
- ✅ Password change with validation
- ✅ Dashboard with navigation

### Security
- ✅ Password hashing with bcrypt (work factor 12)
- ✅ Account lockout (3 failed attempts = 15 min lock)
- ✅ CSRF protection
- ✅ Input sanitization
- ✅ Security headers (CSP, HSTS, X-Frame-Options)
- ✅ SQL injection prevention (parameterized queries)
- ✅ HTTPS enforcement

### Audit & Compliance
- ✅ Tamper-evident audit logging with SHA-256 hash chain
- ✅ Request/response logging with correlation IDs
- ✅ Role-based access control (RBAC)
- ✅ Comprehensive error handling

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ (local) OR Cloud Database (Neon, Supabase, Railway, etc.)
- npm or yarn

### Installation

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Setup database**:
   
   **Option A - Cloud Database (Recommended):**
   - Sign up at [Neon](https://neon.tech), [Supabase](https://supabase.com), or [Railway](https://railway.app)
   - Create a PostgreSQL database
   - Copy the DATABASE_URL connection string
   - See [CLOUD_DATABASE_SETUP.md](CLOUD_DATABASE_SETUP.md) for detailed guides
   
   **Option B - Local PostgreSQL:**
   ```bash
   psql -U postgres
   CREATE DATABASE patient_portal;
   \q
   ```

3. **Configure environment**:
   ```bash
   copy .env.example .env
   ```
   
   Edit `.env`:
   - **For cloud**: Set `DATABASE_URL=postgresql://...`
   - **For local**: Set `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`

4. **Run migrations**:
   ```bash
   npm run build
   npm run migrate
   npm run seed
   ```

5. **Start server**:
   ```bash
   npm run dev
   ```

6. **Access application**:
   ```
   http://localhost:3000
   ```

📖 **Detailed setup instructions**: See [SETUP.md](SETUP.md)  
🏃 **Quick run guide**: See [RUN_SYSTEM.md](RUN_SYSTEM.md)  
☁️ **Cloud database guide**: See [CLOUD_DATABASE_SETUP.md](CLOUD_DATABASE_SETUP.md)  
⚡ **5-minute cloud setup**: See [CLOUD_QUICK_START.md](CLOUD_QUICK_START.md)  
🔥 **Supabase setup**: See [SUPABASE_SETUP.md](SUPABASE_SETUP.md)  
⚡ **Connect existing Supabase**: See [CONNECT_SUPABASE.md](CONNECT_SUPABASE.md) ← **Start here!**

## 📁 Project Structure

```
patient-portal-auth/
├── src/
│   ├── config/
│   │   └── logger.ts              # Winston logger configuration
│   ├── controllers/
│   │   ├── authController.ts      # Authentication endpoints
│   │   ├── profileController.ts   # Profile management
│   │   └── dashboardController.ts # Dashboard data
│   ├── db/
│   │   ├── config.ts              # Database connection pool
│   │   ├── schema.sql             # Database schema
│   │   ├── migrate.ts             # Migration script
│   │   └── seed.ts                # Seed permissions
│   ├── middleware/
│   │   ├── auth.ts                # Authentication middleware
│   │   ├── authorization.ts       # RBAC middleware
│   │   ├── csrf.ts                # CSRF protection
│   │   ├── errorHandler.ts        # Global error handler
│   │   ├── inputSanitization.ts   # Input sanitization
│   │   ├── requestLogger.ts       # Request/response logging
│   │   └── security.ts            # Security headers
│   ├── repositories/
│   │   ├── UserRepository.ts      # User data access
│   │   ├── SessionRepository.ts   # Session management
│   │   ├── AuditRepository.ts     # Audit logging
│   │   └── PermissionRepository.ts # Permissions
│   ├── routes/
│   │   └── index.ts               # API routes
│   ├── services/
│   │   ├── AuthenticationService.ts # Auth business logic
│   │   ├── AuthorizationService.ts  # RBAC logic
│   │   ├── PasswordService.ts       # Password hashing
│   │   ├── ProfileService.ts        # Profile management
│   │   ├── SessionService.ts        # Session management
│   │   └── AuditService.ts          # Audit logging
│   ├── types/
│   │   ├── models.ts              # TypeScript interfaces
│   │   └── validation.ts          # Validation utilities
│   └── index.ts                   # Application entry point
├── public/
│   ├── login.html                 # Login page
│   ├── register.html              # Registration page
│   ├── dashboard.html             # Dashboard
│   ├── profile.html               # Profile management
│   └── password-change.html       # Password change
├── logs/                          # Application logs
├── .env.example                   # Environment template
├── SETUP.md                       # Detailed setup guide
├── RUN_SYSTEM.md                  # Quick run guide
└── README.md                      # This file
```

## 🧪 Testing

```bash
# Run all tests
npm test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

Test coverage includes:
- Unit tests for all services and repositories
- Integration tests for API endpoints
- Property-based tests with fast-check
- 100+ test cases total

## 🔒 Security Implementation

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

### Session Management
- 30-minute inactivity timeout
- Secure, httpOnly, sameSite cookies
- Session invalidation on logout
- Cleanup of expired sessions

### Account Protection
- 3 failed login attempts trigger 15-minute lockout
- Failed attempt counter resets on successful login
- Lockout automatically expires after 15 minutes

### Audit Trail
- Tamper-evident hash chain using SHA-256
- Sequential event IDs prevent deletion
- Logs all authentication events
- Includes user ID, IP, timestamp, and details

## 📊 API Endpoints

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

### Health
- `GET /health` - Health check

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+ with TypeScript 5.3+
- **Web Framework**: Express.js 4.18+
- **Database**: PostgreSQL 14+ with pg driver
- **Security**: bcrypt 5+, helmet, csurf
- **Logging**: Winston 3+
- **Testing**: Jest 29+ with ts-jest, fast-check 3+

## 📝 Environment Variables

**Cloud Database (Recommended):**
```env
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require
PORT=3000
NODE_ENV=development
SESSION_SECRET=change-this-in-production
LOG_LEVEL=info
```

**Local Database:**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=patient_portal
DB_USER=postgres
DB_PASSWORD=your_password
PORT=3000
NODE_ENV=development
SESSION_SECRET=change-this-in-production
LOG_LEVEL=info
```

## 🎯 Implementation Status

This is **Phase 1** of the hospital management system:

✅ **Completed (42/42 tasks)**:
- Project infrastructure
- Type definitions and validation
- Password service with bcrypt
- All repositories (User, Session, Audit, Permission)
- All services (Auth, Authorization, Profile, Session, Audit)
- All middleware (Auth, RBAC, Security, CSRF, Input Sanitization, Logging)
- All controllers (Auth, Profile, Dashboard)
- API routes
- Frontend pages (Login, Register, Dashboard, Profile, Password Change)
- Database schema and migrations
- Logging configuration
- Documentation

## 🚀 Future Phases

- Phase 2: Patient medical records
- Phase 3: Appointment management
- Phase 4: Communication & notifications
- Phase 5: Billing & invoices
- Phase 6: Management dashboard
- Phase 7: Additional user roles (doctors, nurses, clerks)
- Phase 8: Advanced features

## 📄 License

MIT
