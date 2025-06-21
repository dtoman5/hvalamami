// lib/push-sender.js
import admin from 'firebase-admin'
import { createClient as createAdminClient } from '@supabase/supabase-js'

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  })
}
const fcm = admin.messaging()
const supabaseAdmin = createAdminClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function sendPush(notificationRow) {
  const { data: subs, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('subscription')
    .eq('user_id', notificationRow.user_id)
  if (error || !subs?.length) return console.error(error || 'ni device token')

  try {
    const resp = await fcm.sendToDevice(
      subs.map(r => r.subscription),
      {
        notification: { title: 'Test obvestilo', body: 'To je test!' },
        data: {},
      }
    )
    console.log('push poslan:', resp)
  } catch (e) { console.error(e) }
}