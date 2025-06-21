'use client';

import { useEffect, useState } from 'react';
import { getToken } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';

export default function PrejmiObvestilaClient() {
  const [permission, setPermission] = useState(Notification.permission);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY, serviceWorkerRegistration: registration })
            .then(async (token) => {
              if (token) {
                await fetch('/api/register-device', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ token }),
                });
              }
            });
        });
    }
  }, []);

  return (
    <div>
      <h1>Omogoči push obvestila</h1>
      {permission === 'default' && (
        <button onClick={async () => {
          const result = await Notification.requestPermission();
          setPermission(result);
        }}>
          Dovoli obvestila
        </button>
      )}
      {permission === 'denied' && <p>V nastavitvah dovoli prejemanje obvestil.</p>}
      {permission === 'granted' && <p>Obvestila so omogočena!</p>}
    </div>
  );
}