// pages/api/notifications/subscribe.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { token, user_id } = req.body;

  if (!token || !user_id) {
    return res.status(400).json({ error: 'Manjka token ali user_id' });
  }

  // ✅ ovijemo token v objekt (če subscription je jsonb)
  const subscription = {
    token: token,
    timestamp: new Date().toISOString()
  };

  try {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .insert({ user_id, subscription });

    if (error) {
      console.error('❌ Napaka pri vstavljanju:', error);
      return res.status(500).json({ error: 'Napaka pri vstavljanju v bazo', details: error.message });
    }

    console.log('✅ Naprava registrirana:', data);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Strežniška napaka:', err);
    return res.status(500).json({ error: 'Strežniška napaka', details: err.message });
  }
}