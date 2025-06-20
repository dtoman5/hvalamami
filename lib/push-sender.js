// lib/push-sender.js
import admin from 'firebase-admin'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// 1) Initialize Firebase Admin SDK once
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

// 2) Create a Supabase “admin” client
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

const fcm = admin.messaging()

/**
 * Send a push notification via FCM to a single user’s devices.
 */
export async function sendPush(notificationRow) {
  const { data: subs, error: subErr } = await supabaseAdmin
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', notificationRow.user_id)

  if (subErr) {
    console.error('Failed to fetch push_subscriptions:', subErr)
    return
  }

  const tokens = (subs || [])
    .map(r => r.subscription)
    .filter(t => typeof t === 'string' && t.length)
  if (!tokens.length) return

  const notification = {
    title: 'Novo obvestilo',
    body: 'Imaš novo obvestilo',
  }
  const messagePayload = {
    notification,
    data: {
      url: `/profil/${notificationRow.source_profile_username || ''}`,
      type: notificationRow.type || '',
      id: String(notificationRow.id || ''),
    },
  }

  try {
    const resp = await fcm.sendToDevice(tokens, messagePayload)
    console.log('FCM response:', resp)
  } catch (err) {
    console.error('FCM send error:', err)
  }
}