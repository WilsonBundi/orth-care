# Fix Node.js PATH Issue on Windows

Node.js is installed at `C:\Program Files\nodejs\` but it's not in your system PATH.

## Quick Fix Options

### Option 1: Restart Your Computer (Easiest)

Sometimes the PATH is set but requires a restart to take effect.

1. Save all your work
2. Restart your computer
3. Open a new terminal/PowerShell
4. Try `node --version` again

### Option 2: Add Node.js to PATH Manually

1. **Open System Environment Variables**:
   - Press `Windows + R`
   - Type: `sysdm.cpl`
   - Press Enter

2. **Edit Environment Variables**:
   - Click "Advanced" tab
   - Click "Environment Variables" button at the bottom

3. **Edit PATH**:
   - Under "System variables" (bottom section)
   - Find and select "Path"
   - Click "Edit"

4. **Add Node.js**:
   - Click "New"
   - Add: `C:\Program Files\nodejs`
   - Click "OK" on all windows

5. **Restart Terminal**:
   - Close ALL PowerShell/CMD windows
   - Close Kiro IDE
   - Reopen Kiro IDE
   - Open a new terminal

6. **Test**:
   ```powershell
   node --version
   npm --version
   ```

### Option 3: Use Full Path (Temporary Solution)

Until you fix the PATH, use the full path to node and npm:

```powershell
# Instead of: npm install
# Use:
& "C:\Program Files\nodejs\npm.cmd" install

# Instead of: npm run build
# Use:
& "C:\Program Files\nodejs\npm.cmd" run build

# Instead of: npm run migrate
# Use:
& "C:\Program Files\nodejs\npm.cmd" run migrate
```

### Option 4: Reinstall Node.js

1. Download Node.js from: https://nodejs.org/
2. Run the installer
3. **Important**: Check "Add to PATH" during installation
4. Restart your computer
5. Test: `node --version`

## After Fixing PATH

Once Node.js is in your PATH, run these commands:

```powershell
# 1. Install dependencies
npm install

# 2. Build the project
npm run build

# 3. Create database tables
npm run migrate

# 4. Seed initial data
npm run seed

# 5. Start the server
npm run dev
```

Then open: http://localhost:3000

## Quick Test

To check if Node.js is in your PATH:

```powershell
node --version
npm --version
```

If you see version numbers, you're good to go!
If you see "not recognized", the PATH is not set correctly.

---

**Recommended**: Try Option 1 (restart) first, then Option 2 if that doesn't work.
