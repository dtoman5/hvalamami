'use client';

import { useUser } from '@supabase/auth-helpers-react';
import { useState } from 'react';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';

// Firebase config
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

  // ✅ Registracija naprave
  const handleRegister = async () => {
    if (!user) return setStatus('⚠️ Uporabnik ni prijavljen.');

    const supported = await isSupported();
    if (!supported) return setStatus('⚠️ Brskalnik ne podpira obvestil.');

    try {
      const messaging = getMessaging(app);
      const currentToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      });

      if (!currentToken) return setStatus('⚠️ Žetona ni bilo mogoče pridobiti.');

      setToken(currentToken);

      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: currentToken,
          user_id: user.id,
        }),
      });

      if (res.ok) {
        setStatus('✅ Naprava uspešno registrirana.');
      } else {
        const err = await res.json();
        console.error('Napaka pri registraciji:', err);
        setStatus('❌ Napaka pri registraciji: ' + err.error);
      }
    } catch (err) {
      console.error('Nepričakovana napaka:', err);
      setStatus('❌ Napaka med postopkom.');
    }
  };

  // ✅ Ročno testiranje push obvestila
  const sendTestNotification = async () => {
    if (!token) return setStatus('⚠️ Naprava še ni registrirana.');

    try {
      const res = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      if (res.ok) {
        setStatus('✅ Testno obvestilo uspešno poslano.');
      } else {
        const err = await res.json();
        console.error('Napaka pri pošiljanju:', err);
        setStatus('❌ Napaka pri pošiljanju obvestila: ' + err.error);
      }
    } catch (err) {
      console.error('Nepričakovana napaka pri pošiljanju:', err);
      setStatus('❌ Napaka med pošiljanjem.');
    }
  };

  return (
    <div>
      <h2>🔔 Push obvestila</h2>

      <button onClick={handleRegister}>Dovoli obvestila</button>
      <button onClick={sendTestNotification} disabled={!token}>
        Pošlji testno obvestilo
      </button>

      {token && (
        <div style={{ marginTop: '1rem' }}>
          <strong>Token naprave:</strong>
          <pre>{token}</pre>
        </div>
      )}

      <p>Status: {status}</p>
    </div>
  );
}