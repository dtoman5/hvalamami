import admin from 'firebase-admin';

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FCM_SERVICE_ACCOUNT_JSON, 'base64').toString('utf-8')
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export async function sendPushToToken(token, title, body, data = {}) {
  const message = {
    token,
    notification: {
      title: title || '🔔 Obvestilo',
      body: body || 'Privzeta vsebina obvestila.',
    },
    webpush: {
      notification: {
        icon: '/logo-hm.png',
        actions: [
          {
            action: 'open_url',
            title: 'Odpri aplikacijo',
          },
        ],
      },
    },
    data: {
      ...data,
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('✅ Obvestilo poslano z ID:', response);
    return { success: true };
  } catch (err) {
    console.error('❌ Napaka pri pošiljanju:', err.message);
    throw new Error(`FCM napaka: ${err.message}`);
  }
}