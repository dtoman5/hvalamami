// lib/push-sender.js
import admin from 'firebase-admin'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// 1) Initialize Firebase Admin SDK once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  })
}

const fcm = admin.messaging()

// 2) Create a Supabase “admin” client with your service-role key
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Send a push notification via FCM to all devices
 * subscribed by the given user.
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

  if (tokens.length === 0) {
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
      url: '/zid',
      test: 'true',
    },
  }

  try {
    const response = await fcm.sendToDevice(tokens, message)
    console.log('Broadcast sent:', response)
  } catch (err) {
    console.error('Error broadcasting:', err)
  }
}