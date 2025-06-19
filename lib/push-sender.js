// lib/push-sender.js

import admin from 'firebase-admin'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// (Your existing Firebase Admin init here…)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID!,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
    }),
  })
}
const fcm = admin.messaging()

const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Send a push notification via FCM to _all_ devices
 * registered in push_subscriptions.
 */
export async function sendBroadcast() {
  // 1) fetch every subscription
  const { data: subs, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('subscription')
  if (error) {
    console.error('Could not load subscriptions:', error)
    return
  }

  const tokens = (subs || [])
    .map((r) => r.subscription)
    .filter((t) => typeof t === 'string' && t.length)

  if (!tokens.length) {
    console.log('No tokens to broadcast to.')
    return
  }

  // 2) your test notification payload
  const message = {
    notification: {
      title: '🛠️ Test obvestilo',
      body: 'To je testno obvestilo, poslano vsake 5 minute.',
    },
    data: {
      // optional deep‐link back into your app
      url: '/zid',
      test: 'true',
    },
  }

  try {
    const resp = await fcm.sendToDevice(tokens, message)
    console.log('Broadcast sent:', resp)
  } catch (err) {
    console.error('Error broadcasting:', err)
  }
}