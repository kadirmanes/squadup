import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { subscribeToAuthState, signInAnon } from '../services/authService';
import { getUser, setUserOnline } from '../services/firestoreService';
import { seedProfileService } from '../services/seedProfileService';

const AuthContext = createContext(null);

const ONBOARDING_KEY = '@squadup_onboarded';

export function AuthProvider({ children }) {
  const [uid, setUid] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const unsubscribe = subscribeToAuthState(async (firebaseUser) => {
      if (!mounted) return;

      if (firebaseUser) {
        setUid(firebaseUser.uid);

        try {
          const [profile, onboardedFlag] = await Promise.all([
            getUser(firebaseUser.uid),
            AsyncStorage.getItem(ONBOARDING_KEY),
          ]);

          if (mounted) {
            setUserProfile(profile);
            setIsOnboarded(onboardedFlag === 'true' && profile !== null);
          }

          if (profile) setUserOnline(firebaseUser.uid, true);

          // Initialize seed profiles in background
          seedProfileService.initialize();
        } catch (err) {
          console.warn('[AuthContext] Error loading user:', err.message);
          if (mounted) {
            setUserProfile(null);
            setIsOnboarded(false);
          }
        }
      } else {
        try {
          await signInAnon();
        } catch (err) {
          console.error('[AuthContext] Anonymous sign-in failed:', err.message);
          if (mounted) setIsLoading(false);
        }
        return;
      }

      if (mounted) setIsLoading(false);
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

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
      const { signOut } = await import('../services/authService');
      await signOut();
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
