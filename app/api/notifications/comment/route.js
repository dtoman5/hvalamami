import { NextResponse } from 'next/server';
import { createNotificationWithPush } from '../../../../lib/notifications/server';
import { supabase } from '../../../../lib/supabase/server-direct';

export async function POST(req) {
  try {
    const body = await req.json();
    const { post_id, comment_id, source_user_id } = body;

    // 1) Obvesti avtorja objave
    const { data: postData, error: postErr } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', post_id)
      .single();

    if (postErr) throw postErr;

    if (postData.user_id !== source_user_id) {
      await createNotificationWithPush({
        ...body,
        type: 'comment',
        user_id: postData.user_id,
      });
    }

    // 2) Obvesti druge komentatorje (brez duplikatov)
    const { data: commenters, error: commentersErr } = await supabase
      .from('comments')
      .select('user_id')
      .eq('post_id', post_id);

    if (commentersErr) throw commentersErr;

    const notifiedUserIds = new Set();
    for (const c of commenters) {
      const uid = c.user_id;
      if (
        uid !== source_user_id &&
        uid !== postData.user_id &&
        !notifiedUserIds.has(uid)
      ) {
        notifiedUserIds.add(uid);
        await createNotificationWithPush({
          ...body,
          type: 'comment_reply',
          user_id: uid,
        });
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('❌ Napaka pri comment obvestilu:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}