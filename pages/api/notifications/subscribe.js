import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // 🚫 ni varno v brskalniku!
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { token, user_id } = req.body;

  console.log('📥 Prejet zahtevek:', { token, user_id });

  if (!token || !user_id) {
    console.error('❌ Manjka token ali user_id');
    return res.status(400).json({ error: 'Manjka token ali user_id' });
  }

  let subscriptionObject;

  try {
    // Poskusi pretvoriti token v JSON objekt (če je stringificiran)
    subscriptionObject = typeof token === 'string' ? JSON.parse(token) : token;
  } catch (err) {
    console.error('❌ Token ni veljaven JSON:', err);
    return res.status(400).json({ error: 'Token ni veljaven JSON', details: err.message });
  }

  try {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .insert({
        user_id,
        subscription: subscriptionObject,
        created_at: new Date().toISOString(),
      });

    if (error) {
      console.error('❌ Napaka pri vstavljanju v Supabase:', error);
      return res.status(500).json({ error: 'Napaka pri shranjevanju v bazo', details: error.message });
    }

    console.log('✅ Naprava uspešno registrirana:', data);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Nepričakovana napaka:', err);
    return res.status(500).json({ error: 'Strežniška napaka', details: err.message });
  }
}