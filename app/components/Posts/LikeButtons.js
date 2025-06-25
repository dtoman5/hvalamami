"use client";
import { useState, useEffect } from "react";
import { createClient } from '../../../lib/supabase/client';

export default function LikeButton({ postId }) {
  const supabase = createClient();
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        checkIfLiked(user.id);
      }
    };
    fetchUser();
  }, []);

  const checkIfLiked = async (userId) => {
    const { data } = await supabase
      .from("likes")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle()

    if (data) setIsLiked(true);
  };

  const fetchLikeCount = async () => {
    const { count } = await supabase
      .from("likes")
      .select("*", { count: "exact", head: true })
      .eq("post_id", postId);

    if (count !== null) setLikeCount(count);
  };

  const getPostOwner = async () => {
    const { data, error } = await supabase
      .from("posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (error) {
      console.error("Error fetching post owner:", error.message);
      return null;
    }

    return data.user_id;
  };

  const handleLike = async () => {
    if (!userId) {
      alert("Za všečkanje se morate prijaviti.");
      return;
    }

    setIsLoading(true);

    try {
      if (isLiked) {
        await supabase
          .from("likes")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);

        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        await supabase
          .from("likes")
          .insert([{ post_id: postId, user_id: userId, created_at: new Date().toISOString() }]);

        setIsLiked(true);
        setLikeCount((prev) => prev + 1);

        const postOwnerId = await getPostOwner();
        if (postOwnerId && postOwnerId !== userId) {
          await fetch('/api/notifications/like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: postOwnerId,
              source_user_id: userId,
              post_id: postId,
            }),
          });          
        }
      }
    } catch (error) {
      console.error("Napaka pri všečkanju:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLikeCount();
  }, [postId]);

  return (
    <div 
      className="posts-buttons-likes" 
      onClick={handleLike} 
      style={{ cursor: "pointer" }}
      disabled={isLoading}
    >
      {isLiked ? (
        <i className="bi bi-heart-fill" style={{ color: "red" }}></i>
      ) : (
        <i className="bi bi-heart"></i>
      )}
      <span>{likeCount}</span>
    </div>
  );
}