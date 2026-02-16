/**
 * Test login credentials
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
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID
});

const db = admin.firestore();

async function testLogin() {
  const email = 'admin@orthopedicscare.com';
  const password = 'SuperAdmin@2026!';
  
  console.log('🔐 Testing login credentials...\n');
  console.log('Email:', email);
  console.log('Password:', password);
  console.log('');
  
  try {
    // Find user
    const usersSnapshot = await db.collection('users')
      .where('email', '==', email)
      .get();
    
    if (usersSnapshot.empty) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    const userData = usersSnapshot.docs[0].data();
    console.log('✅ User found in database');
    console.log('   Name:', userData.firstName, userData.lastName);
    console.log('   Role:', userData.role);
    console.log('');
    
    // Test password
    const isValid = await bcrypt.compare(password, userData.passwordHash);
    
    if (isValid) {
      console.log('✅ Password is CORRECT!');
      console.log('');
      console.log('🎯 Login should work with these credentials:');
      console.log('   Email:', email);
      console.log('   Password:', password);
      console.log('');
      console.log('🌐 Try logging in at: http://localhost:3000/login.html');
    } else {
      console.log('❌ Password is INCORRECT!');
      console.log('');
      console.log('💡 The password in the database does not match.');
      console.log('   Run: node upgrade-to-super-admin.js to reset it');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testLogin();
