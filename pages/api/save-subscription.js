import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // ✅ brez NEXT_PUBLIC_ !!
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { token, user_id } = req.body;

  console.log('🔔 Incoming push subscription:', { token, user_id });

  if (!token || !user_id) {
    console.error('❌ Missing token or user_id');
    return res.status(400).json({ error: 'Missing token or user_id' });
  }

  const subscriptionObject = {
    endpoint: token,
    timestamp: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('push_subscriptions')
    .insert({ user_id, subscription: subscriptionObject });

  if (error) {
    console.error('❌ Error saving token to Supabase:', error.message);
    return res.status(500).json({ error: 'Failed to save token', details: error.message });
  }

  console.log('✅ Token saved to Supabase:', data);
  return res.status(200).json({ success: true });
}