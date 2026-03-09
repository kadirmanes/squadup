import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  addDoc,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join('_');
}

export async function createOrGetChat(uid1, uid2, matchRequestId, gameId) {
  const chatId = getChatId(uid1, uid2);
  const ref = doc(db, 'chats', chatId);

  // Firestore rules return PERMISSION_DENIED for getDoc on a non-existing document
  // when the rule checks resource.data (resource is null for missing docs).
  // Wrap in try/catch: if read fails assume doc doesn't exist and create it.
  let exists = false;
  try {
    const snap = await getDoc(ref);
    exists = snap.exists();
  } catch {
    exists = false; // treat read error as "not found" → will attempt create below
  }

  if (!exists) {
    await setDoc(ref, {
      participants: [uid1, uid2],
      matchRequestId,
      gameId,
      lastMessage: null,
      lastMessageAt: null,
      createdAt: serverTimestamp(),
    });
  }
  return chatId;
}

export async function sendMessage(chatId, senderId, text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  await addDoc(collection(db, 'chats', chatId, 'messages'), {
    senderId,
    text: trimmed,
    createdAt: serverTimestamp(),
  });
  await updateDoc(doc(db, 'chats', chatId), {
    lastMessage: trimmed,
    lastMessageAt: serverTimestamp(),
  });
}

export function subscribeToMessages(chatId, callback) {
  const q = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(100),
  );
  return onSnapshot(
    q,
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    (err) => console.warn('[Chat] Messages error:', err.message),
  );
}

function sortChats(docs) {
  return docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => {
      const aTime = a.lastMessageAt?.toMillis?.() ?? a.createdAt?.toMillis?.() ?? 0;
      const bTime = b.lastMessageAt?.toMillis?.() ?? b.createdAt?.toMillis?.() ?? 0;
      return bTime - aTime;
    });
}

// One-time fetch (fallback for when subscription fails)
export async function getChats(uid) {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', uid),
  );
  const snap = await getDocs(q);
  return sortChats(snap.docs);
}

export function subscribeToChats(uid, callback, onError) {
  const q = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', uid),
  );
  return onSnapshot(
    q,
    (snap) => callback(sortChats(snap.docs)),
    (err) => {
      console.warn('[Chat] Chats subscription error:', err.message);
      onError?.(err);
    },
  );
}
