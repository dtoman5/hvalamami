// app/api/notifications/follow/route.js
import { NextResponse } from 'next/server';
import { createNotificationWithPush } from '../../../../lib/notifications/server';

export async function POST(req) {
  const body = await req.json();
  const { user_id, source_user_id } = body;

  if (!user_id || !source_user_id) {
    return NextResponse.json({ error: 'Manjkajoči podatki' }, { status: 400 });
  }

  await createNotificationWithPush({
    type: 'follow',
    user_id,
    source_user_id
  });

  return NextResponse.json({ success: true });
}