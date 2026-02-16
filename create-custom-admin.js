/**
 * Interactive Admin User Creation Script
 * Create admin users with custom email, password, name, and role
 * 
 * Usage: node create-custom-admin.js
 */

const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const readline = require('readline');
require('dotenv').config();

// Initialize Firebase
let serviceAccount;
if (process.env.FIREBASE_CREDENTIALS_BASE64) {
  serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf-8')
  );
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  console.error('❌ Firebase credentials not found in .env file');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = admin.firestore();

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Promisify question
function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Validate email format
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate password strength
function isValidPassword(password) {
  if (password.length < 8) return { valid: false, message: 'Password must be at least 8 characters' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Password must contain uppercase letter' };
  if (!/[a-z]/.test(password)) return { valid: false, message: 'Password must contain lowercase letter' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Password must contain number' };
  if (!/[!@#$%^&*]/.test(password)) return { valid: false, message: 'Password must contain special character (!@#$%^&*)' };
  return { valid: true };
}

async function createCustomAdmin() {
  console.log('\n╔═══════════════════════════════════════════════════════╗');
  console.log('║     🏥 Create Custom Admin/Staff Account             ║');
  console.log('╚═══════════════════════════════════════════════════════╝\n');

  try {
    // Get email
    let email;
    while (true) {
      email = await question('📧 Enter email address: ');
      if (!email) {
        console.log('❌ Email is required\n');
        continue;
      }
      if (!isValidEmail(email)) {
        console.log('❌ Invalid email format\n');
        continue;
      }
      
      // Check if email already exists
      const existing = await db.collection('users').where('email', '==', email).get();
      if (!existing.empty) {
        console.log('❌ This email already exists in the system\n');
        const retry = await question('Try another email? (yes/no): ');
        if (retry.toLowerCase() !== 'yes') {
          console.log('\n❌ Operation cancelled');
          rl.close();
          process.exit(0);
        }
        continue;
      }
      break;
    }

    // Get password
    let password;
    while (true) {
      password = await question('🔑 Enter password (min 8 chars, uppercase, lowercase, number, special char): ');
      if (!password) {
        console.log('❌ Password is required\n');
        continue;
      }
      const validation = isValidPassword(password);
      if (!validation.valid) {
        console.log(`❌ ${validation.message}\n`);
        continue;
      }
      
      const confirmPassword = await question('🔑 Confirm password: ');
      if (password !== confirmPassword) {
        console.log('❌ Passwords do not match\n');
        continue;
      }
      break;
    }

    // Get first name
    let firstName;
    while (true) {
      firstName = await question('👤 Enter first name: ');
      if (!firstName) {
        console.log('❌ First name is required\n');
        continue;
      }
      break;
    }

    // Get last name
    let lastName;
    while (true) {
      lastName = await question('👤 Enter last name: ');
      if (!lastName) {
        console.log('❌ Last name is required\n');
        continue;
      }
      break;
    }

    // Get phone number
    const phoneNumber = await question('📱 Enter phone number (e.g., +254700000000): ') || '+254700000000';

    // Display role options
    console.log('\n📋 Available Roles:');
    console.log('   1. super_admin      - Complete system control (Owner/Director)');
    console.log('   2. system_admin     - Technical administration (IT Manager)');
    console.log('   3. clinic_manager   - Operational management (Manager)');
    console.log('   4. specialist       - Specialized medical care (Specialist)');
    console.log('   5. doctor           - Primary medical care (Doctor)');
    console.log('   6. records_manager  - Medical records admin (Records Manager)');
    console.log('   7. nurse            - Clinical support (Nurse)');
    console.log('   8. billing_clerk    - Financial operations (Billing Staff)');
    console.log('   9. receptionist     - Front desk operations (Receptionist)');
    console.log('   10. patient         - Personal health access (Patient)\n');

    // Get role
    let role;
    const roleMap = {
      '1': 'super_admin',
      '2': 'system_admin',
      '3': 'clinic_manager',
      '4': 'specialist',
      '5': 'doctor',
      '6': 'records_manager',
      '7': 'nurse',
      '8': 'billing_clerk',
      '9': 'receptionist',
      '10': 'patient'
    };

    while (true) {
      const roleChoice = await question('🎯 Select role (1-10): ');
      if (!roleMap[roleChoice]) {
        console.log('❌ Invalid choice. Please enter a number between 1 and 10\n');
        continue;
      }
      role = roleMap[roleChoice];
      break;
    }

    // Confirm details
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('📋 Please confirm the details:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`Email:      ${email}`);
    console.log(`Password:   ${'*'.repeat(password.length)}`);
    console.log(`Name:       ${firstName} ${lastName}`);
    console.log(`Phone:      ${phoneNumber}`);
    console.log(`Role:       ${role}`);
    console.log('═══════════════════════════════════════════════════════\n');

    const confirm = await question('✅ Create this account? (yes/no): ');
    if (confirm.toLowerCase() !== 'yes') {
      console.log('\n❌ Operation cancelled');
      rl.close();
      process.exit(0);
    }

    // Create user
    console.log('\n⏳ Creating account...');

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const userData = {
      id: userId,
      email: email,
      passwordHash: passwordHash,
      firstName: firstName,
      lastName: lastName,
      dateOfBirth: new Date('1990-01-01'),
      phoneNumber: phoneNumber,
      address: {
        street: 'Orthopedic Care Clinic',
        city: 'Nairobi',
        state: 'Nairobi County',
        zipCode: '00100',
        country: 'Kenya'
      },
      role: role,
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('users').doc(userId).set(userData);

    console.log('\n╔═══════════════════════════════════════════════════════╗');
    console.log('║              ✅ ACCOUNT CREATED SUCCESSFULLY!         ║');
    console.log('╚═══════════════════════════════════════════════════════╝\n');
    
    console.log('📋 Account Details:');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`📧 Email:     ${email}`);
    console.log(`🔑 Password:  ${password}`);
    console.log(`👤 Name:      ${firstName} ${lastName}`);
    console.log(`🎯 Role:      ${role}`);
    console.log(`📱 Phone:     ${phoneNumber}`);
    console.log('═══════════════════════════════════════════════════════\n');

    console.log('🚀 Next Steps:');
    console.log('   1. Login at: http://localhost:3000/login.html');
    console.log('   2. Use the email and password above');
    console.log('   3. Change password after first login (recommended)');
    console.log('   4. Update profile information as needed\n');

    console.log('⚠️  Security Reminder:');
    console.log('   - Keep credentials secure');
    console.log('   - Change password regularly');
    console.log('   - Enable MFA when available');
    console.log('   - Never share login credentials\n');

    rl.close();
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Error creating account:', error.message);
    rl.close();
    process.exit(1);
  }
}

// Run the script
console.log('\n🔧 Initializing Firebase...');
createCustomAdmin();
