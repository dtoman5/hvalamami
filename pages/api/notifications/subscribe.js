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

  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .insert([{ token, user_id }]);

    if (error) {
      console.error('❌ Napaka pri vstavljanju:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ Naprava shranjena za user:', user_id);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Server napaka:', err);
    res.status(500).json({ error: err.message });
  }
}