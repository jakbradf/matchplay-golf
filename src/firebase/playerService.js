import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

// Save a new player to the signed-in user's personal roster
export async function saveStoredPlayer({ name, handicap, photoURL }, userId) {
  const payload = {
    name,
    handicap,
    photoURL: photoURL || null,
    ownerId: userId,
    createdAt: serverTimestamp(),
  };
  const ref = await addDoc(collection(db, 'storedPlayers'), payload);
  return { ...payload, id: ref.id };
}

export async function updateStoredPlayer(playerId, updates) {
  await updateDoc(doc(db, 'storedPlayers', playerId), updates);
}

export async function deleteStoredPlayer(playerId) {
  await deleteDoc(doc(db, 'storedPlayers', playerId));
}

// Load everyone the signed-in user has saved, alphabetically
export async function loadStoredPlayers(userId) {
  const q = query(collection(db, 'storedPlayers'), where('ownerId', '==', userId));
  const snap = await getDocs(q);
  return snap.docs
    .map(d => ({ ...d.data(), id: d.id }))
    .sort((a, b) => a.name.localeCompare(b.name));
}
