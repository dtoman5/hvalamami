// public/firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: '<YOUR_API_KEY>',
  authDomain: '<YOUR_AUTH_DOMAIN>',
  projectId: '<YOUR_PROJECT_ID>',
  messagingSenderId: '<YOUR_MESSAGING_SENDER_ID>',
  appId: '<YOUR_APP_ID>',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('📬 SW received bg message:', payload);
  const { title, body, url } = JSON.parse(payload.data.firebasePayload);
  self.registration.showNotification(title, { body, data: { url } });
});

self.addEventListener('notificationclick', (e) => {
  console.log('📬 Notification click:', e.notification.data);
  e.notification.close();
  e.waitUntil(clients.openWindow(e.notification.data.url || '/'));
});