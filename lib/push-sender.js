// lib/push-sender.js
const admin = require('firebase-admin')
const { createClient: createAdminClient } = require('@supabase/supabase-js')

// 1) Init Firebase Admin
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

// 2) Supabase admin client
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
 * Send FCM push to all tokens of a user
 * @param {{ user_id:string; source_profile_username?:string; type?:string; id?:number }} notificationRow
 */
async function sendPush(notificationRow) {
  // fetch subscriptions
  const { data: subs, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', notificationRow.user_id)

  if (error) {
    console.error('Failed to fetch push_subscriptions:', error)
    return
  }

  const tokens = (subs || [])
    .map((r) => r.subscription)
    .filter((t) => typeof t === 'string' && t.length)

  if (!tokens.length) return

  const notification = {
    title: 'Novo obvestilo',
    body: 'Imaš novo obvestilo',
  }
  const payload = {
    notification,
    data: {
      url: `/profil/${notificationRow.source_profile_username || ''}`,
      type: notificationRow.type || '',
      id: String(notificationRow.id ?? ''),
    },
  }

  try {
    const resp = await fcm.sendToDevice(tokens, payload)
    console.log('FCM send response:', resp)
  } catch (err) {
    console.error('Error sending push via FCM:', err)
  }
}

module.exports = { sendPush }