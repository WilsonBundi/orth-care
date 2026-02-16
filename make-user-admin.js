/**
 * Script to make an existing user an admin
 * Run with: node make-user-admin.js your-email@example.com
 */

const admin = require('firebase-admin');
require('dotenv').config();

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.log('❌ Please provide an email address');
  console.log('Usage: node make-user-admin.js your-email@example.com');
  process.exit(1);
}

// Initialize Firebase Admin
try {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_CREDENTIALS_BASE64 || '', 'base64').toString('utf-8')
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID
  });
} catch (error) {
  console.error('❌ Failed to initialize Firebase:', error.message);
  console.log('\n💡 Make sure your .env file has:');
  console.log('   - FIREBASE_CREDENTIALS_BASE64');
  console.log('   - FIREBASE_PROJECT_ID');
  process.exit(1);
}

const db = admin.firestore();

async function makeUserAdmin(userEmail) {
  try {
    console.log(`\n🔍 Looking for user: ${userEmail}...`);

    const usersSnapshot = await db.collection('users')
      .where('email', '==', userEmail)
      .get();

    if (usersSnapshot.empty) {
      console.log('❌ User not found with email:', userEmail);
      console.log('\n💡 Make sure the user has registered first');
      console.log('   Or use: node create-admin-user.js to create a new admin');
      process.exit(1);
    }

    const userDoc = usersSnapshot.docs[0];
    const userData = userDoc.data();

    console.log(`✅ Found user: ${userData.firstName} ${userData.lastName}`);
    console.log(`   Current role: ${userData.role}`);

    if (userData.role === 'admin') {
      console.log('\n✅ User is already an admin!');
      process.exit(0);
    }

    // Update role to admin
    await userDoc.ref.update({ 
      role: 'admin',
      updatedAt: new Date()
    });

    console.log('\n✅ User is now an admin!');
    console.log('\n📋 Next steps:');
    console.log('   1. User should logout');
    console.log('   2. Clear browser cache/localStorage');
    console.log('   3. Login again');
    console.log('   4. Dashboard will show admin options');
    console.log('\n🔗 Admin pages:');
    console.log('   - http://localhost:3000/admin-dashboard.html');
    console.log('   - http://localhost:3000/medical-records.html');
    console.log('   - http://localhost:3000/billing.html');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating user:', error);
    process.exit(1);
  }
}

makeUserAdmin(email);
