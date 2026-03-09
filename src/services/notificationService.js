import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { GAMES } from '../constants/games';

// Android 8+ requires a notification channel
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'SquadUp',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#6366F1',
    sound: 'default',
  });
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(uid) {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;
    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('[Notifications] Permission not granted:', finalStatus);
      return null;
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.warn('[Notifications] No projectId found in app.json');
    }
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = tokenData.data;
    console.log('[Notifications] Push token:', token);
    await updateDoc(doc(db, 'users', uid), { expoPushToken: token });
    return token;
  } catch (err) {
    console.warn('[Notifications] Registration error:', err.message);
    return null;
  }
}

export async function sendPushNotification(expoPushToken, title, body) {
  if (!expoPushToken) return;
  try {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: expoPushToken, sound: 'default', title, body }),
    });
  } catch (err) {
    console.warn('[Notifications] Send error:', err.message);
  }
}

// ─── Friend Online Notifications ──────────────────────────────────────────────
// When a user comes online, notify their friends specifically.

export async function notifyFriendsOnline(uid, username, friendIds) {
  if (!friendIds?.length || !username) return;
  try {
    const tokens = [];
    // Fetch in parallel (max 30 friends at a time to avoid thundering herd)
    await Promise.all(
      friendIds.slice(0, 30).map(async (friendId) => {
        try {
          const snap = await getDoc(doc(db, 'users', friendId));
          if (snap.exists() && snap.data().expoPushToken) {
            tokens.push(snap.data().expoPushToken);
          }
        } catch {}
      }),
    );
    if (!tokens.length) return;

    const messages = tokens.map((token) => ({
      to: token,
      sound: 'default',
      title: '🟢 Arkadaşın Çevrimiçi!',
      body: `${username} artık çevrimiçi!`,
    }));

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
  } catch (err) {
    console.warn('[Notifications] notifyFriendsOnline error:', err.message);
  }
}

// ─── Game-based Online Notifications ───────────────────────────────────────────
// When a user comes online, notify other players of the same games.
// Spam prevention: each user can broadcast at most once every 30 minutes.

const NOTIFY_COOLDOWN_MS = 30 * 60 * 1000; // 30 minutes

export async function notifyGamePlayers(uid, username, gameIds) {
  if (!gameIds?.length || !username) return;

  try {
    // ── 1. Spam prevention: check last broadcast time ──
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const lastSent = userSnap.data().lastOnlineNotificationAt?.toDate?.();
      if (lastSent && Date.now() - lastSent.getTime() < NOTIFY_COOLDOWN_MS) {
        return;
      }
    }

    // ── 2. Query players with matching gameIds ──
    const q = query(
      collection(db, 'users'),
      where('gameIds', 'array-contains-any', gameIds.slice(0, 10)),
    );
    const snap = await getDocs(q);

    const tokens = [];
    snap.forEach((d) => {
      const data = d.data();
      if (d.id === uid) return;           // exclude self
      if (!data.expoPushToken) return;    // need push token
      tokens.push(data.expoPushToken);
    });

    if (!tokens.length) return;

    // ── 3. Update cooldown timestamp before sending ──
    await updateDoc(userRef, { lastOnlineNotificationAt: serverTimestamp() });

    // ── 4. Build notification body ──
    const gameLabels = gameIds
      .slice(0, 2)
      .map((id) => GAMES.find((g) => g.id === id)?.name ?? id.toUpperCase())
      .join(', ');

    const messages = tokens.map((token) => ({
      to: token,
      sound: 'default',
      title: '🎮 Oyuncu Çevrimiçi!',
      body: `${username} ${gameLabels} oynamak istiyor!`,
    }));

    // ── 5. Send in batches of 100 (Expo API limit) ──
    for (let i = 0; i < messages.length; i += 100) {
      const batch = messages.slice(i, i + 100);
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batch),
      });
    }
  } catch (err) {
    console.warn('[Notifications] notifyGamePlayers error:', err.message);
  }
}
