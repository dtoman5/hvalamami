import { supabase } from '../supabase/server-direct';
import { sendPushToToken } from '../push-sender';

function generateNotificationUrl({ type, post_id, source_user_id }) {
  switch (type) {
    case 'follow':
      return `/profil/${source_user_id}`;
    case 'like':
    case 'comment':
    case 'comment_like':
    case 'comment_reply':
      return `/objava/${post_id}`;
    default:
      return '/';
  }
}

export async function createNotificationWithPush({
  type,
  user_id,
  source_user_id,
  post_id = null,
  comment_id = null,
  comment_like_id = null
}) {
  try {
    const { error } = await supabase.from('notifications').insert([
      {
        user_id,
        source_user_id,
        type,
        post_id,
        comment_id,
        comment_like_id,
        is_read: false,
      }
    ]);

    if (error) throw error;

    const { data: tokenData, error: tokenError } = await supabase
      .from('push_subscriptions')
      .select('token')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tokenError) {
      console.error('❌ Napaka pri pridobivanju tokena:', tokenError.message);
      return;
    }

    if (!tokenData?.token) {
      console.warn('⚠️ Uporabnik nima registriranega push žetona.');
      return;
    }

    let title = '🔔 Novo obvestilo';
    let body = 'Imate novo obvestilo v aplikaciji HvalaMami.';

    switch (type) {
      case 'follow':
        title = '👩‍👩‍👧 Sledenje';
        body = 'Mamica vam je pričela slediti.';
        break;
      case 'like':
        title = '❤️ Všeček';
        body = 'Mamici je všeč tvoja objava.';
        break;
      case 'comment':
        title = '💬 Komentar';
        body = 'Mamica je komentirala tvojo objavo.';
        break;
      case 'comment_like':
        title = '👍 Všeček komentarja';
        body = 'Mamici je všeč tvoj komentar.';
        break;
      case 'comment_reply':
        title = '💬 Odgovor na komentar';
        body = 'Mamica je odgovorila na komentar.';
        break;
    }

    const url = generateNotificationUrl({ type, post_id, source_user_id });

    await sendPushToToken(tokenData.token, title, body, { url });
  } catch (err) {
    console.error('❌ Napaka pri createNotificationWithPush:', err.message);
  }
}