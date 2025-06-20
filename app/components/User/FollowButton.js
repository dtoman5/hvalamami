// app/components/User/FollowButton.js
'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { createNotification } from '../../lib/notifications';
import { useFeedStore } from '../../store/feedStore';
import Spinner from '../../components/Loader/Spinner';

export default function FollowButton({
  followingId,
  onFollowChange,
  center = false,
  small = false,
}) {
  const supabase = createClient();

  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [followerId, setFollowerId] = useState(null);

  // 1) Load current user + follow state
  useEffect(() => {
    (async () => {
      const { data: { user }, error: userErr } = await supabase.auth.getUser();
      if (userErr) {
        console.error('Error fetching session user:', userErr.message);
      } else if (user) {
        setFollowerId(user.id);
        const { data, error } = await supabase
          .from('user_follows')
          .select('follower_id')
          .eq('follower_id', user.id)
          .eq('following_id', followingId)
          .maybeSingle();
        if (error) {
          console.error('Error checking follow state:', error.message);
        } else {
          setIsFollowing(!!data);
        }
      }
      setIsLoading(false);
    })();
  }, [followingId, supabase]);

  // 2) handle follow/unfollow
  const handleFollow = async () => {
    if (!followerId || isLoading) return;
    setIsLoading(true);

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', followerId)
          .eq('following_id', followingId);
        if (error) throw error;
      } else {
        // Follow
        const { error } = await supabase
          .from('user_follows')
          .insert({
            follower_id: followerId,
            following_id: followingId,
            created_at: new Date().toISOString(),
          });
        if (error) throw error;

        await createNotification({
          type: 'follow',
          user_id: followingId,
          source_user_id: followerId,
        });
      }

      const nextState = !isFollowing;
      setIsFollowing(nextState);
      onFollowChange?.(nextState);

      // reset feeds so they re-fetch immediately
      const resetFollowers = useFeedStore.getState().resetSection.bind(null, 'feed:followers');
      const resetStories   = useFeedStore.getState().resetSection.bind(null, 'feed:stories');
      resetFollowers();
      resetStories();
      window.dispatchEvent(new CustomEvent('force-fetch', { detail: 'feed:followers' }));
      window.dispatchEvent(new CustomEvent('force-fetch', { detail: 'feed:stories' }));
    } catch (err) {
      console.error('Napaka pri sledenju:', err.message || err);
    } finally {
      setIsLoading(false);
    }
  };

  const btnClasses = [
    'follow-button',
    isFollowing ? 'following' : 'not-following',
    small ? 'small-btn' : 'large-btn',
    isLoading ? 'loading' : '',
    center ? 'position-center' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button onClick={handleFollow} disabled={isLoading || !followerId} className={btnClasses}>
      {isLoading ? (
        <Spinner size={12} />
      ) : isFollowing ? (
        <>
          <i className="bi bi-people"></i> Slediš
        </>
      ) : (
        <>
          <i className="bi bi-person-plus"></i> Sledi
        </>
      )}
    </button>
  );
}