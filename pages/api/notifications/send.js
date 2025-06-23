import { sendPushToToken } from '../../../lib/push-sender';

export default async function handler(req, res) {
  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Manjka token' });

  try {
    await sendPushToToken(token, 'Testno obvestilo', 'Push test uspešen 🚀');
    res.status(200).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}