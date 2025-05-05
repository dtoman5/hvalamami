'use client';
import { useState, useEffect } from 'react';

const CategoryFollowButton = ({ categoryId, initialIsFollowing, onFollowChange }) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    setIsFollowing(initialIsFollowing);
  }, [initialIsFollowing]);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
      setIsLoading(false);
    };
    fetchUser();
  }, []);

  const handleFollow = async () => {
    if (!userId || !categoryId || isLoading) return;

    setIsLoading(true);
    const newIsFollowing = !isFollowing;

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('category_followers')
          .delete()
          .eq('user_id', userId)
          .eq('category_id', categoryId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('category_followers')
          .insert({
            user_id: userId,
            category_id: categoryId,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      setIsFollowing(newIsFollowing);
      if (onFollowChange) onFollowChange(newIsFollowing);
    } catch (error) {
      console.error('Napaka pri sledenju kategoriji:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading || !userId}
      className={`follow-button ${isFollowing ? 'following' : 'not-following'} ${isLoading ? 'loading' : ''}`}
    >
      {isLoading ? (
        <div className="spinner"></div>
      ) : isFollowing ? (
        <><i className="bi bi-check"></i> Slediš kategoriji</>
      ) : (
        <><i className="bi bi-plus"></i> Sledi kategoriji</>
      )}
    </button>
  );
};

export default CategoryFollowButton;