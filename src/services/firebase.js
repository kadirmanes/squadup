import { initializeApp, getApps } from 'firebase/app';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Firebase Configuration ───────────────────────────────────────────────────
// Replace these values with your actual Firebase project config from:
// Firebase Console → Project Settings → General → Your Apps → Firebase SDK snippet
const firebaseConfig = {
  apiKey: 'AIzaSyD5VhccfEas7nnVs54oTTcPhOpsCP7-nzI',
  authDomain: 'squadup-7210c.firebaseapp.com',
  projectId: 'squadup-7210c',
  storageBucket: 'squadup-7210c.firebasestorage.app',
  messagingSenderId: '142962124885',
  appId: '1:142962124885:web:6d176e51b3adce8a534cdc',
};

let app;
let auth;
let db;
let storage;

try {
  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } else {
    app = getApps()[0];
    auth = getAuth(app);
  }

  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error('[Firebase] Initialization error:', error.message);
}

export { app, auth, db, storage };
