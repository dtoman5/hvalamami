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
  const [token, setToken] = useState('');

  const handleRegister = async () => {
    setStatus('⏳ Pridobivanje žetona...');
    if (!user) return setStatus('⚠️ Uporabnik ni prijavljen');

    const supported = await isSupported();
    if (!supported) return setStatus('⚠️ Brskalnik ne podpira obvestil');

    try {
      const messaging = getMessaging(app);
      const currentToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      if (!currentToken) return setStatus('❌ Ni bilo mogoče pridobiti žetona');

      setToken(currentToken);

      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: currentToken, user_id: user.id }),
      });

      const json = await res.json();

      if (res.ok) {
        console.log('✅ Registracija uspešna:', json);
        setStatus('✅ Registracija uspešna');
      } else {
        console.error('❌ Napaka pri registraciji:', json);
        setStatus('❌ Napaka pri registraciji');
      }
    } catch (err) {
      console.error('❌ Napaka pri registraciji:', err);
      setStatus('❌ Napaka pri registraciji');
    }
  };

  const sendTestNotification = async () => {
    if (!token) {
      console.warn('⚠️ Ni žetona – ne morem poslati');
      setStatus('⚠️ Ni žetona');
      return;
    }

    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const json = await res.json();

      if (res.ok) {
        console.log('✅ Obvestilo poslano:', json);
        setStatus('✅ Obvestilo poslano');
      } else {
        console.error('❌ Napaka pri pošiljanju:', json);
        setStatus('❌ Napaka pri pošiljanju');
      }
    } catch (err) {
      console.error('❌ Napaka pri fetch:', err);
      setStatus('❌ Napaka pri fetch');
    }
  };

  return (
    <div style={{ padding: '1rem', maxWidth: '500px' }}>
      <h2>📬 Push obvestila</h2>
      <button onClick={handleRegister} style={{ marginRight: '1rem' }}>
        ✅ Dovoli obvestila
      </button>
      <button onClick={sendTestNotification}>🚀 Pošlji testno obvestilo</button>
      <p style={{ marginTop: '1rem' }}>Status: <strong>{status}</strong></p>
    </div>
  );
}