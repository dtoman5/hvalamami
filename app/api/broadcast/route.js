// app/api/broadcast/route.js
import { NextResponse } from 'next/server'
import { sendBroadcast } from '@/lib/push-sender'

export async function POST(req) {
  // **POZOR**: to routo zaščiti tako, da lahko kliče samo admin!
  const body = await req.json()
  const { title, body: msg, data } = body
  if (!title || !msg) {
    return NextResponse.json({ error: 'Missing title/body' }, { status: 400 })
  }
  try {
    await sendBroadcast({ title, body: msg, data })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}