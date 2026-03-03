import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Firebase Configuration ───────────────────────────────────────────────────
// Replace these values with your actual Firebase project config from:
// Firebase Console → Project Settings → General → Your Apps → Firebase SDK snippet
const firebaseConfig = {
  apiKey: 'AIzaSyPLACEHOLDER_REPLACE_WITH_YOUR_API_KEY',
  authDomain: 'squadup-app.firebaseapp.com',
  projectId: 'squadup-app',
  storageBucket: 'squadup-app.appspot.com',
  messagingSenderId: '123456789012',
  appId: '1:123456789012:web:abcdef1234567890abcdef',
  measurementId: 'G-XXXXXXXXXX',
};

let app;
let auth;
let db;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0];
  }

  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });

  db = getFirestore(app);
} catch (error) {
  console.error('[Firebase] Initialization error:', error.message);
}

export { app, auth, db };
