'use client';
import { useUser } from '@supabase/auth-helpers-react';
import { useState } from 'react';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);

export default function PrejmiObvestilaClient() {
  const user = useUser();
  const [status, setStatus] = useState('');
  const [token, setToken] = useState(null);

  const handleRegister = async () => {
    if (!user) return setStatus('Ni uporabnika');
    const supported = await isSupported();
    if (!supported) return setStatus('Ni podpore za obvestila');

    const messaging = getMessaging(app);
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
    });

    if (!currentToken) return setStatus('Ni žetona');

    setToken(currentToken);
    const res = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: currentToken, user_id: user.id }),
    });

    setStatus(res.ok ? 'Registrirano ✅' : 'Napaka pri registraciji');
  };

  const sendTestNotification = async () => {
    if (!token) return setStatus('Ni shranjenega žetona');
    const res = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    setStatus(res.ok ? 'Poslano ✅' : 'Napaka pri pošiljanju');
  };

  return (
    <div>
      <h2>Push obvestila</h2>
      <button onClick={handleRegister}>Dovoli obvestila</button>
      <button onClick={sendTestNotification}>Pošlji testno obvestilo</button>
      <p>Status: {status}</p>
    </div>
  );
}