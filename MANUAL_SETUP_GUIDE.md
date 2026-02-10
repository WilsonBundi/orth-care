# Manual Setup Guide - Node.js PATH Issue

Your Node.js installation has a PATH configuration issue. Here's how to fix it and run the system.

## Problem

Node.js is installed at `C:\Program Files\nodejs\` but the `node.exe` executable is not accessible.

## Solution: Fix Node.js Installation

### Step 1: Verify Node.js Installation

1. Open File Explorer
2. Navigate to: `C:\Program Files\nodejs\`
3. Check if you see these files:
   - `node.exe`
   - `npm.cmd`
   - `npx.cmd`

**If these files are missing**: Node.js is not properly installed. Go to Step 2.
**If these files exist**: Go to Step 3.

### Step 2: Reinstall Node.js (If files are missing)

1. Download Node.js LTS from: https://nodejs.org/
2. Run the installer
3. **IMPORTANT**: During installation:
   - Check "Automatically install necessary tools"
   - Check "Add to PATH"
4. Complete the installation
5. **Restart your computer**
6. Skip to Step 5

### Step 3: Add Node.js to PATH (If files exist)

1. Press `Windows + R`
2. Type: `sysdm.cpl` and press Enter
3. Click "Advanced" tab
4. Click "Environment Variables"
5. Under "System variables", find "Path"
6. Click "Edit"
7. Click "New"
8. Add: `C:\Program Files\nodejs`
9. Click "OK" on all windows
10. **Close ALL terminals and Kiro**
11. **Restart Kiro**

### Step 4: Verify Fix

Open a new PowerShell and run:

```powershell
node --version
npm --version
```

You should see version numbers like:
```
v18.x.x
9.x.x
```

### Step 5: Run the Setup

Once Node.js is working, run these commands in order:

```powershell
# Navigate to your project folder
cd "C:\Users\HomePC\Desktop\Orthopaedics Care"

# Install dependencies
npm install

# Build the project
npm run build

# Create database tables
npm run migrate

# Seed initial data
npm run seed

# Start the server
npm run dev
```

### Step 6: Access the Application

Open your browser and go to:
```
http://localhost:3000
```

You should see the login page!

---

## Alternative: Use the Batch Files

After fixing Node.js PATH:

1. **Double-click**: `RUN_WITH_FULL_PATH.bat` (to setup)
2. **Double-click**: `START_SERVER.bat` (to start server)

---

## Troubleshooting

### "node is not recognized" after PATH fix

- Make sure you **closed ALL terminals** after adding to PATH
- **Restart your computer**
- Try again

### "Cannot find module" errors

```powershell
# Delete node_modules and reinstall
Remove-Item -Recurse -Force node_modules
npm install
```

### Database connection errors

- Check your `.env` file has the correct DATABASE_URL
- Verify your Supabase project is active
- Check your internet connection

### Port 3000 already in use

```powershell
# Change PORT in .env file
# Edit .env and change: PORT=3001
```

---

## Current Status

✅ Supabase database configured
✅ `.env` file updated with connection string
✅ All code files created
✅ Batch files created for easy setup

❌ Node.js PATH not configured (needs manual fix)

---

## What You Need to Do

1. **Fix Node.js PATH** (Steps 1-4 above)
2. **Run setup commands** (Step 5 above)
3. **Access the application** (Step 6 above)

---

## Need Help?

If you're still having issues:

1. Take a screenshot of the error
2. Check if `node.exe` exists in `C:\Program Files\nodejs\`
3. Try reinstalling Node.js from https://nodejs.org/

The system is ready to run - we just need Node.js to be accessible from the command line!
