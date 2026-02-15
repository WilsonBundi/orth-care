# 🌐 Cloud Database Migration Guide

## Overview
This guide will help you migrate from local PostgreSQL to a cloud-based database solution.

## Recommended Cloud Database Options

### 1. **Neon (Recommended - Free Tier Available)**
- **Type**: Serverless PostgreSQL
- **Free Tier**: Yes (3GB storage, 1 compute unit)
- **URL**: https://neon.tech
- **Best For**: PostgreSQL compatibility, easy migration

### 2. **Supabase (Recommended - Free Tier Available)**
- **Type**: PostgreSQL with additional features
- **Free Tier**: Yes (500MB database, 2GB bandwidth)
- **URL**: https://supabase.com
- **Best For**: PostgreSQL + real-time features

### 3. **PlanetScale**
- **Type**: MySQL-compatible serverless database
- **Free Tier**: Yes (5GB storage, 1 billion row reads/month)
- **URL**: https://planetscale.com
- **Best For**: Scalability and branching

### 4. **MongoDB Atlas**
- **Type**: NoSQL Document Database
- **Free Tier**: Yes (512MB storage)
- **URL**: https://www.mongodb.com/cloud/atlas
- **Best For**: Flexible schema, JSON documents

### 5. **Aiven PostgreSQL**
- **Type**: Managed PostgreSQL
- **Free Trial**: 30 days
- **URL**: https://aiven.io
- **Best For**: Enterprise features

---

## Quick Setup: Neon PostgreSQL (Easiest Migration)

### Step 1: Create Neon Account
1. Go to https://neon.tech
2. Sign up with GitHub or email
3. Create a new project
4. Copy your connection string

### Step 2: Get Your Connection String
After creating a project, you'll get a connection string like:
```
postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Step 3: Update Your .env File
```env
# Replace your local DATABASE_URL with Neon connection string
DATABASE_URL=postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Step 4: Migrate Your Schema
```bash
# Connect to Neon and run your schema files
psql "postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require" -f src/db/schema.sql
psql "postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require" -f src/db/schema_enterprise.sql
psql "postgresql://username:password@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require" -f src/db/invoices_schema.sql
```

### Step 5: Restart Your Server
```bash
npm run dev
```

---

## Quick Setup: Supabase (PostgreSQL + Features)

### Step 1: Create Supabase Project
1. Go to https://supabase.com
2. Sign up and create a new project
3. Wait for database to provision (2-3 minutes)

### Step 2: Get Connection Details
1. Go to Project Settings → Database
2. Copy the connection string (URI format)
3. Or use individual connection details

### Step 3: Update .env File
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres
```

### Step 4: Run Schema Migration
Use Supabase SQL Editor or command line:
```bash
psql "postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxxx.supabase.co:5432/postgres" -f src/db/schema.sql
```

---

## Quick Setup: MongoDB Atlas (NoSQL Alternative)

If you want to switch to MongoDB (NoSQL), we'll need to modify the code structure.

### Step 1: Create MongoDB Atlas Account
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up and create a free cluster
3. Create a database user
4. Whitelist your IP (or use 0.0.0.0/0 for all IPs)

### Step 2: Get Connection String
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/orthopedic_care?retryWrites=true&w=majority
```

### Step 3: Install MongoDB Driver
```bash
npm install mongodb mongoose
```

### Step 4: Update Configuration
We'll need to create MongoDB models and update the database layer.

---

## Migration Checklist

### Before Migration
- [ ] Backup your local database
- [ ] Export existing data (if any)
- [ ] Test connection to cloud database
- [ ] Update .env file with new connection string

### During Migration
- [ ] Run schema migration scripts
- [ ] Import existing data (if any)
- [ ] Test database connection
- [ ] Verify all tables are created

### After Migration
- [ ] Test user registration
- [ ] Test user login
- [ ] Test all CRUD operations
- [ ] Monitor database performance
- [ ] Update documentation

---

## Recommended: Neon PostgreSQL Setup

### Why Neon?
✅ Free tier with generous limits
✅ PostgreSQL compatible (no code changes needed)
✅ Instant setup (< 5 minutes)
✅ Automatic backups
✅ Serverless (scales to zero)
✅ Built-in connection pooling

### Detailed Neon Setup

1. **Create Account**: https://neon.tech
2. **Create Project**: Click "Create Project"
3. **Name**: "orthopedic-care"
4. **Region**: Choose closest to your users
5. **PostgreSQL Version**: 15 (latest)

6. **Copy Connection String**:
   ```
   postgresql://neondb_owner:xxxxx@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

7. **Update .env**:
   ```env
   DATABASE_URL=postgresql://neondb_owner:xxxxx@ep-cool-name-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```

8. **Migrate Schema** (using Neon SQL Editor or CLI):
   - Go to Neon Console → SQL Editor
   - Copy and paste content from `src/db/schema.sql`
   - Run the script
   - Repeat for `schema_enterprise.sql` and `invoices_schema.sql`

9. **Test Connection**:
   ```bash
   npm run dev
   ```

---

## Troubleshooting

### Connection Issues
- Ensure SSL mode is enabled (`?sslmode=require`)
- Check firewall/IP whitelist settings
- Verify username and password are correct
- Test connection with `psql` command line tool

### Migration Issues
- Run schema files in correct order
- Check for syntax errors in SQL files
- Ensure database user has proper permissions
- Review error logs for specific issues

### Performance Issues
- Enable connection pooling
- Use database indexes
- Monitor query performance
- Consider upgrading to paid tier for more resources

---

## Next Steps

1. Choose your cloud database provider
2. Follow the setup guide above
3. Update your .env file
4. Migrate your schema
5. Test the application
6. Deploy to production

---

## Support

For issues or questions:
- Neon: https://neon.tech/docs
- Supabase: https://supabase.com/docs
- MongoDB: https://docs.mongodb.com

---

**Note**: After migration, commit your changes (excluding .env) and push to GitHub!
