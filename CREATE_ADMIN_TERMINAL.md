# ⚡ Create Admin from Terminal - Interactive Guide

## Quick Start

### Run This Command:

```bash
node create-custom-admin.js
```

That's it! The script will ask you questions and create the account.

---

## What It Will Ask You

### 1. Email Address
```
📧 Enter email address: your-email@example.com
```
- Use any email you want
- Must be valid format
- Cannot already exist in system

### 2. Password
```
🔑 Enter password: YourPassword123!
```
**Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 number (0-9)
- At least 1 special character (!@#$%^&*)

**Example good passwords:**
- `MyClinic2026!`
- `Secure@Pass123`
- `Admin#2026Ortho`

### 3. Confirm Password
```
🔑 Confirm password: YourPassword123!
```
Must match exactly

### 4. First Name
```
👤 Enter first name: John
```

### 5. Last Name
```
👤 Enter last name: Smith
```

### 6. Phone Number
```
📱 Enter phone number: +254700000000
```
Optional - press Enter to use default

### 7. Select Role
```
📋 Available Roles:
   1. super_admin      - Complete system control
   2. system_admin     - Technical administration
   3. clinic_manager   - Operational management
   4. specialist       - Specialized medical care
   5. doctor           - Primary medical care
   6. records_manager  - Medical records admin
   7. nurse            - Clinical support
   8. billing_clerk    - Financial operations
   9. receptionist     - Front desk operations
   10. patient         - Personal health access

🎯 Select role (1-10): 1
```

Choose the number for the role you want.

### 8. Confirm
```
✅ Create this account? (yes/no): yes
```

Type `yes` to create the account.

---

## Example Session

```bash
$ node create-custom-admin.js

╔═══════════════════════════════════════════════════════╗
║     🏥 Create Custom Admin/Staff Account             ║
╚═══════════════════════════════════════════════════════╝

📧 Enter email address: wilson@orthopedicscare.com
🔑 Enter password (min 8 chars, uppercase, lowercase, number, special char): MySecure@2026
🔑 Confirm password: MySecure@2026
👤 Enter first name: Wilson
👤 Enter last name: Bundi
📱 Enter phone number (e.g., +254700000000): +254712345678

📋 Available Roles:
   1. super_admin      - Complete system control (Owner/Director)
   2. system_admin     - Technical administration (IT Manager)
   3. clinic_manager   - Operational management (Manager)
   4. specialist       - Specialized medical care (Specialist)
   5. doctor           - Primary medical care (Doctor)
   6. records_manager  - Medical records admin (Records Manager)
   7. nurse            - Clinical support (Nurse)
   8. billing_clerk    - Financial operations (Billing Staff)
   9. receptionist     - Front desk operations (Receptionist)
   10. patient         - Personal health access (Patient)

🎯 Select role (1-10): 1

═══════════════════════════════════════════════════════
📋 Please confirm the details:
═══════════════════════════════════════════════════════
Email:      wilson@orthopedicscare.com
Password:   **************
Name:       Wilson Bundi
Phone:      +254712345678
Role:       super_admin
═══════════════════════════════════════════════════════

✅ Create this account? (yes/no): yes

⏳ Creating account...

╔═══════════════════════════════════════════════════════╗
║              ✅ ACCOUNT CREATED SUCCESSFULLY!         ║
╚═══════════════════════════════════════════════════════╝

📋 Account Details:
═══════════════════════════════════════════════════════
📧 Email:     wilson@orthopedicscare.com
🔑 Password:  MySecure@2026
👤 Name:      Wilson Bundi
🎯 Role:      super_admin
📱 Phone:     +254712345678
═══════════════════════════════════════════════════════

🚀 Next Steps:
   1. Login at: http://localhost:3000/login.html
   2. Use the email and password above
   3. Change password after first login (recommended)
   4. Update profile information as needed
```

---

## Role Selection Guide

**Choose based on job function:**

| Number | Role | Who Should Get It |
|--------|------|-------------------|
| 1 | super_admin | You (Owner/Director) |
| 2 | system_admin | IT Manager |
| 3 | clinic_manager | Clinic Manager |
| 4 | specialist | Orthopedic Specialist |
| 5 | doctor | General Doctors |
| 6 | records_manager | Records Department Head |
| 7 | nurse | Nurses |
| 8 | billing_clerk | Billing Staff |
| 9 | receptionist | Front Desk Staff |
| 10 | patient | Regular Patients |

---

## Password Requirements

✅ **Good Passwords:**
- `MyClinic2026!`
- `Secure@Pass123`
- `Admin#2026Ortho`
- `Wilson@Bundi2026`
- `Ortho!Care123`

❌ **Bad Passwords:**
- `password` (too simple)
- `12345678` (no letters)
- `Password` (no numbers or special chars)
- `pass123` (no uppercase or special chars)

---

## Common Issues

### "Email already exists"
**Solution:** Use a different email or check if account was already created

### "Invalid password"
**Solution:** Make sure password has:
- At least 8 characters
- Uppercase letter
- Lowercase letter
- Number
- Special character (!@#$%^&*)

### "Firebase credentials not found"
**Solution:** Make sure `.env` file has Firebase credentials configured

---

## Create Multiple Accounts

Just run the command multiple times:

```bash
node create-custom-admin.js
# Create first account

node create-custom-admin.js
# Create second account

node create-custom-admin.js
# Create third account
```

Each time you run it, you can create a new account with different details.

---

## Quick Commands

```bash
# Create new admin/staff account (interactive)
node create-custom-admin.js

# Check if account exists
node check-admin.js

# Test login credentials
node test-login.js
```

---

## After Creating Account

1. **Login:** http://localhost:3000/login.html
2. **Use the email and password you just created**
3. **Change password** (recommended)
4. **Update profile** with correct information
5. **Enable MFA** when available

---

## Need Help?

- **Script not working?** Make sure server is running: `npm run dev`
- **Forgot password?** Use password reset feature or update in Firebase
- **Wrong role assigned?** Update role in Firebase Console

---

**Ready to create your admin account?**

```bash
node create-custom-admin.js
```

**That's it!** 🚀
