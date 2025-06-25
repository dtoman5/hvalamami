import { NextResponse } from 'next/server';
import { createNotificationWithPush } from '@/lib/notifications/server';

export async function POST(req) {
  try {
    const body = await req.json();

    const { user_id, source_user_id, post_id } = body;

    // Validacija vhodnih podatkov
    if (!user_id || !source_user_id || !post_id) {
      return NextResponse.json({ error: 'Manjkajoči podatki' }, { status: 400 });
    }

    // Pošlji obvestilo o všečku
    await createNotificationWithPush({
      type: 'like',
      user_id,
      source_user_id,
      post_id
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Napaka pri like obvestilu:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}