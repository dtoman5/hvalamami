'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';
import Link from 'next/link';
import UserBadge from '../User/UserBadge';
import FollowButton from '../User/FollowButton';
import { useFeedStore } from '../../store/feedStore';

const truncateUsername = (username, maxLength = 8) =>
  username.length > maxLength ? `${username.slice(0, maxLength)}...` : username;

export default function SugestedUsers() {
  const supabase = createClient();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [error, setError] = useState(null);

  const handleFollowSuccess = (userId) => {
    setUsers(prev => prev.filter(user => user.id !== userId));

    // Reset followers feed in zustand + sproži fetch
    const store = useFeedStore.getState();
    store.resetSection('followers');

    setTimeout(() => {
      document.dispatchEvent(new CustomEvent('force-fetch', { detail: 'followers' }));
    }, 50);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
  }, []);

  useEffect(() => {
    if (!session) return;

    (async () => {
      try {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, username, profile_picture_url, user_type, is_verified')
          .neq('id', session.user.id)
          .order('user_type', { ascending: false })
          .limit(15);

        const { data: follows } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', session.user.id);

        const followingIds = follows.map(f => f.following_id);
        const suggestions = profiles.filter(p => !followingIds.includes(p.id));

        setUsers(suggestions);
      } catch (err) {
        console.error(err);
        setError('Napaka pri nalaganju predlogov');
      } finally {
        setLoading(false);
      }
    })();
  }, [session]);

  if (loading) return <div className="loading">Nalaganje...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return users.length ? (
    <div className="flex-content-x users-list">
      {users.map(user => (
        <div key={user.id} className="user-card">
          <div className="user-info">
            <div className="profile-avatar position-center">
              <Link scroll={false} href={`/profil/${user.username}`}>
                <img
                  src={user.profile_picture_url || '/default-avatar.png'}
                  alt="Profilna slika"
                  className="profile-avatar-img"
                />
              </Link>
            </div>
            <div className="profile-username profile-username-small m-t-2 m-b-2">
              <Link scroll={false} href={`/profil/${user.username}`}>
                {truncateUsername(user.username)}
              </Link>
              <span className="p-l-1"><UserBadge userType={user.user_type} /></span>
            </div>
          </div>
          <FollowButton
            followingId={user.id}
            onFollowChange={() => handleFollowSuccess(user.id)}
            center
          />
        </div>
      ))}
    </div>
  ) : (
    <div className="no-results">Ni predlogov</div>
  );
}