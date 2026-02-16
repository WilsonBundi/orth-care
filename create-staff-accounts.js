/**
 * Bulk Staff Account Creation Script
 * Creates multiple staff accounts at once
 * 
 * Usage: 
 * 1. Edit the staffMembers array below with your staff details
 * 2. Run: node create-staff-accounts.js
 */

const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
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

// ============================================
// EDIT THIS SECTION WITH YOUR STAFF DETAILS
// ============================================

const staffMembers = [
  {
    email: 'dr.smith@orthopedicscare.com',
    password: 'TempPassword123!',  // They MUST change this on first login
    firstName: 'John',
    lastName: 'Smith',
    role: 'doctor',  // Options: doctor, nurse, billing_clerk, receptionist, etc.
    phone: '+254700000001',
    dateOfBirth: '1980-01-15'
  },
  {
    email: 'nurse.jane@orthopedicscare.com',
    password: 'TempPassword123!',
    firstName: 'Jane',
    lastName: 'Doe',
    role: 'nurse',
    phone: '+254700000002',
    dateOfBirth: '1985-03-20'
  },
  {
    email: 'billing@orthopedicscare.com',
    password: 'TempPassword123!',
    firstName: 'Mary',
    lastName: 'Johnson',
    role: 'billing_clerk',
    phone: '+254700000003',
    dateOfBirth: '1988-07-10'
  },
  {
    email: 'reception@orthopedicscare.com',
    password: 'TempPassword123!',
    firstName: 'Sarah',
    lastName: 'Williams',
    role: 'receptionist',
    phone: '+254700000004',
    dateOfBirth: '1992-11-25'
  }
  // Add more staff members here...
];

// ============================================
// DO NOT EDIT BELOW THIS LINE
// ============================================

async function createStaffAccounts() {
  console.log('🏥 Orthopedic Care - Staff Account Creation\n');
  console.log('═══════════════════════════════════════════════════════\n');
  console.log(`Creating ${staffMembers.length} staff accounts...\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const staff of staffMembers) {
    try {
      // Validate required fields
      if (!staff.email || !staff.password || !staff.firstName || !staff.lastName || !staff.role) {
        console.log(`❌ Skipping invalid entry - missing required fields`);
        failed++;
        continue;
      }

      // Check if user exists
      const existing = await db.collection('users')
        .where('email', '==', staff.email)
        .get();

      if (!existing.empty) {
        console.log(`⚠️  ${staff.email} already exists - skipping`);
        skipped++;
        continue;
      }

      // Hash password
      const passwordHash = await bcrypt.hash(staff.password, 10);

      // Create user
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const userData = {
        id: userId,
        email: staff.email,
        passwordHash: passwordHash,
        firstName: staff.firstName,
        lastName: staff.lastName,
        dateOfBirth: new Date(staff.dateOfBirth || '1990-01-01'),
        phoneNumber: staff.phone,
        address: {
          street: staff.address?.street || 'Orthopedic Care Clinic',
          city: staff.address?.city || 'Nairobi',
          state: staff.address?.state || 'Nairobi County',
          zipCode: staff.address?.zipCode || '00100',
          country: staff.address?.country || 'Kenya'
        },
        role: staff.role,
        failedLoginAttempts: 0,
        lockedUntil: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await db.collection('users').doc(userId).set(userData);

      console.log(`✅ Created: ${staff.firstName} ${staff.lastName}`);
      console.log(`   Email: ${staff.email}`);
      console.log(`   Role: ${staff.role}`);
      console.log(`   Temp Password: ${staff.password}`);
      console.log('');

      created++;

    } catch (error) {
      console.error(`❌ Error creating ${staff.email}:`, error.message);
      failed++;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('📊 Summary:');
  console.log(`   ✅ Created: ${created}`);
  console.log(`   ⚠️  Skipped (already exist): ${skipped}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log('═══════════════════════════════════════════════════════\n');

  if (created > 0) {
    console.log('⚠️  IMPORTANT NEXT STEPS:');
    console.log('   1. Send credentials to each staff member');
    console.log('   2. Instruct them to change password on first login');
    console.log('   3. Verify they can access appropriate features');
    console.log('   4. Enable MFA for all accounts (when available)\n');
    
    console.log('📧 Staff Credentials Summary:');
    console.log('═══════════════════════════════════════════════════════');
    staffMembers.forEach(staff => {
      console.log(`\n${staff.firstName} ${staff.lastName} (${staff.role})`);
      console.log(`Email: ${staff.email}`);
      console.log(`Temp Password: ${staff.password}`);
    });
    console.log('\n═══════════════════════════════════════════════════════\n');
  }

  console.log('🚀 Login URL: http://localhost:3000/login.html\n');
  process.exit(0);
}

// Run the script
createStaffAccounts().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
