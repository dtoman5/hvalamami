// lib/push-sender.js
import admin from 'firebase-admin';
import { createClient } from '@supabase/supabase-js';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function sendBroadcast() {
  const { data: subs } = await supabase.from('push_subscriptions').select('subscription');

  const tokens = subs?.map(r => r.subscription).filter(Boolean) || [];
  if (!tokens.length) return;

  const payload = {
    notification: {
      title: 'Pozdrav!',
      body: 'To je testno push obvestilo.',
    },
  };

  await admin.messaging().sendToDevice(tokens, payload);
}