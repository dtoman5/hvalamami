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

  console.log('🔔 Prejeta naprava:', { token, user_id });

  if (!token || !user_id) {
    return res.status(400).json({ error: 'Manjka token ali user_id' });
  }

  // token je JSON, preverimo
  if (typeof token !== 'object' || !token.endpoint) {
    console.error('❌ Token ni veljaven JSON:', token);
    return res.status(400).json({ error: 'Token mora biti veljaven JSON objekt z endpointom' });
  }

  const { data, error } = await supabase
    .from('push_subscriptions')
    .insert({ user_id, token });

  if (error) {
    console.error('❌ Napaka pri vstavljanju:', error);
    return res.status(500).json({ error: 'Napaka pri shranjevanju', details: error.message });
  }

  console.log('✅ Naprava shranjena:', data);
  return res.status(200).json({ success: true });
}