import { createNotificationWithPush } from '@/lib/createNotificationWithPush';
import { supabase } from '@/lib/supabase/server-direct';

export async function POST(req) {
  try {
    const body = await req.json();
    const { post_id, comment_id, source_user_id } = body;

    // 1) Obvesti avtorja objave (type: comment)
    const { data: postData, error: postErr } = await supabase
      .from('posts')
      .select('user_id')
      .eq('id', post_id)
      .single();

    if (postErr) throw postErr;

    // Pošlji obvestilo avtorju objave (če ni isti kot komentator)
    if (postData.user_id !== source_user_id) {
      await createNotificationWithPush({
        ...body,
        type: 'comment',
        user_id: postData.user_id,
      });
    }

    // 2) Obvesti druge komentatorje (type: comment_reply)
    const { data: commenters, error: commentersErr } = await supabase
      .from('comments')
      .select('user_id')
      .eq('post_id', post_id);

    if (commentersErr) throw commentersErr;

    const notifiedUserIds = new Set();
    for (const c of commenters) {
      const uid = c.user_id;
      if (
        uid !== source_user_id && // ne obvestimo sebe
        uid !== postData.user_id && // ne še enkrat avtorja
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

    return new Response(JSON.stringify({ success: true }));
  } catch (err) {
    console.error('❌ Napaka pri comment obvestilu:', err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}