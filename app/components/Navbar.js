// app/components/Navbar.js
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import ProfilOverlay from './Overlays/ProfilOverlay';
import MenuOverlay from './Overlays/MenuOverlay';
import SearchOverlay from './Overlays/SearchOverlay';
import ObvestilaOverlay from './Overlays/ObvestilaOverlay';
import { createClient } from '../../lib/supabase/client';
import { useRouter, usePathname } from 'next/navigation';
import { useFeedStore } from '../store/feedStore';

export default function Navbar() {
  const supabase = createClient();
  const router   = useRouter();
  const pathname = usePathname();

  const [isOverlayOpen, setIsOverlayOpen] = useState({
    ProfilOverlay: false,
    SearchOverlay: false,
    MenuOverlay: false,
    ObvestilaOverlay: false,
  });
  const [profile, setProfile] = useState(undefined); // undefined = loading, null = logged out
  const [unreadCount, setUnreadCount] = useState(0);
  const [newPostsCount, setNewPostsCount] = useState(0);

  // Feed store actions
  const resetAll     = useFeedStore((s) => s.resetAll);

  // Fetch user & unread notifications
  const fetchUserData = useCallback(async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setProfile(null);
      setUnreadCount(0);
      return;
    }
    const { data: profData, error: profError } = await supabase
      .from('profiles')
      .select('profile_picture_url')
      .eq('id', user.id)
      .single();
    setProfile(profError ? null : { ...profData, id: user.id });

    const { count, error: notifError } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);
    setUnreadCount(notifError ? 0 : count || 0);
  }, [supabase]);

  useEffect(() => {
    fetchUserData();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        fetchUserData();
      } else {
        setProfile(null);
        setUnreadCount(0);
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchUserData, supabase]);

  // Real-time notifications
  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel('realtime-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` },
        (payload) => {
          if (!payload.new.is_read) setUnreadCount((c) => c + 1);
        }
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [profile?.id, supabase]);

  // Real-time new-post indicator
  useEffect(() => {
    let postsChannel;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      postsChannel = supabase
        .channel('realtime-new-posts')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'posts' },
          () => setNewPostsCount((c) => c + 1)
        )
        .subscribe();
    })();
    return () => postsChannel && supabase.removeChannel(postsChannel);
  }, [supabase]);

  const toggleMenu = useCallback(
    (overlayName) => {
      setIsOverlayOpen((p) => ({ ...p, [overlayName]: !p[overlayName] }));
    },
    []
  );

  const handleCloseObvestilaOverlay = useCallback(async () => {
    setIsOverlayOpen((p) => ({ ...p, ObvestilaOverlay: false }));
    if (!profile) return;
    await supabase
      .from('notifications')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('user_id', profile.id)
      .eq('is_read', false);
    setUnreadCount(0);
  }, [profile, supabase]);

  const handleHouseClick = () => {
    // Clear all feed sections
    resetAll();
    setNewPostsCount(0);

    // If on any /zid/... route, hard-refresh the same page
    if (pathname.startsWith('/zid/')) {
      window.scrollTo(0, 0);
      router.refresh();
    } else {
      // Otherwise navigate to the main feed
      router.push('/zid/followers');
      window.scrollTo(0, 0);
    }
  };

  return (
    <>
      <ProfilOverlay
        isOpen={isOverlayOpen.ProfilOverlay}
        onClose={() => setIsOverlayOpen((p) => ({ ...p, ProfilOverlay: false }))}
        profile={profile}
      />
      <MenuOverlay
        isOpen={isOverlayOpen.MenuOverlay}
        onClose={() => setIsOverlayOpen((p) => ({ ...p, MenuOverlay: false }))}
      />
      <SearchOverlay
        isOpen={isOverlayOpen.SearchOverlay}
        onClose={() => setIsOverlayOpen((p) => ({ ...p, SearchOverlay: false }))}
      />
      <ObvestilaOverlay
        isOpen={isOverlayOpen.ObvestilaOverlay}
        onClose={handleCloseObvestilaOverlay}
      />

      <nav className="navbar">
        <div className="navbar-left">
          <div className="logo" onClick={handleHouseClick}>
            <img src="/logo-hm.png" alt="Logotip" />
          </div>
        </div>

        <ul className="navbar-center">
          <button className="hamburger-menu" onClick={() => toggleMenu('MenuOverlay')}>
            <i className="bi bi-list" />
          </button>
        </ul>

        <div className="navbar-right">
          {profile === undefined ? (
            <>
              <button className="icon-btn" disabled>
                <i className="bi bi-house-door-fill" />
              </button>
              <button className="icon-btn" disabled>
                <i className="bi bi-search" />
              </button>
              <button className="icon-btn" disabled>
                <i className="bi bi-lightning-charge" />
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
              <button className="icon-btn" onClick={handleHouseClick}>
                <i
                  className="bi bi-house-door-fill"
                  style={{ color: newPostsCount >= 5 ? 'red' : 'inherit' }}
                />
              </button>
              <button className="icon-btn" onClick={() => toggleMenu('SearchOverlay')}>
                <i className="bi bi-search" />
              </button>
              <button className="icon-btn" onClick={() => toggleMenu('ObvestilaOverlay')}>
                <i
                  className={`bi bi-lightning-charge${unreadCount > 0 ? '-fill' : ''}`}
                  style={{ color: unreadCount > 0 ? 'red' : 'inherit' }}
                />
              </button>
              <div className="avatar-wrapper" onClick={() => toggleMenu('ProfilOverlay')}>
                <img
                  src={profile.profile_picture_url || '/default-avatar.png'}
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
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
          100% {
            opacity: 1;
          }
        }
        .icon-btn:disabled {
          cursor: not-allowed;
          opacity: 0.7;
        }
      `}</style>
    </>
  );
}