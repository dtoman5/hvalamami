// File: pages/api/notifications/subscribe.js

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
    console.error('❌ Manjka token ali user_id:', { token, user_id });
    return res.status(400).json({ error: 'Manjka token ali user_id' });
  }

  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id,
        token, // <- token je tipa TEXT v Supabase
      });

    if (error) {
      console.error('❌ Napaka pri shranjevanju:', error);
      return res.status(500).json({ error: 'Napaka pri shranjevanju' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Server napaka:', err);
    return res.status(500).json({ error: 'Notranja napaka strežnika' });
  }
}