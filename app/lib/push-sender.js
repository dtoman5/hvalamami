// @ts-nocheck

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
      // Replace literal `\n` sequences with actual newlines
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })
}

const fcm = admin.messaging()

// 2) Create a Supabase “admin” client with your service-role key
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
 * Send a push notification via FCM to all devices
 * subscribed by the given user.
 *
 * @param {{ user_id: string; source_profile_username?: string; type?: string; id?: number }} notificationRow
 */
export async function sendPush(notificationRow) {
  // 1) Fetch all stored FCM tokens for this user
  const { data: subs, error: subErr } = await supabaseAdmin
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', notificationRow.user_id)

  if (subErr) {
    console.error('Failed to fetch push_subscriptions:', subErr)
    return
  }

  // 2) Extract valid tokens
  const tokens = (subs || [])
    .map((r) => r.subscription)
    .filter((t) => typeof t === 'string' && t.length)

  if (!tokens.length) {
    // No devices to send to
    return
  }

  // 3) Build the FCM payload
  const notification = {
    title: 'Novo obvestilo',
    body: 'Imaš novo obvestilo',
  }

  const messagePayload = {
    notification,
    data: {
      url: `/profil/${notificationRow.source_profile_username || ''}`,
      type: notificationRow.type || '',
      id: String(notificationRow.id ?? ''),
    },
  }

  // 4) Send to all tokens
  try {
    const response = await fcm.sendToDevice(tokens, messagePayload)
    console.log('FCM send response:', response)
  } catch (err) {
    console.error('Error sending push via FCM:', err)
  }
}