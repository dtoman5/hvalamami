// lib/notifications.js
import { createClient } from '../../lib/supabase/client'

export async function createNotification({ type, user_id, source_user_id, post_id = null, comment_id = null, comment_like_id = null }) {
  const supabase = createClient();

  try {
    const { error } = await supabase.from('notifications').insert([
      {
        user_id,               // prejemnik obvestila
        source_user_id,        // uporabnik, ki je sprožil
        type,                  // npr. "like", "comment", "comment_like"
        post_id,
        comment_id,
        comment_like_id,
        created_at: new Date().toISOString(),
        is_read: false
      }
    ]);

    if (error) throw error;
  } catch (err) {
    console.error('Napaka pri ustvarjanju obvestila:', err.message);
  }
}