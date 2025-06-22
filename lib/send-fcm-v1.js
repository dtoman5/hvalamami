import { GoogleAuth } from 'google-auth-library';
import fetch from 'node-fetch';

const auth = new GoogleAuth({
  keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
  scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
});

let accessTokenCache = null;
let accessTokenExpiry = 0;

async function getAccessToken() {
  if (accessTokenCache && Date.now() < accessTokenExpiry - 60000) {
    return accessTokenCache;
  }
  const client = await auth.getClient();
  const res = await client.getAccessToken();
  accessTokenCache = res.token;
  accessTokenExpiry = Date.now() + (res.res?.data.expiry_date || 3600 * 1000);
  return accessTokenCache;
}

export async function sendPushToToken(token, title, body) {
  const authToken = await getAccessToken();
  const projectId = (await auth.getClient()).projectId;
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const message = { message: { token, notification: { title, body } } };
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${authToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`FCM error: ${JSON.stringify(json)}`);
  return json;
}