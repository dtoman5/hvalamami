// pages/api/notifications.js

import { sendPush } from '../../lib/push-sender'

export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await sendPush(req.body)
      return res.status(200).json({ ok: true })
    } catch (err) {
      console.error('Error in /api/notifications:', err)
      return res.status(500).json({ error: 'Push failed' })
    }
  } else {
    res.setHeader('Allow', ['POST'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
  }
}