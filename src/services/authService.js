import { signInAnonymously, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './firebase';

export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function signInAnon() {
  const credential = await signInAnonymously(auth);
  return credential.user;
}

export async function signOut() {
  await firebaseSignOut(auth);
}

export function getCurrentUser() {
  return auth.currentUser;
}
