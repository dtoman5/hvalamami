// lib/push-sender.js
import admin from 'firebase-admin'
import { createClient as createAdminClient } from '@supabase/supabase-js'

// Initialize Firebase Admin once
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

// Supabase “admin” client
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/**
 * Pošlje push vsem napravam danega user_id
 */
export async function sendPush({ user_id, source_profile_username, type, id }) {
  // ... (tvoja obstoječa koda za user-specific)
}

/**
 * Broadcast — pošlji vsem v push_subscriptions
 */
export async function sendBroadcast({ title, body, data = {} }) {
  // 1) poberi vse zapise
  const { data: subs, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('subscription')

  if (error) {
    console.error('❌ fetch subs failed:', error)
    return
  }
  const tokens = (subs || []).map(r => r.subscription).filter(Boolean)
  if (!tokens.length) {
    console.log('ℹ️ Ni nobenih subscription tokenov')
    return
  }

  // 2) sestavi payload
  const payload = {
    notification: { title, body },
    data: {
      ...data
    }
  }

  // 3) pošlji
  try {
    const resp = await fcm.sendToDevice(tokens, payload)
    console.log('✅ broadcast sent', resp)
  } catch (err) {
    console.error('❌ broadcast error', err)
  }
}