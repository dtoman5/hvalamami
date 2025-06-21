// pages/api/register-device.js
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { token } = req.body;
  const userId = req.headers['x-user-id'] || 'anon';

  const { data } = await supabase
    .from('push_subscriptions')
    .select('subscription')
    .eq('subscription', token);

  if (data.length === 0) {
    await supabase.from('push_subscriptions').insert([
      { user_id: userId, subscription: token },
    ]);
  }

  res.status(200).json({ success: true });
}