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
    notification: { title, body },
    data,
  };

  try {
    const response = await admin.messaging().send(message);
    return response;
  } catch (err) {
    throw new Error(`FCM error: ${err.message}`);
  }
}