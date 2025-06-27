import { supabase } from './supabase/server-direct';
import { sendPushToToken } from './push-sender';

function generateNotificationUrl({ type, post_id, source_username }) {
  switch (type) {
    case 'follow':
      return `/profil/${source_username}`;
    case 'like':
    case 'comment':
    case 'comment_reply':
    case 'comment_like':
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
    // Shrani v bazo obvestil
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

    // Pridobi push token
    const { data: tokenData, error: tokenError } = await supabase
      .from('push_subscriptions')
      .select('token')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (tokenError) {
      console.error('Napaka pri pridobivanju tokena:', tokenError.message);
      return;
    }

    if (!tokenData?.token) {
      console.warn('⚠️ Uporabnik nima registriranega push žetona.');
      return;
    }

    // Pridobi username avtorja akcije
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', source_user_id)
      .maybeSingle();

    if (profileError) {
      console.warn('Napaka pri pridobivanju uporabniškega imena:', profileError.message);
    }

    const username = profileData?.username || 'Uporabnik';

    // Obvestilo
    const title = `@${username}`;
    let body = 'Imate novo obvestilo';

    switch (type) {
      case 'follow':
        body = 'vam je pričela slediti';
        break;
      case 'like':
        body = 'je bila všeč tvoja objava.';
        break;
      case 'comment':
        body = 'je komentirala tvojo objavo.';
        break;
      case 'comment_reply':
        body = 'je tudi komentirala objavo.';
        break;
      case 'comment_like':
        body = 'je všečkala tvoj komentar.';
        break;
    }

    // Ustvari klikabilen URL
    const url = generateNotificationUrl({
      type,
      post_id,
      source_username: username
    });

    // Pošlji push
    await sendPushToToken(tokenData.token, title, body, { url });

  } catch (err) {
    console.error('❌ Napaka pri createNotificationWithPush:', err.message);
  }
}