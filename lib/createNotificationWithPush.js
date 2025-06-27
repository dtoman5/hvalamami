import { supabase } from './supabase/server-direct';
import { sendPushToToken } from './push-sender';

export async function createNotificationWithPush({
  type,
  user_id,
  source_user_id,
  post_id = null,
  comment_id = null,
  comment_like_id = null
}) {
  try {
    const { error } = await supabase.from('notifications').insert([{
      user_id,
      source_user_id,
      type,
      post_id,
      comment_id,
      comment_like_id,
      is_read: false,
    }]);

    if (error) throw error;

    const { data: tokenData, error: tokenError } = await supabase
      .from('push_subscriptions')
      .select('token')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tokenError) {
      console.error('Napaka pri pridobivanju token:', tokenError.message);
      return;
    }

    if (!tokenData?.token) {
      console.warn('Uporabnik nima registriranega push žetona.');
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', source_user_id)
      .maybeSingle();

    const username = profileData?.username || 'Uporabnik';

    if (profileError) {
      console.warn('Napaka pri pridobivanju uporabniškega imena:', profileError.message);
    }

    let title = `@${username}`;
    let body = 'Imate novo obvestilo na hvalamami.si';

    switch (type) {
      case 'follow':
        title = `@${username}`;
        body = 'vam je pričela slediti';
        break;
      case 'like':
        title = `@${username}`;
        body = 'je bila všeč tvoja objava.';
        break;
      case 'comment':
        title = `@${username}`;
        body = 'je komentirala tvojo objavo.';
        break;
      case 'comment_reply':
        title = `@${username}`;
        body = 'je tudi komentirala objavo';
        break;
      case 'comment_like':
        title = `@${username}`;
        body = 'je všečkala tvoj komentar';
        break;
    }

    await sendPushToToken(tokenData.token, title, body);

  } catch (err) {
    console.error('Napaka pri createNotificationWithPush:', err.message);
  }
}