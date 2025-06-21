// pages/api/save-subscription.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const { token, user_id } = req.body;

  if (!token || !user_id) {
    return res.status(400).json({ error: 'Missing token or user_id' });
  }

  const subscriptionObject = {
    endpoint: token,
    timestamp: Date.now()
  };

  const { data, error } = await supabase
    .from('push_subscriptions')
    .insert({ user_id, subscription: subscriptionObject });

  if (error) {
    console.error('Error saving token to Supabase:', error);
    return res.status(500).json({ error: 'Failed to save token' });
  }

  return res.status(200).json({ success: true });
}