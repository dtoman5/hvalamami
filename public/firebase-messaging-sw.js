importScripts("https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js");

// Firebase konfiguracija – statično, ker .env ni na voljo v Service Workerju
firebase.initializeApp({
  apiKey: "AIzaSyDYaw4D-zW4j2OnsgYiEKPLenQpTjsztoc",
  authDomain: "hvalamami-5ea07.firebaseapp.com",
  projectId: "hvalamami-5ea07",
  messagingSenderId: "450479142387",
  appId: "1:450479142387:web:b270d921c975d6a7308e86"
});

// Inicializiraj Firebase Messaging
const messaging = firebase.messaging();

// Obdelava obvestil v ozadju
messaging.onBackgroundMessage(function (payload) {
  console.log('[firebase-messaging-sw.js] Prejeto obvestilo v ozadju:', payload);

  const { title, body } = payload.notification;

  const notificationOptions = {
    body: body || 'Novo obvestilo!',
    icon: '/logo-hm.png', // Pot do ikone obvestila
    data: payload.data,   // Dodatni podatki, če obstajajo
  };

  self.registration.showNotification(title || 'HvalaMami', notificationOptions);
});