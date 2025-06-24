import { sendPushToToken } from '../../../lib/push-sender';

export default async function handler(req, res) {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Manjka token' });
  }

  try {
    await sendPushToToken(
      token,
      '📢 Testno obvestilo',
      'To je uspešno poslano testno push sporočilo!'
    );

    res.status(200).json({ success: true });
  } catch (err) {
    console.error('❌ Napaka pri pošiljanju:', err);
    res.status(500).json({ error: err.message });
  }
}