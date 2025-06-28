importScripts("https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js");

// Firebase config – naj ostane kot je
firebase.initializeApp({
  apiKey: "AIzaSyDYaw4D-zW4j2OnsgYiEKPLenQpTjsztoc",
  authDomain: "hvalamami-5ea07.firebaseapp.com",
  projectId: "hvalamami-5ea07",
  messagingSenderId: "450479142387",
  appId: "1:450479142387:web:b270d921c975d6a7308e86",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, badge, url } = payload.data || {};

  const notificationTitle = title || 'Novo obvestilo';
  const notificationOptions = {
    body: body || '',
    icon: icon || '',
    badge: badge || '/logo-hm-small.png',
    data: {
      url: url || '/',
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Klik na obvestilo
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});