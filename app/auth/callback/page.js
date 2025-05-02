"use client";
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const handleAuth = async () => {
      const code = searchParams.get('code');
      const type = searchParams.get('type');

      if (!code) {
        router.push('/prijava?error=missing_code');
        return;
      }

      try {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) throw error;

        if (type === 'recovery') {
          router.push('/posodobi-geslo');
        } else {
          router.push('/');
        }
      } catch (error) {
        console.error('Auth error:', error);
        router.push('/pozabljeno-geslo?error=invalid_link');
      }
    };

    handleAuth();
  }, [searchParams, router, supabase]);

  return (
    <div className="center-position">
      <div className="right-side-content">
        <div className="right-side-text text-center">
          <p>Potrjevanje povezave...</p>
        </div>
      </div>
    </div>
  );
}