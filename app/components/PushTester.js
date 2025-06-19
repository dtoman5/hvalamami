'use client';

import { useEffect } from 'react';

export default function PushTester() {
  useEffect(() => {
    // ob naložitvi nastavimo interval na 5 minut
    const id = setInterval(async () => {
      try {
        const res = await fetch('/api/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: '🛠 Testno push obvestilo',
            body: 'To je test, ki se pošilja vsakih 5 minut.',
            data: { url: '/zid' },
          }),
        });
        if (!res.ok) {
          console.error('Broadcast test neuspel:', await res.text());
        } else {
          console.log('Broadcast test uspešno poslan');
        }
      } catch (err) {
        console.error('Napaka pri broadcast testu:', err);
      }
    }, 5 * 60 * 1000);

    return () => clearInterval(id);
  }, []);

  return null;
}