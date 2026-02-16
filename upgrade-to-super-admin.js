/**
 * Script to upgrade existing admin user to super_admin role
 * Run with: node upgrade-to-super-admin.js
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
  process.exit(1);
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = admin.firestore();

async function upgradeToSuperAdmin() {
  try {
    console.log('🔄 Upgrading existing admin to Super Administrator...\n');

    const adminEmail = 'admin@orthopedicscare.com';
    const newPassword = 'SuperAdmin@2026!'; // New strong password

    // Find existing admin user
    const usersSnapshot = await db.collection('users')
      .where('email', '==', adminEmail)
      .get();

    if (usersSnapshot.empty) {
      console.log('❌ No user found with email:', adminEmail);
      console.log('💡 Run: node create-admin-user.js to create new Super Admin');
      process.exit(1);
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    console.log('📋 Current User:');
    console.log('   Email:', userData.email);
    console.log('   Name:', userData.firstName, userData.lastName);
    console.log('   Current Role:', userData.role);
    console.log('');

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user to super_admin with new password
    await userDoc.ref.update({
      role: 'super_admin',
      passwordHash: passwordHash,
      firstName: 'Super',
      lastName: 'Administrator',
      updatedAt: new Date()
    });

    console.log('✅ Successfully upgraded to Super Administrator!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 New Password:', newPassword);
    console.log('👤 New Role: Super Administrator (Level 9)');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('🎯 Super Administrator Capabilities:');
    console.log('   ✓ Complete system control');
    console.log('   ✓ User and role management');
    console.log('   ✓ System configuration');
    console.log('   ✓ All clinical and administrative functions');
    console.log('   ✓ Emergency access controls');
    console.log('   ✓ Data management and exports\n');
    
    console.log('⚠️  IMPORTANT:');
    console.log('   1. Password has been changed to:', newPassword);
    console.log('   2. Old password will no longer work');
    console.log('   3. Change this password after first login');
    console.log('   4. Enable MFA for this account\n');
    
    console.log('🚀 Login at: http://localhost:3000/login.html');
    console.log('   Use the new credentials above\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error upgrading user:', error);
    process.exit(1);
  }
}

upgradeToSuperAdmin();
