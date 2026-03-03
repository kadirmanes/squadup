import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { getAllPlayers, subscribeToPlayers, subscribeToRequests } from '../services/firestoreService';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { uid, isOnboarded } = useAuth();
  const [players, setPlayers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [playersError, setPlayersError] = useState(null);

  // Load players when user is onboarded
  const loadPlayers = useCallback(async () => {
    if (!uid || !isOnboarded) return;
    setIsLoadingPlayers(true);
    setPlayersError(null);
    try {
      const data = await getAllPlayers();
      // Filter out the current user from player list
      setPlayers(data.filter((p) => p.uid !== uid));
    } catch (err) {
      console.warn('[AppContext] Error loading players:', err.message);
      setPlayersError('Failed to load players. Pull to refresh.');
    } finally {
      setIsLoadingPlayers(false);
    }
  }, [uid, isOnboarded]);

  // Subscribe to players (live seed updates)
  useEffect(() => {
    if (!uid || !isOnboarded) return;
    loadPlayers();

    const unsubscribe = subscribeToPlayers((updatedPlayers) => {
      setPlayers(updatedPlayers.filter((p) => p.uid !== uid));
    });

    return unsubscribe;
  }, [uid, isOnboarded]);

  // Subscribe to match requests
  useEffect(() => {
    if (!uid || !isOnboarded) return;
    setIsLoadingRequests(true);

    const unsubscribe = subscribeToRequests(uid, (updatedRequests) => {
      setRequests(updatedRequests.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      }));
      setIsLoadingRequests(false);
    });

    return unsubscribe;
  }, [uid, isOnboarded]);

  const pendingRequestCount = requests.filter(
    (r) => r.toUid === uid && r.status === 'pending',
  ).length;

  return (
    <AppContext.Provider
      value={{
        players,
        requests,
        isLoadingPlayers,
        isLoadingRequests,
        playersError,
        pendingRequestCount,
        refreshPlayers: loadPlayers,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
