'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function PrejmiObvestilaClient() {
  const supabase = createClient();
  const router = useRouter();
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    // če ni prijavljen, preusmeri
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) router.replace('/prijava');
    });
  }, [supabase, router]);

  const handleEnable = async () => {
    if (Notification.permission === 'default') {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        setGranted(true);
        const token = await (await import('@/lib/firebase')).getToken(); // tvoj helper za FCM token
        if (token) {
          await supabase
            .from('push_subscriptions')
            .upsert({ user_id: (await supabase.auth.getUser()).data.user.id, subscription: token });
        }
      }
    }
  };

  return (
    <div className="center-position">
      <div className="right-side-content text-center">
        <h1 className="m-b-2">Prejmi obvestila</h1>
        {Notification.permission === 'granted' || granted ? (
          <p>Obvestila so omogočena ✅</p>
        ) : (
          <button className="btn-1" onClick={handleEnable}>
            Omogoči push obvestila
          </button>
        )}
      </div>
    </div>
  );
}