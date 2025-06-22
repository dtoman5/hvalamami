'use client';

import { useEffect, useState } from 'react';
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';
import { getToken } from 'firebase/messaging';
import { getFirebaseMessaging } from '../lib/client/firebase';

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export default function PrejmiObvestilaClient() {
  const [permission, setPermission] = useState('default');
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState('');

  const supabase = useSupabaseClient();
  const user = useUser();

  const requestPermissionAndRegister = async () => {
    if (!user) {
      setStatus('Ni prijavljenega uporabnika');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        setStatus('Dovoljenje zavrnjeno');
        return;
      }

      const messaging = await getFirebaseMessaging();

      if (!messaging) {
        console.error('Firebase messaging ni podprt');
        setStatus('Brskalnik ne podpira obvestil');
        return;
      }

      const currentToken = await getToken(messaging, { vapidKey });

      if (!currentToken) {
        console.warn('Ni bilo mogoče pridobiti žetona');
        setStatus('Žeton ni na voljo');
        return;
      }

      setToken(currentToken);

      const res = await fetch('/api/save-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: currentToken, user_id: user.id }),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error('Shranjevanje neuspešno:', json);
        setStatus('Napaka pri shranjevanju');
      } else {
        setStatus('Uspešno shranjeno');
      }
    } catch (err) {
      console.error('Napaka med registracijo:', err);
      setStatus('Napaka pri obdelavi');
    }
  };

  return (
    <div>
      <h2>Obvestila</h2>
      <p>Dovoljenje: {permission}</p>
      <button onClick={requestPermissionAndRegister}>
        Dovoli obvestila
      </button>

      {token && (
        <p><strong>Token naprave:</strong><br />{token}</p>
      )}

      {status && (
        <p>Status: {status}</p>
      )}
    </div>
  );
}