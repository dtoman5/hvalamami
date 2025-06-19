'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getToken, onMessage } from 'firebase/messaging';
import { messaging } from '@/lib/firebase';

export default function PrejmiObvestilaClient() {
  const supabase = createClient();
  const [status, setStatus] = useState(Notification.permission);

  useEffect(() => {
    // 1) ask for permission (if not already granted/denied)
    if (status === 'default') {
      Notification.requestPermission().then((perm) => {
        setStatus(perm);
      });
      return;
    }

    // 2) once granted, get FCM token and save it
    if (status === 'granted') {
      getToken(messaging, { vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY })
        .then((fcmToken) => {
          if (!fcmToken) return;
          // upsert so we don’t duplicate
          supabase
            .from('push_subscriptions')
            .upsert({ user_id: supabase.auth.getUser().then(r=>r.data.user.id), subscription: fcmToken })
            .catch(console.error);
        })
        .catch(console.error);
      // listen for in‐page messages
      onMessage(messaging, (payload) => {
        const { title, body, icon } = payload.notification;
        new Notification(title, { body, icon });
      });
    }
  }, [status, supabase]);

  return null;
}