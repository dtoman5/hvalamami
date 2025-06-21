import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react';

export default function PrejmiObvestilaClient() {
  const supabase = useSupabaseClient(); // koristi Provider
  const user = useUser();               // pridobi user iz konteksta
  const [permission, setPermission] = useState('default');
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState('');

  const requestPermissionAndRegister = async () => {
    if (!user) {
      setStatus('Ni prijavljenega uporabnika');
      return;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result !== 'granted') {
      setStatus('Dovoljenje zavrnjeno');
      return;
    }

    const messaging = getMessaging();
    const currentToken = await getToken(messaging, { vapidKey });
    setToken(currentToken);

    const res = await fetch('/api/save-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: currentToken, user_id: user.id })
    });

    const json = await res.json();
    if (!res.ok) {
      console.error('Shranjevanje neuspešno:', json);
      setStatus('Napaka pri shranjevanju');
    } else {
      setStatus('Uspešno shranjeno');
    }
  };

  return (
    <div>
      <h2>Obvestila</h2>
      <p>Dovoljenje: {permission}</p>
      <button onClick={requestPermissionAndRegister}>
        Dovoli obvestila
      </button>
      {token && <p><strong>Token naprave:</strong><br />{token}</p>}
      {status && <p>Status: {status}</p>}
    </div>
  );
}