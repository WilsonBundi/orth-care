# 🔥 Supabase Quick Reference

Quick commands and tips for using Supabase with the Patient Portal.

## Setup Checklist

- [ ] Create Supabase account at [supabase.com](https://supabase.com)
- [ ] Create new project (save your password!)
- [ ] Get DATABASE_URL from Settings → Database
- [ ] Update `.env` with your DATABASE_URL
- [ ] Run `npm install`
- [ ] Run `npm run build`
- [ ] Run `npm run migrate`
- [ ] Run `npm run seed`
- [ ] Run `npm run dev`
- [ ] Open `http://localhost:3000`

## Your .env File

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-random-secret
LOG_LEVEL=info
```

## Essential Commands

```bash
# First time setup
npm install
npm run build
npm run migrate
npm run seed

# Start development server
npm run dev

# Run tests
npm test

# Production build
npm run build
npm start
```

## Where to Find Things in Supabase

### Get Connection String
1. Supabase Dashboard
2. Settings (gear icon)
3. Database
4. Connection string → URI tab
5. Copy and replace `[YOUR-PASSWORD]`

### View Tables
1. Table Editor (in sidebar)
2. See: users, sessions, audit_events, permissions

### Run SQL Queries
1. SQL Editor (in sidebar)
2. Write and execute queries

### Check Logs
1. Logs → Database
2. See all database activity

### View Backups
1. Database → Backups
2. Daily backups (7 days retention on free tier)

## Common SQL Queries

### View all users
```sql
SELECT id, email, first_name, last_name, created_at 
FROM users 
ORDER BY created_at DESC;
```

### View recent audit events
```sql
SELECT * FROM audit_events 
ORDER BY created_at DESC 
LIMIT 20;
```

### View active sessions
```sql
SELECT s.*, u.email 
FROM sessions s
JOIN users u ON s.user_id = u.id
WHERE s.expires_at > NOW()
ORDER BY s.created_at DESC;
```

### Count users by role
```sql
SELECT role, COUNT(*) 
FROM users 
GROUP BY role;
```

### View failed login attempts
```sql
SELECT * FROM audit_events 
WHERE event_type = 'LOGIN_FAILED'
ORDER BY created_at DESC;
```

## Connection Pooling (Better Performance)

For production, use the pooled connection:

1. Settings → Database → Connection pooling
2. Copy the pooler URL (has `pooler` in hostname)
3. Update `.env`:
```env
DATABASE_URL=postgresql://postgres.xxx:PASSWORD@aws-0-region.pooler.supabase.com:5432/postgres
```

## Troubleshooting

### Can't connect?
- Check internet connection
- Verify DATABASE_URL is correct
- Ensure password has no spaces
- Try direct connection (not pooler) first

### Tables already exist?
Reset database:
```sql
DROP TABLE IF EXISTS audit_events CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```
Then run `npm run migrate` again.

### Too many connections?
- Use connection pooling URL
- Restart your app
- Check for connection leaks

## Security Checklist

- [ ] Changed SESSION_SECRET in `.env`
- [ ] Never commit `.env` to git
- [ ] Use strong database password
- [ ] Enable 2FA on Supabase account
- [ ] Use connection pooling in production
- [ ] Monitor database usage regularly

## Free Tier Limits

- 500MB storage
- 2GB bandwidth/month
- 2 projects
- Unlimited API requests
- Daily backups (7 days)

## Useful Links

- **Dashboard**: https://app.supabase.com
- **Docs**: https://supabase.com/docs
- **Status**: https://status.supabase.com
- **Discord**: https://discord.supabase.com

## Quick Test

After setup, test everything works:

```bash
# Terminal 1: Start server
npm run dev

# Terminal 2: Test health
curl http://localhost:3000/health

# Browser: Register user
# Go to http://localhost:3000
# Click "Register here"
# Fill form and submit

# Supabase: Check data
# Go to Table Editor → users
# See your new user!
```

## Production Deployment

1. Use connection pooling URL
2. Set `NODE_ENV=production`
3. Generate strong SESSION_SECRET
4. Enable HTTPS
5. Monitor Supabase dashboard
6. Set up alerts for usage limits

---

For detailed instructions, see [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
