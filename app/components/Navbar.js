'use client';

import ProfilOverlay from './Overlays/ProfilOverlay';
import MenuOverlay from './Overlays/MenuOverlay';
import SearchOverlay from './Overlays/SearchOverlay';
import ObvestilaOverlay from './Overlays/ObvestilaOverlay';
import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Navbar() {
  const [isOverlayOpen, setIsOverlayOpen] = useState({
    ProfilOverlay: false,
    SearchOverlay: false,
    MenuOverlay: false,
    ObvestilaOverlay: false
  });

  const [profile, setProfile] = useState(undefined); // undefined = loading, null = not logged in
  const [unreadCount, setUnreadCount] = useState(0);
  const supabase = createClient();
  const router = useRouter();

  const fetchUserData = useCallback(async () => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('profile_picture_url')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          setProfile(null);
        } else {
          setProfile({ ...profileData, id: user.id });
        }

        const { count, error: notificationsError } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);

        if (notificationsError) {
          console.error('Error fetching unread notifications:', notificationsError);
        } else {
          setUnreadCount(count || 0);
        }
      } else {
        setProfile(null);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      setProfile(null);
    }
  }, [supabase]);

  useEffect(() => {
    fetchUserData();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        await fetchUserData();
      } else {
        setProfile(null);
        setUnreadCount(0);
      }
    });

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, [fetchUserData]);

  useEffect(() => {
    if (!profile?.id) return;

    const channel = supabase
      .channel('realtime notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          if (payload.new.user_id === profile.id && !payload.new.is_read) {
            setUnreadCount((prev) => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, supabase]);

  const toggleMenu = useCallback((overlayName) => {
    if (overlayName === 'ObvestilaOverlay') {
      if (!isOverlayOpen.ObvestilaOverlay) {
        setIsOverlayOpen(prev => ({ ...prev, ObvestilaOverlay: true }));
      } else {
        handleCloseObvestilaOverlay();
      }
    } else {
      setIsOverlayOpen((prevState) => ({
        ...prevState,
        [overlayName]: !prevState[overlayName],
      }));
    }
  }, [isOverlayOpen]);

  const handleCloseObvestilaOverlay = useCallback(async () => {
    setIsOverlayOpen((prevState) => ({
      ...prevState,
      ObvestilaOverlay: false,
    }));

    if (profile) {
      try {
        const { error } = await supabase
          .from('notifications')
          .update({ is_read: true, read_at: new Date().toISOString() })
          .eq('user_id', profile.id)
          .eq('is_read', false);

        if (error) {
          console.error('Error marking notifications as read:', error);
        } else {
          setUnreadCount(0);
        }
      } catch (error) {
        console.error('Error in handleCloseObvestilaOverlay:', error);
      }
    }
  }, [profile, supabase]);

  return (
    <>
      <ProfilOverlay isOpen={isOverlayOpen.ProfilOverlay} onClose={() => setIsOverlayOpen({ ...isOverlayOpen, ProfilOverlay: false })} profile={profile} />
      <MenuOverlay isOpen={isOverlayOpen.MenuOverlay} onClose={() => setIsOverlayOpen({ ...isOverlayOpen, MenuOverlay: false })} />
      <SearchOverlay isOpen={isOverlayOpen.SearchOverlay} onClose={() => setIsOverlayOpen({ ...isOverlayOpen, SearchOverlay: false })} />
      <ObvestilaOverlay isOpen={isOverlayOpen.ObvestilaOverlay} onClose={handleCloseObvestilaOverlay} />

      <nav className="navbar">
        <Link href="/zid" className="navbar-left">
          <div className="logo">
            <img src="logo-hm.png" alt="Logotip" />
          </div>
        </Link>

        <ul className="navbar-center">
          <button className="hamburger-menu" onClick={() => toggleMenu('MenuOverlay')}>
            <i className="bi bi-list"></i>
          </button>
        </ul>

        <div className="navbar-right">
          {profile === undefined ? (
            <>
              <button className="icon-btn" disabled>
                <i className="bi bi-house-door-fill"></i>
              </button>
              <button className="icon-btn" disabled>
                <i className="bi bi-search"></i>
              </button>
              <button className="icon-btn" disabled>
                <i className="bi bi-lightning-charge"></i>
              </button>
              <div className="avatar skeleton-avatar" />
            </>
          ) : profile === null ? (
            <>
              <div className="action-btn-left login" onClick={() => router.push('/prijava')}>
                Prijava
              </div>
              <div className="action-btn-right btn-active" onClick={() => router.push('/registracija')}>
                Registracija
              </div>
            </>
          ) : (
            <>
              <button className="icon-btn">
                <Link href="/zid"><i className="bi bi-house-door-fill"></i></Link>
              </button>
              <button className="icon-btn" onClick={() => toggleMenu('SearchOverlay')}>
                <i className="bi bi-search"></i>
              </button>

              <button className="icon-btn" onClick={() => toggleMenu('ObvestilaOverlay')}>
                <i className={`bi bi-lightning-charge${unreadCount > 0 ? '-fill' : ''}`} style={{ color: unreadCount > 0 ? 'red' : 'inherit' }} />
              </button>

              <div className="avatar-wrapper" onClick={() => toggleMenu('ProfilOverlay')}>
                <img
                  src={profile.profile_picture_url || "https://static.vecteezy.com/system/resources/previews/029/796/026/non_2x/asian-girl-anime-avatar-ai-art-photo.jpg"}
                  alt="Avatar"
                  className="avatar"
                />
              </div>
            </>
          )}
        </div>
      </nav>

      <style jsx>{`
        .skeleton-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: #ccc;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { opacity: 1; }
          50% { opacity: 0.4; }
          100% { opacity: 1; }
        }

        .icon-btn:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }
      `}</style>
    </>
  );
}