// pages/api/broadcast.js
import { sendBroadcast } from '../../lib/push-sender'

export default async function handler(req, res) {
  // you can protect this route with a secret header if you like
  await sendBroadcast()
  res.status(200).json({ ok: true, broadcast: true })
}