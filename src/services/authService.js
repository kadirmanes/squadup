import {
  signInAnonymously,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  signInWithCredential,
  linkWithCredential,
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth } from './firebase';

// ── Web Client ID ──────────────────────────────────────────────
// Firebase Console → Authentication → Sign-in method → Google
// → Web SDK configuration → Web client ID
const WEB_CLIENT_ID = '142962124885-5as0nm72df2bjrrpv85b88k2skq85dvu.apps.googleusercontent.com';

GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });

// ──────────────────────────────────────────────────────────────

export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export async function signInAnon() {
  const credential = await signInAnonymously(auth);
  return credential.user;
}

export async function signInWithGoogle() {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const signInResult = await GoogleSignin.signIn();
  // SDK v13+ returns { data: { idToken } }
  const idToken = signInResult.data?.idToken ?? signInResult.idToken;
  const credential = GoogleAuthProvider.credential(idToken);

  const currentUser = auth.currentUser;

  // If current session is anonymous, try to upgrade/link it so the UID stays the same.
  // This prevents orphaned anonymous documents in Firestore.
  if (currentUser?.isAnonymous) {
    try {
      const result = await linkWithCredential(currentUser, credential);
      // UID preserved — no orphaned document
      return { user: result.user, previousAnonUid: null };
    } catch (linkErr) {
      if (linkErr.code === 'auth/credential-already-in-use') {
        // Google account already exists with a different UID — sign in normally.
        // Return the old anonymous UID so AuthContext can clean up its Firestore document.
        const previousAnonUid = currentUser.uid;
        const result = await signInWithCredential(auth, credential);
        return { user: result.user, previousAnonUid };
      }
      throw linkErr;
    }
  }

  const result = await signInWithCredential(auth, credential);
  return { user: result.user, previousAnonUid: null };
}

export async function signOut() {
  try {
    await GoogleSignin.signOut();
  } catch {
    // Google sign-out hatasını yoksay (anonim kullanıcıysa Google oturumu yok)
  }
  await firebaseSignOut(auth);
}

export function getCurrentUser() {
  return auth.currentUser;
}
