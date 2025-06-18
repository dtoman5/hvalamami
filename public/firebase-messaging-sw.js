importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey:               'TVOJ_API_KEY',
  authDomain:           'TVOJ_AUTH_DOMAIN',
  projectId:            'TVOJ_PROJECT_ID',
  messagingSenderId:    'TVOJ_MESSAGING_SENDER_ID',
  appId:                'TVOJ_APP_ID',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  let data = {};
  try {
    data = JSON.parse(payload.data.firebasePayload);
  } catch {}
  const title = data.title || 'Novo obvestilo';
  const options = {
    body: data.body || '',
    icon: '/logo192.png',
    data: { url: data.url || '/' },
  };
  self.registration.showNotification(title, options);
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(ws => {
      for (const w of ws) {
        if (w.url === e.notification.data.url && 'focus' in w) {
          return w.focus();
        }
      }
      return clients.openWindow(e.notification.data.url);
    })
  );
});