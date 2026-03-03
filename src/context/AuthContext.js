import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'nomadwise_user_v1';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate from storage
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => { if (raw) setUser(JSON.parse(raw)); })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const persist = async (data) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setUser(data);
  };

  const login = useCallback(async (email, password) => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) throw new Error('Bu e-posta ile kayıtlı hesap bulunamadı.');
    const stored = JSON.parse(raw);
    if (stored.email.toLowerCase() !== email.toLowerCase())
      throw new Error('Bu e-posta ile kayıtlı hesap bulunamadı.');
    if (stored.password !== password)
      throw new Error('Şifre yanlış. Lütfen tekrar deneyin.');
    setUser(stored);
  }, []);

  const register = useCallback(async (name, email, password) => {
    // Check if email already registered
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw);
      if (stored.email.toLowerCase() === email.toLowerCase())
        throw new Error('Bu e-posta adresi zaten kayıtlı.');
    }
    const newUser = { name, email: email.toLowerCase(), password, phone: '', city: '', bio: '', birthDate: '' };
    await persist(newUser);
  }, []);

  const updateProfile = useCallback(async (data) => {
    const updated = { ...user, ...data };
    await persist(updated);
  }, [user]);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
