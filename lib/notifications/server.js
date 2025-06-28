import { supabase } from '../supabase/server-direct';
import { sendPushToToken } from '../push-sender';

export async function createNotificationWithPush({
  type,
  user_id,
  source_user_id,
  post_id = null,
  comment_id = null,
  comment_like_id = null,
}) {
  try {
    // 1. Vstavi obvestilo v bazo
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

    // 2. Pridobi push token uporabnika
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
      console.warn('Uporabnik nima registriranega push žetona.');
      return;
    }

    // 3. Pridobi profil pošiljatelja (username, profilna)
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('username, profile_picture_url')
      .eq('id', source_user_id)
      .maybeSingle();

    const username = profileData?.username || 'Uporabnik';
    const profileImage = profileData?.profile_picture_url || '/logo-hm-small.png';

    // 4. Pridobi thumbnail slike objave (če obstaja)
    let postImage = null;
    if (post_id) {
      const { data: postData } = await supabase
        .from('posts')
        .select('images')
        .eq('id', post_id)
        .maybeSingle();

      if (postData?.images?.[0]?.file_url) {
        postImage = postData.images[0].file_url;
      }
    }

    // 5. Nastavi title, body, url in ikono
    let title = `@${username}`;
    let body = 'Imate novo obvestilo na hvalamami.si';
    let url = '/';
    let icon = postImage || profileImage;

    switch (type) {
      case 'follow':
        body = 'vam je pričela slediti';
        url = `/profil/${username}`;
        break;
      case 'like':
        body = 'je všečkala tvojo objavo';
        url = `/objava/${post_id}`;
        break;
      case 'comment':
        body = 'je komentirala tvojo objavo';
        url = `/objava/${post_id}`;
        break;
      case 'comment_reply':
        body = 'je tudi komentirala objavo';
        url = `/objava/${post_id}`;
        break;
      case 'comment_like':
        body = 'je všečkala tvoj komentar';
        url = `/objava/${post_id}`;
        break;
    }

    // 6. Pošlji push obvestilo
    await sendPushToToken(tokenData.token, title, body, {
      icon,
      badge: '/logo-hm-small.png',
      url,
    });
  } catch (err) {
    console.error('Napaka pri createNotificationWithPush:', err.message);
  }
}