import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
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
  arrayUnion,
  arrayRemove,
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── User Operations ───────────────────────────────────────────────────────────

export async function createUser(uid, userData) {
  const ref = doc(db, 'users', uid);
  await setDoc(ref, {
    uid,
    username: userData.username,
    games: userData.games || [],
    gameIds: (userData.games || []).map((g) => g.gameId),
    vibe: userData.vibe || 'chill',
    lookingFor: userData.lookingFor ?? 2,
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

export async function deleteUserDocument(uid) {
  try {
    await deleteDoc(doc(db, 'users', uid));
  } catch {
    // Silently fail — cleanup is best-effort
  }
}

// ─── Player Listing ────────────────────────────────────────────────────────────

export async function getAllPlayers(currentUid = null) {
  const results = [];

  // Fetch real users — expand each user into one entry per game they play
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    usersSnap.forEach((d) => {
      const data = d.data();
      const uid = data.uid ?? d.id;
      // Skip current user — never show yourself in the list
      if (currentUid && uid === currentUid) return;
      const base = { ...data, id: d.id, uid, source: 'user' };
      const games = data.games ?? [];
      if (games.length === 0) {
        // User hasn't set up games yet — still show them
        results.push(base);
      } else {
        // One card per game so game filter works correctly
        games.forEach((g) => {
          results.push({
            ...base,
            gameId: g.gameId,
            rank: g.rank ?? data.rank,
            nickname: g.nickname ?? data.nickname,
            kd: g.kd ?? data.kd,
            server: g.server ?? data.server,
            region: g.region ?? data.region,
            // Unique key for FlatList: uid_gameId
            _cardKey: `${uid}_${g.gameId}`,
          });
        });
      }
    });
  } catch (err) {
    console.warn('[Firestore] Error fetching users:', err.message);
  }

  // Fetch seed profiles (already have flat gameId structure)
  try {
    const seedsSnap = await getDocs(collection(db, 'seed_profiles'));
    seedsSnap.forEach((d) => {
      const data = d.data();
      results.push({
        ...data,
        id: d.id,
        source: 'seed',
        _cardKey: `${data.uid ?? d.id}_${data.gameId ?? ''}`,
      });
    });
  } catch (err) {
    console.warn('[Firestore] Error fetching seeds:', err.message);
  }

  // Real users first (shuffled), then seed profiles (shuffled)
  const shuffle = (arr) => arr.sort(() => Math.random() - 0.5);
  const realUsers = results.filter((r) => r.source === 'user');
  const seedUsers = results.filter((r) => r.source === 'seed');
  return [...shuffle(realUsers), ...shuffle(seedUsers)];
}

export function subscribeToPlayers(callback, currentUid = null) {
  const refresh = () => getAllPlayers(currentUid).then(callback).catch(console.warn);

  // Subscribe to seed_profiles for live seed online status updates
  const seedUnsub = onSnapshot(
    collection(db, 'seed_profiles'),
    { includeMetadataChanges: false },
    refresh,
    (err) => console.warn('[Firestore] Seed subscription error:', err.message),
  );

  // Subscribe to users collection so real user online status updates in real-time
  const usersUnsub = onSnapshot(
    collection(db, 'users'),
    { includeMetadataChanges: false },
    refresh,
    (err) => console.warn('[Firestore] Users subscription error:', err.message),
  );

  return () => {
    seedUnsub();
    usersUnsub();
  };
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

  // Send push notification to the target user (fire-and-forget)
  try {
    const [fromSnap, toSnap] = await Promise.all([
      getDoc(doc(db, 'users', fromUid)),
      getDoc(doc(db, 'users', toUid)),
    ]);
    const senderName = fromSnap.data()?.username ?? 'Biri';
    const pushToken = toSnap.data()?.expoPushToken;
    if (pushToken) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: pushToken,
          sound: 'default',
          title: '⚔️ Oyun Daveti!',
          body: `${senderName} seni oyuna davet etti!`,
        }),
      });
    }
  } catch {
    // Notification failure should not block the request
  }

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

// ─── Block & Report ────────────────────────────────────────────────────────────

export async function blockUser(myUid, targetUid) {
  const ref = doc(db, 'users', myUid);
  await updateDoc(ref, { blockedUids: arrayUnion(targetUid) });
}

export async function unblockUser(myUid, targetUid) {
  const ref = doc(db, 'users', myUid);
  await updateDoc(ref, { blockedUids: arrayRemove(targetUid) });
}

export async function reportUser(reporterUid, targetUid, reason) {
  await addDoc(collection(db, 'reports'), {
    reporterUid,
    targetUid,
    reason,
    createdAt: serverTimestamp(),
    status: 'pending',
  });
}

// ─── Friends ───────────────────────────────────────────────────────────────────

export async function sendFriendRequest(fromUid, toUid) {
  // Already friends?
  const fromSnap = await getDoc(doc(db, 'users', fromUid));
  if (fromSnap.exists()) {
    const friendIds = fromSnap.data().friendIds ?? [];
    if (friendIds.includes(toUid)) return { alreadyFriends: true };
  }

  // Existing pending request from me to them?
  const myQ = query(
    collection(db, 'friend_requests'),
    where('fromUid', '==', fromUid),
    where('toUid', '==', toUid),
    where('status', '==', 'pending'),
  );
  const myExisting = await getDocs(myQ);
  if (!myExisting.empty) return { id: myExisting.docs[0].id };

  // They already sent me one? Accept it directly
  const theirQ = query(
    collection(db, 'friend_requests'),
    where('fromUid', '==', toUid),
    where('toUid', '==', fromUid),
    where('status', '==', 'pending'),
  );
  const theirExisting = await getDocs(theirQ);
  if (!theirExisting.empty) {
    const reqId = theirExisting.docs[0].id;
    await respondToFriendRequest(reqId, 'accepted', toUid, fromUid);
    return { id: reqId, autoAccepted: true };
  }

  const ref = await addDoc(collection(db, 'friend_requests'), {
    fromUid,
    toUid,
    status: 'pending',
    createdAt: serverTimestamp(),
  });

  // Send push notification to the target user (fire-and-forget)
  try {
    const [fromSnap, toSnap] = await Promise.all([
      getDoc(doc(db, 'users', fromUid)),
      getDoc(doc(db, 'users', toUid)),
    ]);
    const senderName = fromSnap.data()?.username ?? 'Biri';
    const pushToken = toSnap.data()?.expoPushToken;
    if (pushToken) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: pushToken,
          sound: 'default',
          title: '👋 Arkadaşlık İsteği!',
          body: `${senderName} sana arkadaşlık isteği gönderdi!`,
        }),
      });
    }
  } catch {
    // Notification failure should not block the request
  }

  return { id: ref.id };
}

export async function respondToFriendRequest(requestId, status, fromUid, toUid) {
  const ref = doc(db, 'friend_requests', requestId);
  await updateDoc(ref, { status, respondedAt: serverTimestamp() });
  if (status === 'accepted') {
    // Add each other to friendIds arrays
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', fromUid), { friendIds: arrayUnion(toUid) });
    batch.update(doc(db, 'users', toUid), { friendIds: arrayUnion(fromUid) });
    await batch.commit();
  }
}

export function subscribeFriendRequests(uid, callback) {
  const sent = [];
  const received = [];

  const sentUnsub = onSnapshot(
    query(collection(db, 'friend_requests'), where('fromUid', '==', uid), limit(100)),
    (snap) => {
      sent.length = 0;
      snap.forEach((d) => sent.push({ id: d.id, ...d.data() }));
      callback([...sent, ...received]);
    },
    (err) => console.warn('[Firestore] friendReq sent sub error:', err.message),
  );

  const receivedUnsub = onSnapshot(
    query(collection(db, 'friend_requests'), where('toUid', '==', uid), limit(100)),
    (snap) => {
      received.length = 0;
      snap.forEach((d) => received.push({ id: d.id, ...d.data() }));
      callback([...sent, ...received]);
    },
    (err) => console.warn('[Firestore] friendReq received sub error:', err.message),
  );

  return () => {
    sentUnsub();
    receivedUnsub();
  };
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

// ─── Ratings ───────────────────────────────────────────────────────────────────

/**
 * Submit a 1-5 star rating for a squad partner.
 * Uses chatId + fromUid as unique key to prevent duplicate ratings.
 * Updates recipient's trustScore (rolling average) and ratingCount atomically.
 */
export async function submitRating(fromUid, toUid, chatId, score) {
  const ratingId = `${chatId}_${fromUid}`;
  const ratingRef = doc(db, 'ratings', ratingId);

  // Prevent duplicates
  const existing = await getDoc(ratingRef);
  if (existing.exists()) return { alreadyRated: true };

  // Write the rating document
  await setDoc(ratingRef, {
    fromUid,
    toUid,
    chatId,
    score,
    createdAt: serverTimestamp(),
  });

  // Atomically update recipient's trust score
  const userRef = doc(db, 'users', toUid);
  await runTransaction(db, async (t) => {
    const snap = await t.get(userRef);
    const data = snap.data() ?? {};
    const oldCount = data.ratingCount ?? 0;
    const newCount = oldCount + 1;
    const newAvg = ((data.trustScore ?? 0) * oldCount + score) / newCount;
    t.update(userRef, {
      trustScore: Math.round(newAvg * 10) / 10,
      ratingCount: newCount,
    });
  });

  return { success: true };
}
