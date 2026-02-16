/**
 * Script to check if admin user exists in Firebase
 * Run with: node check-admin.js
 */

const admin = require('firebase-admin');
require('dotenv').config();

console.log('🔍 Checking for admin user...\n');

// Check environment variables first
if (!process.env.FIREBASE_SERVICE_ACCOUNT && !process.env.FIREBASE_CREDENTIALS_BASE64) {
  console.log('❌ Firebase credentials not found in .env file');
  console.log('💡 Please add either FIREBASE_SERVICE_ACCOUNT or FIREBASE_CREDENTIALS_BASE64');
  console.log('   See: FIREBASE_SETUP.md for instructions\n');
  process.exit(1);
}

if (!process.env.FIREBASE_PROJECT_ID) {
  console.log('❌ FIREBASE_PROJECT_ID not found in .env file');
  console.log('💡 Please add FIREBASE_PROJECT_ID to your .env file\n');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log('   Project ID:', process.env.FIREBASE_PROJECT_ID);

// Initialize Firebase Admin
try {
  let serviceAccount;
  if (process.env.FIREBASE_CREDENTIALS_BASE64) {
    serviceAccount = JSON.parse(
      Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64, 'base64').toString('utf-8')
    );
  } else {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });

  console.log('✅ Firebase initialized\n');
} catch (error) {
  console.log('❌ Failed to initialize Firebase:', error.message);
  console.log('💡 Check your Firebase credentials are valid\n');
  process.exit(1);
}

const db = admin.firestore();

async function checkAdmin() {
  try {
    console.log('🔍 Searching for admin user...');
    
    const users = await db.collection('users')
      .where('email', '==', 'admin@orthopedicscare.com')
      .get();
    
    if (users.empty) {
      console.log('\n❌ Admin user NOT found in database');
      console.log('\n💡 To create admin user, run:');
      console.log('   node create-admin-user.js\n');
      process.exit(1);
    }
    
    const user = users.docs[0].data();
    console.log('\n✅ Admin user found!');
    console.log('\n📋 User Details:');
    console.log('   Email:', user.email);
    console.log('   Name:', user.firstName, user.lastName);
    console.log('   Role:', user.role);
    console.log('   Phone:', user.phoneNumber);
    console.log('   Created:', user.createdAt?.toDate?.() || user.createdAt);
    
    if (user.role !== 'admin') {
      console.log('\n⚠️  WARNING: User role is not "admin"!');
      console.log('   Current role:', user.role);
      console.log('\n💡 To fix, run:');
      console.log('   node make-user-admin.js admin@orthopedicscare.com\n');
    } else {
      console.log('\n✅ User has admin role - ready to login!');
      console.log('\n🔑 Login Credentials:');
      console.log('   Email: admin@orthopedicscare.com');
      console.log('   Password: Admin@123456');
      console.log('\n🌐 Login URL:');
      console.log('   http://localhost:3000/login.html\n');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error checking admin user:', error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. Firebase is properly configured');
    console.log('   2. You have internet connection');
    console.log('   3. Firestore is enabled in your Firebase project\n');
    process.exit(1);
  }
}

checkAdmin();
