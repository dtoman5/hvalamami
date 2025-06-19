// app/api/broadcast/route.js
import { NextResponse } from 'next/server'
import { sendBroadcast } from '@/lib/push-sender'

export const runtime = 'edge'

// Cron expression: every 5 minutes
export const schedule = '*/5 * * * *'

export default async function handler() {
  await sendBroadcast()
  return NextResponse.json({ ok: true, sent: true })
}