import admin from 'firebase-admin';

const serviceAccount = JSON.parse(
  Buffer.from(process.env.FCM_SERVICE_ACCOUNT_JSON, 'base64').toString('utf-8')
);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Pošiljanje samo prek data payloada (da ne podvaja obvestil)
export async function sendPushToToken(token, title, body, data = {}) {
  const message = {
    token,
    data: {
      ...data,
      title: title,
      body: body,
      icon: data.icon || '/logo-hm-192.png',
      badge: data.badge || '/logo-hm-192.png',
      url: data.url || '/',
    },
  };

  try {
    const response = await admin.messaging().send(message);
    console.log('Obvestilo poslano z ID:', response);
    return { success: true };
  } catch (err) {
    console.error('Napaka pri pošiljanju:', err.message);
    throw new Error(`FCM napaka: ${err.message}`);
  }
}