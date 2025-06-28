import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  const { token, user_id } = req.body;

  if (!token || !user_id) {
    return res.status(400).json({ error: 'Manjka token ali user_id' });
  }

  const finalToken =
    typeof token === 'object' && token.endpoint ? token.endpoint : token;

  try {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          user_id,
          token: finalToken,
        },
        {
          onConflict: ['user_id'],
          ignoreDuplicates: false,
        }
      );

    if (error) {
      console.error('Napaka upsert:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('Naprava shranjena:', data);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Napaka handler:', err);
    return res.status(500).json({ error: err.message });
  }
}