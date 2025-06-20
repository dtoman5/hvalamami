// pages/api/broadcast.js
import { sendPush } from '../../lib/push-sender'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  try {
    await sendPush(req.body)
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('Broadcast error:', err)
    return res.status(500).json({ error: 'Broadcast failed' })
  }
}