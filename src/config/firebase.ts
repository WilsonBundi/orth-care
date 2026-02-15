import admin from 'firebase-admin';
import dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config();

/**
 * Firebase Admin SDK Configuration
 * Initializes Firestore database connection
 */

let firebaseApp: admin.app.App;
let db: admin.firestore.Firestore;

export function initializeFirebase(): admin.firestore.Firestore {
  if (db) {
    return db;
  }

  try {
    // Initialize Firebase Admin SDK
    if (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64) {
      // Option 1: Use base64-encoded service account JSON (best for Render/Vercel)
      const serviceAccountJson = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, 'base64').toString('utf-8');
      const serviceAccount = JSON.parse(serviceAccountJson);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('🔥 Using Firebase service account from base64 environment variable');
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      // Option 2: Use service account JSON from environment variable
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('🔥 Using Firebase service account from environment variable');
    } else if (process.env.FIREBASE_CREDENTIALS_PATH) {
      // Option 2: Use service account JSON from file path
      const credentialsPath = path.resolve(process.env.FIREBASE_CREDENTIALS_PATH);
      if (!fs.existsSync(credentialsPath)) {
        throw new Error(`Firebase credentials file not found at: ${credentialsPath}`);
      }
      const serviceAccount = require(credentialsPath);
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log(`🔥 Using Firebase service account from file: ${credentialsPath}`);
    } else if (fs.existsSync(path.resolve('./firebase-credentials.json'))) {
      // Option 3: Auto-detect firebase-credentials.json in project root
      const serviceAccount = require(path.resolve('./firebase-credentials.json'));
      firebaseApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('🔥 Using Firebase service account from ./firebase-credentials.json');
    } else if (process.env.FIREBASE_PROJECT_ID) {
      // Option 4: Use project ID with application default credentials
      firebaseApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
      console.log('🔥 Using Firebase with application default credentials');
    } else {
      throw new Error(
        'Firebase configuration missing. Please set one of:\n' +
        '  1. FIREBASE_SERVICE_ACCOUNT (JSON string in .env)\n' +
        '  2. FIREBASE_CREDENTIALS_PATH (path to JSON file)\n' +
        '  3. Place firebase-credentials.json in project root\n' +
        '  4. FIREBASE_PROJECT_ID (requires gcloud auth)'
      );
    }

    db = firebaseApp.firestore();
    
    // Configure Firestore settings
    db.settings({
      ignoreUndefinedProperties: true,
    });

    console.log('✅ Firebase Firestore initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    throw error;
  }
}

/**
 * Get Firestore database instance
 */
export function getFirestore(): admin.firestore.Firestore {
  if (!db) {
    return initializeFirebase();
  }
  return db;
}

/**
 * Test Firebase connection
 */
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    const db = getFirestore();
    // Try to read from a test collection
    await db.collection('_health_check').limit(1).get();
    console.log('✅ Firebase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return false;
  }
}

/**
 * Close Firebase connection
 */
export async function closeFirebase(): Promise<void> {
  if (firebaseApp) {
    await firebaseApp.delete();
    console.log('Firebase connection closed');
  }
}

export { admin };
