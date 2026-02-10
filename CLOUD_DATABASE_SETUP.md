# Cloud Database Setup Guide

This guide shows how to use cloud PostgreSQL databases with the Patient Portal system.

## Supported Cloud Providers

- ✅ **Neon** (Serverless PostgreSQL) - Recommended for development
- ✅ **Supabase** (PostgreSQL with extras)
- ✅ **Railway** (Easy deployment)
- ✅ **Render** (Free tier available)
- ✅ **AWS RDS** (Production-grade)
- ✅ **Azure Database for PostgreSQL**
- ✅ **Google Cloud SQL**
- ✅ **Heroku Postgres**
- ✅ **DigitalOcean Managed Databases**

## Quick Setup (Any Provider)

### Step 1: Get Your Database URL

Sign up for any cloud PostgreSQL provider and get your connection string. It will look like:

```
postgresql://user:password@host:port/database?sslmode=require
```

### Step 2: Configure Environment

Edit your `.env` file and add the `DATABASE_URL`:

```env
# Use DATABASE_URL for cloud database
DATABASE_URL=postgresql://user:password@host:port/database?sslmode=require

# Keep these for other settings
PORT=3000
NODE_ENV=development
SESSION_SECRET=your-secret-key
LOG_LEVEL=info
```

**Important**: When using `DATABASE_URL`, the individual DB_HOST, DB_PORT, etc. are ignored.

### Step 3: Run Migrations

```bash
npm run build
npm run migrate
npm run seed
```

### Step 4: Start the Server

```bash
npm run dev
```

That's it! The system will automatically connect to your cloud database.

---

## Provider-Specific Guides

### 🚀 Neon (Recommended for Quick Start)

**Why Neon?**
- Free tier with 0.5GB storage
- Serverless (auto-scales to zero)
- Instant setup
- Built-in connection pooling

**Setup:**

1. Go to [neon.tech](https://neon.tech)
2. Sign up (free)
3. Create a new project
4. Copy the connection string from the dashboard
5. Add to `.env`:

```env
DATABASE_URL=postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

**Connection Pooling** (Optional but recommended):
Neon provides a pooled connection string for better performance:

```env
DATABASE_URL=postgresql://user:password@ep-xxx-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
```

---

### 🔥 Supabase

**Why Supabase?**
- Free tier with 500MB storage
- Includes authentication, storage, and real-time features
- PostgreSQL 15+
- Auto-generated REST API

**Setup:**

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to Settings → Database
4. Copy the "Connection string" (URI format)
5. Add to `.env`:

```env
DATABASE_URL=postgresql://postgres.xxx:password@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```

**Note**: Use the "Connection pooling" string for better performance.

---

### 🚂 Railway

**Why Railway?**
- $5 free credit monthly
- One-click PostgreSQL deployment
- Automatic backups
- Easy environment management

**Setup:**

1. Go to [railway.app](https://railway.app)
2. Create a new project
3. Add PostgreSQL from the service catalog
4. Click on PostgreSQL → Connect → Copy the DATABASE_URL
5. Add to `.env`:

```env
DATABASE_URL=postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
```

---

### 🎨 Render

**Why Render?**
- Free tier available (90 days, then $7/month)
- Automatic backups
- Easy deployment
- Good for production

**Setup:**

1. Go to [render.com](https://render.com)
2. Create a new PostgreSQL database
3. Copy the "External Database URL"
4. Add to `.env`:

```env
DATABASE_URL=postgresql://user:password@dpg-xxx-oregon-postgres.render.com/dbname
```

**Note**: Free tier databases expire after 90 days of inactivity.

---

### ☁️ AWS RDS

**Why AWS RDS?**
- Production-grade reliability
- Automated backups
- Multi-AZ deployment
- Scalable

**Setup:**

1. Go to AWS Console → RDS
2. Create a PostgreSQL database
3. Configure security group to allow your IP
4. Get the endpoint from the RDS dashboard
5. Format the connection string:

```env
DATABASE_URL=postgresql://username:password@xxx.region.rds.amazonaws.com:5432/patient_portal?sslmode=require
```

**Security**: Make sure to:
- Use a strong password
- Configure security groups properly
- Enable SSL/TLS
- Use IAM authentication (optional)

---

### 🔷 Azure Database for PostgreSQL

**Setup:**

1. Go to Azure Portal
2. Create "Azure Database for PostgreSQL"
3. Get connection details from "Connection strings"
4. Add to `.env`:

```env
DATABASE_URL=postgresql://username@servername:password@servername.postgres.database.azure.com:5432/patient_portal?sslmode=require
```

---

### 🌐 Google Cloud SQL

**Setup:**

1. Go to Google Cloud Console → SQL
2. Create a PostgreSQL instance
3. Create a database named `patient_portal`
4. Get connection details
5. Add to `.env`:

```env
DATABASE_URL=postgresql://username:password@xxx.xxx.xxx.xxx:5432/patient_portal?sslmode=require
```

**Note**: For Cloud SQL Proxy, use the Unix socket path instead.

---

## Testing Your Connection

After setting up your cloud database, test the connection:

```bash
npm run build
node dist/db/config.js
```

Or use the health check endpoint after starting the server:

```bash
npm run dev
# In another terminal:
curl http://localhost:3000/health
```

You should see:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

---

## Migration & Seeding

Run migrations to create tables:

```bash
npm run migrate
```

Seed initial permissions:

```bash
npm run seed
```

---

## Connection Pooling

Cloud databases benefit from connection pooling. The system is configured with:

- **Max connections**: 20
- **Idle timeout**: 30 seconds
- **Connection timeout**: 10 seconds (cloud) / 2 seconds (local)

For high-traffic applications, consider using:
- **PgBouncer** (connection pooler)
- **Neon's built-in pooling**
- **Supabase's connection pooling**

---

## Security Best Practices

### 1. Use Environment Variables
Never commit `.env` file to git. Use `.env.example` as a template.

### 2. Enable SSL/TLS
Always use `?sslmode=require` in your connection string for cloud databases.

### 3. Rotate Credentials
Change database passwords regularly, especially after team member changes.

### 4. IP Whitelisting
Configure your cloud provider to only allow connections from:
- Your application server IPs
- Your development IPs
- CI/CD pipeline IPs

### 5. Use Read Replicas
For production, consider read replicas for better performance.

### 6. Enable Backups
Most cloud providers offer automated backups. Enable them!

---

## Troubleshooting

### Connection Timeout
- Check if your IP is whitelisted
- Verify SSL settings
- Increase `connectionTimeoutMillis` in `src/db/config.ts`

### SSL Certificate Error
- Add `?sslmode=require` to your DATABASE_URL
- Some providers need `?ssl=true` instead

### Too Many Connections
- Reduce `max` pool size in `src/db/config.ts`
- Use connection pooling (PgBouncer)
- Check for connection leaks in your code

### Slow Queries
- Add indexes to frequently queried columns
- Use connection pooling
- Consider upgrading your database tier
- Check query performance with EXPLAIN ANALYZE

---

## Cost Optimization

### Free Tiers (Good for Development)
- **Neon**: 0.5GB storage, 3 projects
- **Supabase**: 500MB storage, 2 projects
- **Railway**: $5 credit/month
- **Render**: Free for 90 days

### Production Recommendations
- **Small apps**: Neon Pro ($19/month) or Supabase Pro ($25/month)
- **Medium apps**: Railway ($20-50/month) or Render ($7-20/month)
- **Large apps**: AWS RDS, Azure, or Google Cloud SQL (varies)

---

## Monitoring

Monitor your database:
- Connection pool usage
- Query performance
- Storage usage
- Backup status

Most cloud providers offer built-in monitoring dashboards.

---

## Next Steps

1. Choose a cloud provider
2. Get your DATABASE_URL
3. Update `.env` file
4. Run migrations
5. Start the server
6. Test the connection

For production deployment, see the main README.md for additional security considerations.
