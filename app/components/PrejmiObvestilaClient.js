// app/components/PrejmiObvestilaClient.js
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { messaging } from '../../lib/firebase';    // <-- popravljena pot
import { getToken, onMessage } from 'firebase/messaging';

export default function PrejmiObvestilaClient() {
  const supabase = createClient();
  const router = useRouter();
  const [permission, setPermission] = useState(Notification.permission);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // če ni prijavljen, preusmeri
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.push('/prijava');
    });
  }, [supabase, router]);

  const requestPermission = async () => {
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm === 'granted') {
        const fcmToken = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY
        });
        setToken(fcmToken);
        // shrani v Supabase push_subscriptions
        await supabase
          .from('push_subscriptions')
          .upsert({ user_id: supabase.auth.getUser().then(r => r.data.user.id), subscription: fcmToken });
      }
    } catch (err) {
      console.error('Napaka pri push permission / token:', err);
    }
  };

  // poslušaj foreground sporočila
  useEffect(() => {
    const unsub = onMessage(messaging, payload => {
      console.log('Foreground push:', payload);
      new Notification(payload.notification.title, {
        body: payload.notification.body
      });
    });
    return () => unsub();
  }, []);

  if (permission === 'default') {
    return (
      <div className="center-position">
        <div className="right-side-content text-center">
          <p>Brez dovoljenja ni mogoče prejemati obvestil.</p>
          <button className="btn-1" onClick={requestPermission}>
            Dovoli obvestila
          </button>
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="center-position">
        <div className="right-side-content text-center">
          <p>Obvestila so blokirana. Spremeni nastavitve v brskalniku.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="center-position">
      <div className="right-side-content text-center">
        <p>Obvestila so omogočena ✅</p>
        {token && <p className="small">Token: {token.slice(0,8)}…</p>}
      </div>
    </div>
  );
}