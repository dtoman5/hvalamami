// app/api/notifications/route.js
import { NextResponse } from 'next/server';
import { sendPush } from '@/lib/push-sender';

export async function POST(req) {
  const body = await req.json();
  console.log('🚀 /api/notifications body:', body);

  try {
    await sendPush(body);
    console.log('✅ sendPush ok');
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ sendPush ERROR:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}