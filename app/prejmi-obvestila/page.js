'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';

export default function PrejmiObvestilaPage() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return router.push('/prijava');

      console.log('▶️ Requesting Notification permission...');
      const perm = await Notification.requestPermission();
      console.log('▶️ Notification permission:', perm);
      if (perm !== 'granted') return;

      console.log('▶️ Registering Service Worker...');
      const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('▶️ SW registered:', reg);

      console.log('▶️ Retrieving FCM token...');
      const token = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        serviceWorkerRegistration: reg,
      });
      console.log('▶️ FCM token:', token);

      if (token) {
        const { count } = await supabase
          .from('push_subscriptions')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('subscription', token);
        console.log('▶️ existing count:', count);

        if (count === 0) {
          console.log('▶️ Inserting new subscription...');
          const { error } = await supabase
            .from('push_subscriptions')
            .insert({ user_id: user.id, subscription: token });
          console.log('▶️ insert error?', error);
        } else {
          console.log('▶️ token already stored');
        }
      }
    })().catch(console.error);
  }, [router, supabase]);

  // handle foreground messages
  useEffect(() => {
    onMessage(messaging, (payload) => {
      console.log('🔔 foreground message:', payload);
      // optionally: new Notification(...)
    });
  }, []);

  return (
    <div className="center-position">
      <p>Pridobivam obvestila… poglej konzolo za napredek.</p>
    </div>
  );
}