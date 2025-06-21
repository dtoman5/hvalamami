'use client'

import { useEffect, useState } from 'react'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { app } from '../lib/client/firebase'

export default function PrejmiObvestilaClient() {
  const [permission, setPermission] = useState('default')
  const [token, setToken] = useState(null)

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return

    const messaging = getMessaging(app)

    // Request permission
    Notification.requestPermission().then((result) => {
      setPermission(result)

      if (result === 'granted') {
        getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
        })
          .then((currentToken) => {
            if (currentToken) {
              setToken(currentToken)

              // Send token to backend
              fetch('/api/save-subscription', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token: currentToken }),
              })
                .then((res) => {
                  if (!res.ok) {
                    console.error('Failed to save subscription:', res.statusText)
                  }
                })
                .catch(console.error)
            } else {
              console.warn('No registration token available.')
            }
          })
          .catch((err) => {
            console.error('An error occurred while retrieving token. ', err)
          })
      }
    })

    // Handle incoming messages
    onMessage(messaging, (payload) => {
      console.log('Message received. ', payload)
      alert(`Novo obvestilo: ${payload?.notification?.title}`)
    })
  }, [])

  return (
    <div>
      <h2>Obvestila</h2>
      <p>Stanje dovoljenja: <strong>{permission}</strong></p>
      {token && (
        <div>
          <p><strong>Token naprave:</strong></p>
          <code>{token}</code>
        </div>
      )}
    </div>
  )
}