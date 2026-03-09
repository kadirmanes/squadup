import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscribeToAuthState, signInAnon, signInWithGoogle as googleSignIn, signOut as authSignOut } from '../services/authService';
import { getUser, setUserOnline, deleteUserDocument } from '../services/firestoreService';
import { seedProfileService } from '../services/seedProfileService';
import { notifyGamePlayers, notifyFriendsOnline } from '../services/notificationService';

const AuthContext = createContext(null);

const ONBOARDING_KEY = '@squadup_onboarded';

export function AuthProvider({ children }) {
  const [uid, setUid] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  // Google sign-in işlem durumu (LoginScreen'de kullanılır)
  const [isSigningIn, setIsSigningIn] = useState(false);
  // Tracks old anonymous UID to clean up after Google sign-in
  const pendingCleanupRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (!mounted) return;

      if (firebaseUser) {
        setUid(firebaseUser.uid);

        // Clean up orphaned anonymous document if UID changed after Google sign-in
        if (pendingCleanupRef.current && pendingCleanupRef.current !== firebaseUser.uid) {
          deleteUserDocument(pendingCleanupRef.current).catch(console.warn);
          pendingCleanupRef.current = null;
        }

        try {
          const [profile, onboardedFlag] = await Promise.all([
            getUser(firebaseUser.uid),
            AsyncStorage.getItem(ONBOARDING_KEY),
          ]);

          if (mounted) {
            setUserProfile(profile);
            setIsOnboarded(onboardedFlag === 'true' && profile !== null);
          }

          if (profile) {
            setUserOnline(firebaseUser.uid, true);
            // Notify friends that this user is online (targeted, no cooldown needed)
            const friendIds = profile.friendIds ?? [];
            if (friendIds.length && profile.username) {
              notifyFriendsOnline(firebaseUser.uid, profile.username, friendIds).catch(console.warn);
            }
            // Notify same-game players that this user is online (fire-and-forget)
            const gameIds = profile.gameIds || profile.games?.map((g) => g.gameId) || [];
            if (gameIds.length && profile.username) {
              notifyGamePlayers(firebaseUser.uid, profile.username, gameIds).catch(console.warn);
            }
          }

          seedProfileService.initialize();
        } catch (err) {
          console.warn('[AuthContext] Error loading user:', err.message);
          if (mounted) {
            setUserProfile(null);
            setIsOnboarded(false);
          }
        }
      } else {
        // Kullanıcı yok — login ekranını göster
        if (mounted) {
          setUid(null);
          setUserProfile(null);
          setIsOnboarded(false);
        }
      }

      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // ── AppState: mark online/offline as app moves to foreground/background ──
  useEffect(() => {
    if (!uid) return;

    const handleAppStateChange = (nextState) => {
      if (nextState === 'active') {
        setUserOnline(uid, true);
      } else {
        // 'background' or 'inactive' (covers home button, task switcher, force-kill)
        setUserOnline(uid, false);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [uid]);

  const signInWithGoogle = async () => {
    setIsSigningIn(true);
    try {
      const { previousAnonUid } = await googleSignIn();
      // If UID is going to change (credential-already-in-use path),
      // store the old anonymous UID so the auth state handler can delete it
      if (previousAnonUid) {
        pendingCleanupRef.current = previousAnonUid;
      }
      // Auth state değişimi yukarıdaki listener'ı tetikler
    } finally {
      setIsSigningIn(false);
    }
  };

  const continueAsGuest = async () => {
    setIsSigningIn(true);
    try {
      await signInAnon();
    } finally {
      setIsSigningIn(false);
    }
  };

  const completeOnboarding = async (profile) => {
    setUserProfile(profile);
    setIsOnboarded(true);
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
  };

  const refreshProfile = async () => {
    if (!uid) return;
    try {
      const profile = await getUser(uid);
      setUserProfile(profile);
    } catch (err) {
      console.warn('[AuthContext] Refresh error:', err.message);
    }
  };

  const handleSignOut = async () => {
    try {
      if (uid) await setUserOnline(uid, false);
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      await authSignOut();
      setUid(null);
      setUserProfile(null);
      setIsOnboarded(false);
    } catch (err) {
      console.warn('[AuthContext] Sign-out error:', err.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        uid,
        userProfile,
        isOnboarded,
        isLoading,
        isSigningIn,
        signInWithGoogle,
        continueAsGuest,
        completeOnboarding,
        refreshProfile,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
