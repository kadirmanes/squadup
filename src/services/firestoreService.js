import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  onSnapshot,
  serverTimestamp,
  orderBy,
  limit,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── User Operations ───────────────────────────────────────────────────────────

export async function createUser(uid, userData) {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, {
    uid,
    username: userData.username,
    games: userData.games || [],
    vibe: userData.vibe || 'chill',
    isOnline: true,
    isSeed: false,
    lastSeen: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
}

export async function getUser(uid) {
  const ref = doc(db, 'users', uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function updateUser(uid, updates) {
  const ref = doc(db, 'users', uid);
  await updateDoc(ref, { ...updates, lastSeen: serverTimestamp() });
}

export async function setUserOnline(uid, isOnline) {
  try {
    const ref = doc(db, 'users', uid);
    await updateDoc(ref, { isOnline, lastSeen: serverTimestamp() });
  } catch {
    // Silently fail — not critical
  }
}

// ─── Player Listing ────────────────────────────────────────────────────────────

export async function getAllPlayers() {
  const results = [];

  // Fetch real users
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    usersSnap.forEach((d) => results.push({ ...d.data(), id: d.id, source: 'user' }));
  } catch (err) {
    console.warn('[Firestore] Error fetching users:', err.message);
  }

  // Fetch seed profiles
  try {
    const seedsSnap = await getDocs(collection(db, 'seed_profiles'));
    seedsSnap.forEach((d) => results.push({ ...d.data(), id: d.id, source: 'seed' }));
  } catch (err) {
    console.warn('[Firestore] Error fetching seeds:', err.message);
  }

  // Shuffle
  return results.sort(() => Math.random() - 0.5);
}

export function subscribeToPlayers(callback) {
  // Subscribe to seed_profiles for live updates
  const seedUnsub = onSnapshot(
    collection(db, 'seed_profiles'),
    { includeMetadataChanges: false },
    () => {
      // Trigger a full refresh when seeds change
      getAllPlayers().then(callback).catch(console.warn);
    },
    (err) => console.warn('[Firestore] Seed subscription error:', err.message),
  );

  return seedUnsub;
}

// ─── Match Requests ────────────────────────────────────────────────────────────

export async function sendMatchRequest(fromUid, toUid, gameId) {
  // Prevent duplicate pending requests
  const q = query(
    collection(db, 'match_requests'),
    where('fromUid', '==', fromUid),
    where('toUid', '==', toUid),
    where('gameId', '==', gameId),
    where('status', '==', 'pending'),
  );
  const existing = await getDocs(q);
  if (!existing.empty) {
    return existing.docs[0].id;
  }

  const ref = await addDoc(collection(db, 'match_requests'), {
    fromUid,
    toUid,
    gameId,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
  return ref.id;
}

export async function respondToRequest(requestId, status) {
  const ref = doc(db, 'match_requests', requestId);
  await updateDoc(ref, { status, respondedAt: serverTimestamp() });
}

export function subscribeToRequests(uid, callback) {
  const sentQ = query(collection(db, 'match_requests'), where('fromUid', '==', uid), orderBy('createdAt', 'desc'), limit(50));
  const receivedQ = query(collection(db, 'match_requests'), where('toUid', '==', uid), orderBy('createdAt', 'desc'), limit(50));

  const sent = [];
  const received = [];

  const sentUnsub = onSnapshot(sentQ, (snap) => {
    sent.length = 0;
    snap.forEach((d) => sent.push({ id: d.id, ...d.data() }));
    callback([...sent, ...received]);
  });

  const receivedUnsub = onSnapshot(receivedQ, (snap) => {
    received.length = 0;
    snap.forEach((d) => received.push({ id: d.id, ...d.data() }));
    callback([...sent, ...received]);
  });

  return () => {
    sentUnsub();
    receivedUnsub();
  };
}

// ─── Seed Profiles ─────────────────────────────────────────────────────────────

export async function seedProfilesExist() {
  const snap = await getDocs(query(collection(db, 'seed_profiles'), limit(1)));
  return !snap.empty;
}

export async function writeSeedProfiles(profiles) {
  const batchSize = 20;
  for (let i = 0; i < profiles.length; i += batchSize) {
    const batch = writeBatch(db);
    const chunk = profiles.slice(i, i + batchSize);
    chunk.forEach((p) => {
      const ref = doc(db, 'seed_profiles', p.uid);
      batch.set(ref, { ...p, createdAt: serverTimestamp() });
    });
    await batch.commit();
  }
}

export async function updateSeedOnlineStatus(uid, isOnline) {
  try {
    const ref = doc(db, 'seed_profiles', uid);
    await updateDoc(ref, { isOnline });
  } catch {
    // Silently fail
  }
}

export async function autoDeclineRequest(requestId) {
  const ref = doc(db, 'match_requests', requestId);
  await updateDoc(ref, { status: 'declined', respondedAt: serverTimestamp() });
}

// ─── Stats ─────────────────────────────────────────────────────────────────────

export async function getUserStats(uid) {
  const sentQ = query(collection(db, 'match_requests'), where('fromUid', '==', uid));
  const snap = await getDocs(sentQ);
  const requests = snap.docs.map((d) => d.data());
  const total = requests.length;
  const accepted = requests.filter((r) => r.status === 'accepted').length;
  const acceptanceRate = total > 0 ? Math.round((accepted / total) * 100) : 0;
  return { total, accepted, acceptanceRate };
}
