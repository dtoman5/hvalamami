// lib/firebase.js

import { initializeApp, getApps } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

// 🔐 Firebase config iz .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// ✅ Inicializacija Firebase App (če še ni)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

// ✅ Funkcija za pridobitev messaging instance, če je podprt
const getFirebaseMessaging = async () => {
  if (typeof window === 'undefined') return null;
  if (!('serviceWorker' in navigator)) return null;

  const supported = await isSupported();
  if (!supported) return null;

  return getMessaging(app);
};

export { app, getFirebaseMessaging };