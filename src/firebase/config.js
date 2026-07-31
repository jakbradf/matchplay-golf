import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCtk1f8PsirhwLp3FKtPWdoSF-dLDSSYxA",
  authDomain: "matchplay-ae9f6.firebaseapp.com",
  projectId: "matchplay-ae9f6",
  storageBucket: "matchplay-ae9f6.firebasestorage.app",
  messagingSenderId: "55809209279",
  appId: "1:55809209279:web:b5bf2d0d4f867a9a76a70a",
  measurementId: "G-8BEZXSKPCB"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
