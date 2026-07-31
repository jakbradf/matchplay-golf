import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './config';

export async function saveCustomCourse(courseData, userId) {
  const par = courseData.holes.reduce((sum, h) => sum + h.par, 0);
  const payload = {
    ...courseData,
    par,
    createdBy: userId || null,
    createdAt: serverTimestamp(),
    isPublic: true,
    source: 'custom',
  };
  const ref = await addDoc(collection(db, 'customCourses'), payload);
  return { ...payload, id: ref.id };
}

export async function loadPublicCourses() {
  try {
    const q = query(collection(db, 'customCourses'), where('isPublic', '==', true));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ ...d.data(), id: d.id, isCustom: true }));
  } catch {
    return [];
  }
}
