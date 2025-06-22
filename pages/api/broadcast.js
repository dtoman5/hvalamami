// pages/api/broadcast.js
import { sendBroadcast } from '@/lib/push-sender';

export default async function handler(req, res) {
  await sendBroadcast();
  res.status(200).json({ message: 'Obvestilo poslano.' });
}