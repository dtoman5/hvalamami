'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function ProfileOverlay({ isOpen, onClose }) {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) return;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (profile && profile.username) {
        setUsername(profile.username);
      }
    };

    fetchProfile();
  }, [supabase]);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) router.push('/prijava');
  };

  if (!isOpen) return null;

  return (
    <div className="overlay active" id="profileOverlay">
      <button className="close-btn" onClick={onClose}>
        <i className="bi bi-x-lg"></i>
      </button>
      <div className="overlay-content">
        <ul>
          <li>
            {username ? (
              <Link href={`/profil/${username}`}>Moj profil</Link>
            ) : (
              <span style={{ opacity: 0.6 }}>Nalagam...</span>
            )}
          </li>
          <li>
            <Link href="/uredi-profil">Uredi profil</Link>
          </li>
          <li>
            <a onClick={handleSignOut} style={{ color: 'red', cursor: 'pointer' }}>
              Odjava
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}