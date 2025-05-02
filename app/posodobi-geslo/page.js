"use client";
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Link from 'next/link';
import PosodobiGeslo from '../auth/components/PosodobiGeslo';

export default function PosodobiGesloPage() {
  const [tokenValid, setTokenValid] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkToken = async () => {
      // Preveri error parametre v URL-ju
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error === 'access_denied' || errorDescription?.includes('expired')) {
        setErrorMessage("Povezava je pretekla ali neveljavna");
        setTokenValid(false);
        setLoading(false);
        return;
      }

      try {
        // Preveri veljavnost seje
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          throw new Error("Neveljavna seja");
        }
        
        setTokenValid(true);
      } catch (error) {
        console.error('Napaka pri preverjanju žetona:', error);
        setErrorMessage("Manjkajoč ali neveljaven žeton za ponastavitev");
        setTokenValid(false);
      } finally {
        setLoading(false);
      }
    };

    checkToken();
  }, [searchParams, supabase]);

  if (loading) {
    return (
      <div className="center-position">
        <div className="right-side-content">
          <div className="right-side-text text-center">
            <p>Preverjanje povezave...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div className="center-position">
        <div className="right-side-content">
          <div className="right-side-text text-center">
            {errorMessage && <p className="error-message">{errorMessage}</p>}
            <Link href="/pozabljeno-geslo" className="submit-btn">
              Zahtevaj novo povezavo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <PosodobiGeslo />;
}