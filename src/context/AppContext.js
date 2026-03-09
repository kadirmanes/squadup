import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { getAllPlayers, subscribeToPlayers, subscribeToRequests, subscribeFriendRequests } from '../services/firestoreService';
import { subscribeToChats, getChats } from '../services/chatService';
import { registerForPushNotifications } from '../services/notificationService';
import { useAuth } from './AuthContext';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const { uid, isOnboarded } = useAuth();
  const [players, setPlayers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [chats, setChats] = useState([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [chatsError, setChatsError] = useState(null);
  const [playersError, setPlayersError] = useState(null);

  // Load players when user is onboarded
  const loadPlayers = useCallback(async () => {
    if (!uid || !isOnboarded) return;
    setIsLoadingPlayers(true);
    setPlayersError(null);
    try {
      // Pass uid so getAllPlayers filters out the current user at source
      const data = await getAllPlayers(uid);
      setPlayers(data);
    } catch (err) {
      console.warn('[AppContext] Error loading players:', err.message);
      setPlayersError('Failed to load players. Pull to refresh.');
    } finally {
      setIsLoadingPlayers(false);
    }
  }, [uid, isOnboarded]);

  // Subscribe to players (live updates for both seeds and real users)
  useEffect(() => {
    if (!uid || !isOnboarded) return;
    loadPlayers();

    // Pass uid so subscription also filters out current user and
    // subscribes to users collection for real-time online status
    const unsubscribe = subscribeToPlayers((updatedPlayers) => {
      setPlayers(updatedPlayers);
    }, uid);

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

  // Subscribe to friend requests
  useEffect(() => {
    if (!uid || !isOnboarded) return;

    const unsubscribe = subscribeFriendRequests(uid, (updated) => {
      setFriendRequests(updated.sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() ?? 0;
        const bTime = b.createdAt?.toMillis?.() ?? 0;
        return bTime - aTime;
      }));
    });

    return unsubscribe;
  }, [uid, isOnboarded]);

  // Manual chat refresh (fallback when subscription fails)
  const refreshChats = useCallback(async () => {
    if (!uid) return;
    setIsLoadingChats(true);
    setChatsError(null);
    try {
      const data = await getChats(uid);
      setChats(data);
    } catch (err) {
      console.warn('[AppContext] refreshChats error:', err.message);
      setChatsError('Kadrolar yüklenemedi: ' + err.message);
    } finally {
      setIsLoadingChats(false);
    }
  }, [uid]);

  // Subscribe to chats (real-time); falls back to manual refresh on error
  useEffect(() => {
    if (!uid || !isOnboarded) return;
    setIsLoadingChats(true);
    setChatsError(null);

    const unsubscribe = subscribeToChats(
      uid,
      (updatedChats) => {
        setChats(updatedChats);
        setChatsError(null);
        setIsLoadingChats(false);
      },
      (err) => {
        // Real-time listener failed — try one-time fetch as fallback
        setChatsError('Gerçek zamanlı bağlantı kurulamadı. Yenilemeyi dene.');
        setIsLoadingChats(false);
        // Attempt fallback fetch
        getChats(uid)
          .then((data) => { setChats(data); setChatsError(null); })
          .catch(() => {});
      },
    );

    return unsubscribe;
  }, [uid, isOnboarded]);

  // Register for push notifications
  useEffect(() => {
    if (!uid || !isOnboarded) return;
    registerForPushNotifications(uid);
  }, [uid, isOnboarded]);

  const pendingRequestCount = requests.filter(
    (r) => r.toUid === uid && r.status === 'pending',
  ).length;

  const pendingFriendRequestCount = friendRequests.filter(
    (r) => r.toUid === uid && r.status === 'pending',
  ).length;

  // Set of UIDs the current user is friends with (accepted requests)
  const friendUids = useMemo(() => {
    const set = new Set();
    friendRequests.forEach((r) => {
      if (r.status !== 'accepted') return;
      if (r.fromUid === uid) set.add(r.toUid);
      else if (r.toUid === uid) set.add(r.fromUid);
    });
    return set;
  }, [friendRequests, uid]);

  // Set of UIDs for whom we have a pending outgoing friend request
  const pendingFriendUids = useMemo(() => {
    const set = new Set();
    friendRequests.forEach((r) => {
      if (r.fromUid === uid && r.status === 'pending') set.add(r.toUid);
    });
    return set;
  }, [friendRequests, uid]);

  return (
    <AppContext.Provider
      value={{
        players,
        requests,
        friendRequests,
        chats,
        isLoadingPlayers,
        isLoadingRequests,
        isLoadingChats,
        chatsError,
        playersError,
        pendingRequestCount,
        pendingFriendRequestCount,
        friendUids,
        pendingFriendUids,
        refreshPlayers: loadPlayers,
        refreshChats,
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
