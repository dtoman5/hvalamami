'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@supabase/auth-helpers-react';
import { getToken } from 'firebase/messaging';
import { getFirebaseMessaging } from '../lib/client/firebase'; // prilagodi pot po potrebi

const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY;

export default function PrejmiObvestilaClient() {
  const user = useUser();
  const [permission, setPermission] = useState('default');
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState('');

  const requestPermissionAndRegister = async () => {
    if (!user) {
      setStatus('Ni prijavljenega uporabnika');
      return;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result !== 'granted') {
        setStatus('Dovoljenje za obvestila zavrnjeno');
        return;
      }

      const messaging = await getFirebaseMessaging();

      if (!messaging) {
        console.error('Brskalnik ne podpira Firebase Messaging');
        setStatus('Firebase Messaging ni podprt');
        return;
      }

      const currentToken = await getToken(messaging, { vapidKey });

      if (!currentToken) {
        console.warn('Ni bilo mogoče pridobiti žetona');
        setStatus('Žeton ni na voljo');
        return;
      }

      setToken(currentToken);

      const res = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: currentToken,
          user_id: user.id,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        console.error('Napaka pri shranjevanju:', json);
        setStatus(`Napaka: ${json?.error || 'Neznana napaka'}`);
      } else {
        setStatus('✅ Naprava registrirana');
      }
    } catch (err) {
      console.error('Napaka med postopkom:', err);
      setStatus('❌ Napaka med postopkom');
    }
  };

  const handleSendTest = async () => {
    if (!token) return setStatus('❌ Token še ni registriran');

    const res = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    const json = await res.json();

    if (!res.ok) {
      console.error('❌ Napaka pri pošiljanju testnega obvestila:', json);
      setStatus('Napaka pri pošiljanju testnega obvestila');
    } else {
      setStatus('✅ Testno obvestilo poslano');
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Prejemanje obvestil</h2>
      <button onClick={requestPermissionAndRegister} className="px-4 py-2 bg-blue-600 text-white rounded">
        📥 Dovoli obvestila
      </button>

      {token && (
        <>
          <p className="mt-2 break-all text-xs text-gray-700">
            <strong>Token naprave:</strong> {token}
          </p>

          <button onClick={handleSendTest} className="mt-4 px-4 py-2 bg-green-600 text-white rounded">
            🚀 Pošlji testno obvestilo
          </button>
        </>
      )}

      {status && <p className="mt-4 text-sm text-gray-800">{status}</p>}
    </div>
  );
}