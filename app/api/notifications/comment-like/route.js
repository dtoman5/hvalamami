import { NextResponse } from 'next/server';
import { createNotificationWithPush } from '../../../../lib/notifications/server';

export async function POST(req) {
  try {
    const body = await req.json();
    const { user_id, source_user_id, post_id, comment_id, comment_like_id } = body;

    if (!user_id || !source_user_id || !comment_id) {
      return NextResponse.json({ error: 'Manjkajoči podatki' }, { status: 400 });
    }

    await createNotificationWithPush({
      type: 'comment_like',
      user_id,
      source_user_id,
      post_id,
      comment_id,
      comment_like_id
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Napaka pri comment_like obvestilu:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}