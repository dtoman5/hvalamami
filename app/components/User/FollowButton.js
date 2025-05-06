'use client';
import { useState, useEffect } from 'react';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { createNotification } from '@/lib/notifications';

const FollowButton = ({ followingId, onFollowChange, center = false }) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [followerId, setFollowerId] = useState(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setFollowerId(user.id);
        checkIfFollowing(user.id);
      }
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  const checkIfFollowing = async (userId) => {
    const { data } = await supabase
      .from('user_follows')
      .select('*')
      .eq('follower_id', userId)
      .eq('following_id', followingId)
      .single();

    setIsFollowing(!!data);
  };

  const handleFollow = async () => {
    if (!followerId || isLoading) return;

    setIsLoading(true);
    const newIsFollowing = !isFollowing;

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('user_follows')
          .delete()
          .eq('follower_id', followerId)
          .eq('following_id', followingId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_follows')
          .insert([{
            follower_id: followerId,
            following_id: followingId,
            created_at: new Date().toISOString()
          }]);

        if (error) throw error;

        await createNotification({
          type: 'follow',
          user_id: followingId,
          source_user_id: followerId
        });
      }

      setIsFollowing(newIsFollowing);
      if (onFollowChange) onFollowChange();
    } catch (error) {
      console.error('Napaka pri sledenju:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading || !followerId}
      className={`
        follow-button 
        ${isFollowing ? 'following' : 'not-following'} 
        ${isLoading ? 'loading' : ''} 
        ${center ? 'position-center' : ''}
      `}
    >
      {isLoading ? (
        <div className="spinner"></div>
      ) : isFollowing ? (
        <><i className="bi bi-people"></i> Slediš</>
      ) : (
        <><i className="bi bi-person-plus"></i> Sledi</>
      )}
    </button>
  );
};

export default FollowButton;