import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  getDocs,
  query,
  where,
} from 'firebase/firestore';
import { db } from './config';
import { generateGameCode } from '../utils/gameCode';

// Create a new tournament document in Firestore
export async function createTournament({ course, teams, userId = null }) {
  let code;
  let exists = true;

  while (exists) {
    code = generateGameCode();
    const ref = doc(db, 'tournaments', code);
    const snap = await getDoc(ref);
    exists = snap.exists();
  }

  const tournamentData = {
    code,
    status: 'lobby',
    course: { id: course.id, name: course.name },
    teams,
    currentHole: 1,
    createdBy: userId,
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'tournaments', code), tournamentData);
  return { code };
}

export async function getTournament(code) {
  const snap = await getDoc(doc(db, 'tournaments', code.toUpperCase()));
  if (!snap.exists()) return null;
  return snap.data();
}

export function subscribeToTournament(code, callback) {
  return onSnapshot(doc(db, 'tournaments', code.toUpperCase()), (snap) => {
    callback(snap.exists() ? snap.data() : null);
  });
}

export async function updateTournament(code, updates) {
  await updateDoc(doc(db, 'tournaments', code.toUpperCase()), updates);
}

// Save/merge one team's scores for a given hole
export async function saveTournamentHoleScores(code, holeNumber, teamId, teamScores) {
  const ref = doc(db, 'tournamentScores', code.toUpperCase(), 'holes', String(holeNumber));
  await setDoc(ref, { [teamId]: teamScores }, { merge: true });
}

// Subscribe to all hole scores for a tournament: { [holeNumber]: { [teamId]: {...} } }
export function subscribeToTournamentScores(code, callback) {
  const ref = collection(db, 'tournamentScores', code.toUpperCase(), 'holes');
  return onSnapshot(ref, (snap) => {
    const scores = {};
    snap.forEach((d) => {
      scores[d.id] = d.data();
    });
    callback(scores);
  });
}

export async function getUserTournaments(uid) {
  const q = query(collection(db, 'tournaments'), where('createdBy', '==', uid));
  const snap = await getDocs(q);
  const tournaments = snap.docs.map((d) => ({ ...d.data() }));
  return tournaments.sort((a, b) => {
    const ta = a.createdAt?.toMillis?.() ?? 0;
    const tb = b.createdAt?.toMillis?.() ?? 0;
    return tb - ta;
  });
}
