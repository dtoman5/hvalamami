'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';
import { useFeedStore } from '../../store/feedStore';
import Spinner from '../../components/Loader/Spinner';

export default function CategoryFollowButton({
  categoryId,
  initialIsFollowing,
  onFollowChange,
  center = false,
}) {
  const supabase = createClient();
  const resetCategoriesFeed = useFeedStore.getState().resetSection.bind(null, 'feed:categories');

  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);

  // keep prop in sync
  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  // fetch current user
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      setIsLoading(false);
    })();
  }, [supabase]);

  const handleFollow = async () => {
    if (!userId || isLoading) return;
    setIsLoading(true);

    try {
      if (isFollowing) {
        // unfollow category
        const { error } = await supabase
          .from('category_followers')
          .delete()
          .eq('user_id', userId)
          .eq('category_id', categoryId);
        if (error) throw error;
      } else {
        // follow category
        const { error } = await supabase
          .from('category_followers')
          .insert({
            user_id: userId,
            category_id: categoryId,
            created_at: new Date().toISOString(),
          });
        if (error) throw error;
      }

      const nextState = !isFollowing;
      setIsFollowing(nextState);
      if (onFollowChange) onFollowChange(nextState);

      // reset the categories feed so it re-fetches
      resetCategoriesFeed();
    } catch (err) {
      console.error('Napaka pri sledenju kategoriji:', err.message || err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading || !userId}
      className={[
        'follow-button',
        isFollowing ? 'following' : 'not-following',
        isLoading ? 'loading' : '',
        center ? 'position-center' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isLoading ? (
        <Spinner size={12} />
      ) : isFollowing ? (
        <>
          <i className="bi bi-check"></i> Slediš kategoriji
        </>
      ) : (
        <>
          <i className="bi bi-plus"></i> Sledi kategoriji
        </>
      )}
    </button>
  );
}