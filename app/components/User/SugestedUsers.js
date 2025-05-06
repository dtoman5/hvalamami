'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import UserBadge from '../User/UserBadge';
import FollowButton from '../User/FollowButton';
import Link from 'next/link';

const truncateUsername = (username, maxLength = 8) => {
    if (username.length > maxLength) {
      return `${username.substring(0, maxLength)}...`;
    }
    return username;
  };

const SugestedUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    async function getSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(session);
      } catch (err) {
        console.error('Error getting session:', err);
      }
    }

    getSession();
  }, [supabase.auth]);

  useEffect(() => {
    async function fetchSuggestedUsers() {
      if (!session) return;

      setLoading(true);
      setError(null);

      try {
        // Get suggested users (excluding current user)
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, profile_picture_url, user_type, is_verified')
          .neq('id', session.user.id)
          .order('user_type', { ascending: false }) // Sort by user type (admin > golduser > influencer)
          .limit(15);

        if (error) throw error;

        // Check which users are already being followed
        const { data: follows, error: followError } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', session.user.id);

        if (followError) throw followError;

        const followedUserIds = follows.map(f => f.following_id);
        const filteredUsers = data.filter(user => !followedUserIds.includes(user.id));

        setUsers(filteredUsers);
      } catch (err) {
        console.error('Error loading suggested users:', err);
        setError('Error loading recommendations');
      } finally {
        setLoading(false);
      }
    }

    if (session) {
      fetchSuggestedUsers();
    }
  }, [session, supabase]);

  const handleFollowSuccess = (userId) => {
    // Remove the followed user from the suggestions
    setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
  };

  return (
    <div className="suggested-users">
      
      {loading ? (
        <div className="loading">Loading...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : users.length > 0 ? (
        <div className='flex-content-x'>
        <div className="users-list">
          {users.map((user) => (
            <div key={user.id} className="user-card">
              <div className="user-info">
              
              <div className="profile-avatar position-center">
              <Link href={`/profil/${user.username}`}>
                  <img 
                    src={user?.profile_picture_url || '/default-avatar.png'}
                    alt="Profile Picture" 
                    className="profile-avatar-img" 
                  />
                  </Link>
                </div>
                <div className="profile-username profile-username-small m-t-2 m-b-2">
                  <Link href={`/profil/${user.username}`}>{truncateUsername(user.username)}</Link>
                  <span className="p-l-1">
                    <UserBadge userType={user.user_type} />
                  </span>
                </div>
              </div>
              {session?.user?.id !== user.id && (
                <FollowButton 
                  followingId={user.id} 
                  onFollowChange={() => handleFollowSuccess(user.id)}
                  center={true}
                />
              )}
            </div>
          ))}
        </div>
        </div>
      ) : (
        <div className="no-results">No suggestions available</div>
      )}
    </div>
  );
};

export default SugestedUsers;