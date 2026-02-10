# Start PostgreSQL Service

PostgreSQL is installed but the service is not running. Here's how to start it:

## Method 1: Using Services (Easiest)

1. Press `Windows + R`
2. Type: `services.msc`
3. Press Enter
4. Find "postgresql" in the list (might be named "postgresql-x64-15" or "postgresql-x64-16")
5. Right-click → Start
6. Right-click → Properties → Set "Startup type" to "Automatic"

## Method 2: Using Command Line

Open PowerShell as Administrator and run:

```powershell
# Find the service name
Get-Service | Where-Object {$_.DisplayName -like "*PostgreSQL*"}

# Start the service (replace SERVICE_NAME with actual name)
Start-Service SERVICE_NAME
```

## Method 3: Using pg_ctl

If PostgreSQL was installed without a service:

```powershell
# Navigate to PostgreSQL bin directory
cd "C:\Program Files\PostgreSQL\16\bin"

# Start PostgreSQL
.\pg_ctl -D "C:\Program Files\PostgreSQL\16\data" start
```

## Verify PostgreSQL is Running

```powershell
psql -U postgres -c "SELECT version();"
```

You should see the PostgreSQL version information.

## After Starting PostgreSQL

Come back and let me know, then I'll:
1. Create the database
2. Run migrations
3. Start the server

---

**What password did you set during PostgreSQL installation?**

I'll need to update the `.env` file with your actual PostgreSQL password (currently set to "postgres").
