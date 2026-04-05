import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';
import { generateGameCode } from '../utils/gameCode';

// Create a new game document in Firestore
export async function createGame({ course, teams }) {
  let code;
  let exists = true;

  // Ensure unique code
  while (exists) {
    code = generateGameCode();
    const ref = doc(db, 'games', code);
    const snap = await getDoc(ref);
    exists = snap.exists();
  }

  const scorerCode = generateGameCode();

  const gameData = {
    code,
    status: 'lobby',
    course: { id: course.id, name: course.name },
    teams,
    currentHole: 1,
    scorerCode,
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'games', code), gameData);
  return { code, scorerCode };
}

// Fetch a game once
export async function getGame(code) {
  const snap = await getDoc(doc(db, 'games', code.toUpperCase()));
  if (!snap.exists()) return null;
  return snap.data();
}

// Subscribe to a game (real-time)
export function subscribeToGame(code, callback) {
  return onSnapshot(doc(db, 'games', code.toUpperCase()), (snap) => {
    if (snap.exists()) {
      callback(snap.data());
    } else {
      callback(null);
    }
  });
}

// Update game status or currentHole
export async function updateGame(code, updates) {
  await updateDoc(doc(db, 'games', code.toUpperCase()), updates);
}

// Save or update scores for a specific hole
export async function saveHoleScores(gameCode, holeNumber, scores) {
  const ref = doc(
    db,
    'scores',
    gameCode.toUpperCase(),
    'holes',
    String(holeNumber)
  );
  await setDoc(ref, scores, { merge: true });
}

// Subscribe to all hole scores for a game
export function subscribeToScores(gameCode, callback) {
  const ref = collection(db, 'scores', gameCode.toUpperCase(), 'holes');
  return onSnapshot(ref, (snap) => {
    const scores = {};
    snap.forEach((d) => {
      scores[d.id] = d.data();
    });
    callback(scores);
  });
}

// Fetch scores once
export async function getHoleScores(gameCode, holeNumber) {
  const ref = doc(
    db,
    'scores',
    gameCode.toUpperCase(),
    'holes',
    String(holeNumber)
  );
  const snap = await getDoc(ref);
  return snap.exists() ? snap.data() : null;
}
