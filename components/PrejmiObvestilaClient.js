'use client';

import { useEffect, useState } from 'react';
import { getMessaging, getToken } from 'firebase/messaging';
import { initializeApp } from 'firebase/app';
import { createClient } from '@supabase/supabase-js';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export default function PrejmiObvestilaClient() {
  const [permission, setPermission] = useState('default');
  const [token, setToken] = useState(null);

  useEffect(() => {
    const initNotifications = async () => {
      try {
        initializeApp(firebaseConfig);
        const messaging = getMessaging();

        const permission = await Notification.requestPermission();
        setPermission(permission);

        if (permission !== 'granted') {
          console.warn('Obvestila niso dovoljena.');
          return;
        }

        const currentToken = await getToken(messaging, { vapidKey });
        setToken(currentToken);

        console.log('Token naprave:', currentToken);

        const {
          data: { user },
          error
        } = await supabase.auth.getUser();

        if (error || !user) {
          console.error('Napaka pri pridobivanju uporabnika:', error);
          return;
        }

        console.log('Uporabnik:', user.id);

        const res = await fetch('/api/save-subscription', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: currentToken, user_id: user.id })
        });

        const result = await res.json();

        if (!res.ok) {
          console.error('Napaka pri shranjevanju tokena:', result);
        } else {
          console.log('Uspešno shranjen push token.');
        }

      } catch (err) {
        console.error('Napaka med inicializacijo obvestil:', err);
      }
    };

    initNotifications();
  }, []);

  return (
    <div>
      <h2>Obvestila</h2>
      <p>Stanje dovoljenja: {permission}</p>
      {token && <p><strong>Token naprave:</strong><br />{token}</p>}
    </div>
  );
}