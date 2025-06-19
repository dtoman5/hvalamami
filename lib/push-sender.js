// lib/push-sender.js
import admin from 'firebase-admin'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// 1) Initialize Firebase Admin SDK once:
if (!admin.apps.length) {
  if (
    !process.env.FIREBASE_PROJECT_ID ||
    !process.env.FIREBASE_CLIENT_EMAIL ||
    !process.env.FIREBASE_PRIVATE_KEY
  ) {
    throw new Error('Missing Firebase admin credentials')
  }
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })
}

const fcm = admin.messaging()

// 2) Create a Supabase “admin” client with your service-role key:
if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  throw new Error('Missing Supabase service role credentials')
}
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Broadcast a test notification to every saved device token.
 */
export async function sendBroadcast() {
  // fetch all subscriptions
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
    console.log('No tokens found – nothing to send.')
    return
  }

  // a simple test payload
  const message = {
    notification: {
      title: '🛠️ Test obvestilo',
      body: 'To je testno obvestilo – poslano ročno ali po cronu.',
    },
    data: {
      url: '/zid',
      test: 'true',
    },
  }

  try {
    const resp = await fcm.sendToDevice(tokens, message)
    console.log('Broadcast sent, response:', resp)
  } catch (err) {
    console.error('Error broadcasting:', err)
  }
}