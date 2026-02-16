/**
 * Script to create an admin user in Firebase
 * Run with: node create-admin-user.js
 */

const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
require('dotenv').config();

// Initialize Firebase Admin
let serviceAccount;
if (process.env.FIREBASE_CREDENTIALS_BASE64) {
  serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf-8')
  );
} else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
} else {
  console.error('❌ Firebase credentials not found in .env file');
  console.log('💡 Please add either FIREBASE_SERVICE_ACCOUNT or FIREBASE_CREDENTIALS_BASE64');
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = admin.firestore();

async function createAdminUser() {
  try {
    console.log('Creating Super Administrator user...\n');

    const adminEmail = 'admin@orthopedicscare.com';
    const adminPassword = 'SuperAdmin@2026!'; // Strong password

    // Check if admin already exists
    const existingUsers = await db.collection('users')
      .where('email', '==', adminEmail)
      .get();

    if (!existingUsers.empty) {
      console.log('❌ Super Admin user already exists with email:', adminEmail);
      console.log('✅ Use this email to login as Super Administrator');
      console.log('\n📋 Existing User Details:');
      const existingUser = existingUsers.docs[0].data();
      console.log('   Role:', existingUser.role);
      console.log('   Name:', existingUser.firstName, existingUser.lastName);
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create super admin user
    const userId = `user_${Date.now()}`;
    const adminUser = {
      id: userId,
      email: adminEmail,
      passwordHash: passwordHash,
      firstName: 'Super',
      lastName: 'Administrator',
      dateOfBirth: new Date('1990-01-01'),
      phoneNumber: '+254700000000',
      address: {
        street: 'Orthopedic Care Clinic',
        city: 'Nairobi',
        state: 'Nairobi County',
        zipCode: '00100',
        country: 'Kenya'
      },
      role: 'super_admin', // Highest privilege level
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('users').doc(userId).set(adminUser);

    console.log('✅ Super Administrator created successfully!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('👤 Role: Super Administrator (Highest Privilege)');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('🎯 Super Administrator Capabilities:');
    console.log('   ✓ Complete system control');
    console.log('   ✓ User and role management');
    console.log('   ✓ System configuration');
    console.log('   ✓ All clinical and administrative functions');
    console.log('   ✓ Emergency access controls');
    console.log('   ✓ Data management and exports\n');
    
    console.log('⚠️  SECURITY IMPORTANT:');
    console.log('   1. Change this password immediately after first login');
    console.log('   2. Enable MFA for this account');
    console.log('   3. Never share these credentials');
    console.log('   4. Use this account only for system administration\n');
    
    console.log('🚀 Login at: http://localhost:3000/login.html');
    console.log('   After login, you will have full system access\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating Super Administrator:', error);
    process.exit(1);
  }
}

createAdminUser();
