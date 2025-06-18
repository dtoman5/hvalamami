// lib/push-sender.js
import admin from 'firebase-admin';
import { createClient as createAdminClient } from '@supabase/supabase-js';

if (!admin.apps.length) {
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    throw new Error('Missing Firebase admin credentials');
  }
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

const fcm = admin.messaging();
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function sendPush({ user_id, source_profile_username, type, id }) {
  const { data: subs, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', user_id);

  if (error) {
    console.error('Failed to fetch push_subscriptions:', error);
    return;
  }

  const tokens = (subs || []).map(r => r.subscription).filter(Boolean);
  if (!tokens.length) return;

  const payload = {
    notification: { title: 'Novo obvestilo', body: 'Imaš novo obvestilo' },
    data: {
      url: `/profil/${source_profile_username || ''}`,
      type: type || '',
      id: String(id || ''),
    },
  };

  try {
    const response = await fcm.sendToDevice(tokens, payload);
    console.log('✅ FCM send response:', response);
  } catch (err) {
    console.error('❌ Error sending push via FCM:', err);
  }
}