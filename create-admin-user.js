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
    console.log('Creating admin user...');

    const adminEmail = 'admin@orthopedicscare.com';
    const adminPassword = 'Admin@123456'; // Change this!

    // Check if admin already exists
    const existingUsers = await db.collection('users')
      .where('email', '==', adminEmail)
      .get();

    if (!existingUsers.empty) {
      console.log('❌ Admin user already exists with email:', adminEmail);
      console.log('Use this email to login as admin');
      process.exit(0);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create admin user
    const userId = `user_${Date.now()}`;
    const adminUser = {
      id: userId,
      email: adminEmail,
      passwordHash: passwordHash,
      firstName: 'Admin',
      lastName: 'User',
      dateOfBirth: new Date('1990-01-01'),
      phoneNumber: '+254700000000',
      address: {
        street: '123 Admin Street',
        city: 'Nairobi',
        state: 'Nairobi',
        zipCode: '00100',
        country: 'Kenya'
      },
      role: 'admin', // This is the key!
      failedLoginAttempts: 0,
      lockedUntil: null,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('users').doc(userId).set(adminUser);

    console.log('✅ Admin user created successfully!');
    console.log('\n📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('\n⚠️  IMPORTANT: Change the password after first login!');
    console.log('\n🚀 You can now login at: http://localhost:3000/login.html');
    console.log('   After login, you will see admin options on the dashboard');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
