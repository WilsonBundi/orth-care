# ☁️ Cloud Database Quick Start (5 Minutes)

Get your Patient Portal running with a cloud database in 5 minutes - no local PostgreSQL installation needed!

## Recommended: Neon (Fastest Setup)

### Step 1: Create Neon Database (2 minutes)

1. Go to [neon.tech](https://neon.tech)
2. Click "Sign Up" (free, no credit card)
3. Click "Create Project"
4. Name it "patient-portal"
5. Select a region close to you
6. Click "Create Project"

### Step 2: Get Connection String (30 seconds)

1. On the project dashboard, find "Connection Details"
2. Select "Node.js" from the dropdown
3. Copy the connection string that looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

### Step 3: Configure Your App (1 minute)

1. Copy `.env.example` to `.env`:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` and add your DATABASE_URL:
   ```env
   DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   
   PORT=3000
   NODE_ENV=development
   SESSION_SECRET=my-secret-key-12345
   LOG_LEVEL=info
   ```

3. Comment out or remove the local DB settings (DB_HOST, DB_PORT, etc.)

### Step 4: Setup and Run (2 minutes)

```bash
# Install dependencies (if not done already)
npm install

# Build the project
npm run build

# Run migrations to create tables
npm run migrate

# Seed initial data
npm run seed

# Start the server
npm run dev
```

### Step 5: Access Your App

Open your browser:
```
http://localhost:3000
```

Click "Register here" to create your first patient account!

---

## Alternative: Supabase

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up (free)
3. Create new project
4. Wait for database to provision (~2 minutes)

### Step 2: Get Connection String

1. Go to Settings → Database
2. Scroll to "Connection string"
3. Select "URI" tab
4. Copy the connection string
5. Replace `[YOUR-PASSWORD]` with your actual password

### Step 3: Configure

Edit `.env`:
```env
DATABASE_URL=postgresql://postgres.xxx:[YOUR-PASSWORD]@aws-0-us-west-1.pooler.supabase.com:5432/postgres

PORT=3000
NODE_ENV=development
SESSION_SECRET=my-secret-key-12345
LOG_LEVEL=info
```

### Step 4: Run

```bash
npm install
npm run build
npm run migrate
npm run seed
npm run dev
```

---

## Alternative: Railway

### Step 1: Create Railway Database

1. Go to [railway.app](https://railway.app)
2. Sign up (free $5 credit)
3. Create new project
4. Click "Add Service" → "Database" → "PostgreSQL"

### Step 2: Get Connection String

1. Click on the PostgreSQL service
2. Go to "Connect" tab
3. Copy the "DATABASE_URL"

### Step 3: Configure

Edit `.env`:
```env
DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway

PORT=3000
NODE_ENV=development
SESSION_SECRET=my-secret-key-12345
LOG_LEVEL=info
```

### Step 4: Run

```bash
npm install
npm run build
npm run migrate
npm run seed
npm run dev
```

---

## Troubleshooting

### "Connection timeout"
- Check your internet connection
- Verify the DATABASE_URL is correct
- Try increasing timeout in `src/db/config.ts`

### "SSL error"
- Make sure your DATABASE_URL ends with `?sslmode=require`
- Some providers use `?ssl=true` instead

### "Too many connections"
- Close other connections to the database
- Restart your app
- Check if you have multiple instances running

### "Migration failed"
- Make sure the database is empty (first time setup)
- Check if tables already exist
- Try dropping all tables and running migration again

---

## What's Next?

1. ✅ Register a patient account
2. ✅ Login and explore the dashboard
3. ✅ Update your profile
4. ✅ Change your password
5. ✅ Check the audit logs in your cloud database

---

## Free Tier Limits

### Neon
- ✅ 0.5GB storage
- ✅ 3 projects
- ✅ Unlimited queries
- ✅ Auto-scales to zero

### Supabase
- ✅ 500MB storage
- ✅ 2 projects
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests

### Railway
- ✅ $5 credit/month
- ✅ ~500 hours runtime
- ✅ Unlimited projects

All free tiers are perfect for development and small production apps!

---

## Production Tips

When deploying to production:

1. **Use connection pooling**: Neon and Supabase provide pooled connection strings
2. **Enable backups**: Most providers offer automatic backups
3. **Monitor usage**: Check your dashboard regularly
4. **Upgrade if needed**: Free tiers are great for starting, upgrade as you grow
5. **Use environment variables**: Never commit `.env` to git

---

## Need Help?

- 📖 Full cloud setup guide: [CLOUD_DATABASE_SETUP.md](CLOUD_DATABASE_SETUP.md)
- 📖 Detailed setup: [SETUP.md](SETUP.md)
- 📖 Main README: [README.md](README.md)

Happy coding! 🚀
