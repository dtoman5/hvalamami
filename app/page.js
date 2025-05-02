'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Navbar from './components/Navbar';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UpgradeProfile() {
  const [user, setUser] = useState(null); // Odstranili smo ":any"
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
        
        if (!user) {
          router.push('/prijava');
        }
      } catch (error) {
        console.error('Error checking user:', error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, [supabase.auth, router]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return null;
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="container-content-full">
          <div className="row row-bg p-b-10">
            <div className="row-inner-nbg">
              <div className="m-b-5">
                <h1>Tukaj bo prva predstavitvena stran</h1>
                <p>Zelo lepo stran imam če ti je prav ali ne!</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}