import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token, user_id } = req.body;

  console.log('🔔 Poskušam shraniti:', { token, user_id });

  if (!token || !user_id) {
    return res.status(400).json({ error: 'Manjka token ali user_id' });
  }

  try {
    const subscription = { endpoint: token }; // ✅ pretvori v objekt (JSONB)
    const { data, error } = await supabase
      .from('push_subscriptions')
      .insert([{ user_id, subscription }]);

    if (error) {
      console.error('❌ Napaka pri vstavljanju:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('✅ Shranjeno:', data);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Nepričakovana napaka:', err);
    res.status(500).json({ error: 'Nepričakovana napaka' });
  }
}