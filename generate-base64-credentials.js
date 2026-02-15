/**
 * Generate Base64 Encoded Firebase Credentials
 * Run this script to get a base64-encoded version of your Firebase credentials
 * that works perfectly with Render and other hosting platforms
 */

const fs = require('fs');
const path = require('path');

// Read the firebase-credentials.json file
const credentialsPath = path.join(__dirname, 'firebase-credentials.json');

if (!fs.existsSync(credentialsPath)) {
  console.error('❌ Error: firebase-credentials.json not found!');
  console.log('\nPlease make sure firebase-credentials.json exists in the project root.');
  process.exit(1);
}

try {
  // Read the file
  const credentialsJson = fs.readFileSync(credentialsPath, 'utf-8');
  
  // Validate it's valid JSON
  JSON.parse(credentialsJson);
  
  // Convert to base64
  const base64Credentials = Buffer.from(credentialsJson).toString('base64');
  
  console.log('\n✅ Success! Your base64-encoded Firebase credentials:\n');
  console.log('═'.repeat(80));
  console.log(base64Credentials);
  console.log('═'.repeat(80));
  
  console.log('\n📋 How to use in Render:\n');
  console.log('1. Go to your Render dashboard');
  console.log('2. Click on your service → Environment tab');
  console.log('3. Add a new environment variable:');
  console.log('   Name: FIREBASE_SERVICE_ACCOUNT_BASE64');
  console.log('   Value: [paste the base64 string above]');
  console.log('4. Save and redeploy\n');
  
  console.log('✨ This method avoids all escaping issues!\n');
  
} catch (error) {
  console.error('❌ Error reading or parsing firebase-credentials.json:', error.message);
  process.exit(1);
}
