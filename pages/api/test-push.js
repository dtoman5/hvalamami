import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { token } = req.body;
  if (!token) return res.status(400).json({ error: 'Manjka token' });

  try {
    const response = await admin.messaging().sendToDevice(token, {
      notification: {
        title: 'Test obvestilo',
        body: 'To je testno sporočilo na tvojo napravo!',
      },
      data: {
        url: '/',
      },
    });

    console.log('✔️ Obvestilo poslano:', response);
    res.status(200).json({ success: true, response });
  } catch (err) {
    console.error('❌ Napaka pri pošiljanju:', err);
    res.status(500).json({ error: 'Napaka pri pošiljanju obvestila' });
  }
}