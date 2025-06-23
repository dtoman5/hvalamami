import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { token, user_id } = req.body;

  if (!token || !user_id) {
    return res.status(400).json({ error: 'Manjka token ali user_id' });
  }

  const { data, error } = await supabase
    .from('push_subscriptions')
    .insert({
      user_id,
      subscription: { endpoint: token, timestamp: new Date().toISOString() },
    });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true });
}