'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function PrejmiObvestilaPage() {
  const supabase = createClient();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'prompted' | 'granted' | 'denied'

  // 1) Preusmeri, če ni prijavljen
  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace('/prijava');
      } else {
        setUser(user);
      }
    })();
  }, [supabase, router]);

  // 2) S klikom sproži browser dialog za dovoljenja in shrani token
  const handleEnable = async () => {
    setStatus('prompted');
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setStatus('granted');
      try {
        // registriraj Service Worker
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        // dinamično naloži Firebase Messaging
        const { getMessaging, getToken } = await import('firebase/messaging');
        const { messaging } = await import('@/lib/firebase');
        const fcmToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration,
        });
        if (fcmToken && user) {
          await supabase
            .from('push_subscriptions')
            .upsert({ user_id: user.id, subscription: fcmToken });
        }
      } catch (err) {
        console.error('Napaka pri registraciji push:', err);
      }
    } else {
      setStatus('denied');
    }
  };

  if (!user) {
    return <p>Preverjam prijavo…</p>;
  }

  return (
    <div className="center-position">
      <h1 className="m-b-2">Prejmi push obvestila</h1>

      {status === 'idle' && (
        <button className="btn-1" onClick={handleEnable}>
          Omogoči obvestila
        </button>
      )}
      {status === 'prompted' && <p>Odprt je dialog brskalnika za dovoljenja…</p>}
      {status === 'granted' && <p>Dovoljenje podeljeno! Hvala.</p>}
      {status === 'denied' && (
        <>
          <p>Dovoljenje zavrnjeno. Obvestila ne bodo delovala.</p>
          <button className="btn-1" onClick={handleEnable}>
            Poskusi znova
          </button>
        </>
      )}
    </div>
  );
}