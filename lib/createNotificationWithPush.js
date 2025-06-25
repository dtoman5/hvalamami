// lib/createNotificationWithPush.js
import { createClient } from './supabase/client';
import { sendPushToToken } from './push-sender';

export async function createNotificationWithPush({
  type,
  user_id,            // prejemnik
  source_user_id,     // kdo je sprožil
  post_id = null,
  comment_id = null,
  comment_like_id = null
}) {
  const supabase = createClient();

  try {
    // 1. Ustvari obvestilo v bazi
    const { error } = await supabase.from('notifications').insert([
      {
        user_id,
        source_user_id,
        type,
        post_id,
        comment_id,
        comment_like_id,
        is_read: false
      }
    ]);

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
      console.error('❌ Napaka pri pridobivanju tokena:', tokenError.message);
      return;
    }

    if (!tokenData || !tokenData.token) {
      console.warn('⚠️ Uporabnik nima registriranega push žetona.');
      return;
    }

    // 3. Pripravi vsebino obvestila
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
      // Dodaj še druge type-e po potrebi
    }

    // 4. Pošlji push obvestilo
    await sendPushToToken(tokenData.token, title, body);

  } catch (err) {
    console.error('❌ Napaka pri createNotificationWithPush:', err.message);
  }
}