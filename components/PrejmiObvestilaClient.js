'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export default function PrejmiObvestilaClient() {
  const [permission, setPermission] = useState('default');
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState('');

  useEffect(() => {
    initializeApp(firebaseConfig);
  }, []);

  const requestPermissionAndRegister = async () => {
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        setStatus('Dovoljenje zavrnjeno');
        return;
      }

      const messaging = getMessaging();
      const currentToken = await getToken(messaging, { vapidKey });
      setToken(currentToken);
      console.log('Token naprave:', currentToken);

      const {
        data: { session },
        error
      } = await supabase.auth.getSession();

      if (error || !session?.user) {
        console.error('Ni prijavljenega uporabnika:', error);
        setStatus('Ni prijavljenega uporabnika');
        return;
      }

      const res = await fetch('/api/save-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: currentToken, user_id: session.user.id })
      });

      const json = await res.json();
      if (!res.ok) {
        console.error('Shranjevanje neuspešno:', json);
        setStatus('Napaka pri shranjevanju');
      } else {
        console.log('Uspešno shranjeno');
        setStatus('Uspešno shranjeno');
      }
    } catch (err) {
      console.error('Napaka:', err);
      setStatus('Napaka pri pridobivanju obvestil');
    }
  };

  return (
    <div>
      <h2>Obvestila</h2>
      <p>Dovoljenje: {permission}</p>
      <button onClick={requestPermissionAndRegister}>
        Dovoli obvestila
      </button>
      {token && <p><strong>Token naprave:</strong><br />{token}</p>}
      {status && <p>Status: {status}</p>}
    </div>
  );
}