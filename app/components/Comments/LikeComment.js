// app/components/Comments/LikeComment.js
"use client";

import { useState, useEffect } from "react";
import { createClient } from '../../../lib/supabase/client';
import { toast } from "react-toastify";

export default function LikeComment({ commentId }) {
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
      .from("comment_likes")
      .select("*")
      .eq("comment_id", commentId)
      .eq("user_id", userId)
      .maybeSingle()

    if (data) setIsLiked(true);
  };

  const fetchLikeCount = async () => {
    const { count } = await supabase
      .from("comment_likes")
      .select("*", { count: "exact", head: true })
      .eq("comment_id", commentId);

    if (count !== null) setLikeCount(count);
  };

  const getCommentInfo = async () => {
    const { data } = await supabase
      .from("comments")
      .select("user_id, post_id")
      .eq("id", commentId)
      .maybeSingle()
    return data;
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
          .from("comment_likes")
          .delete()
          .eq("comment_id", commentId)
          .eq("user_id", userId);

        setIsLiked(false);
        setLikeCount((prev) => prev - 1);
      } else {
        const { data: inserted, error } = await supabase
          .from("comment_likes")
          .insert([{ comment_id: commentId, user_id: userId, created_at: new Date().toISOString() }])
          .select()
          .maybeSingle()

        if (error) throw error;

        setIsLiked(true);
        setLikeCount((prev) => prev + 1);

        const commentInfo = await getCommentInfo();
        if (commentInfo?.user_id !== userId && inserted?.id) {
          await fetch('/api/notifications/comment-like', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: commentInfo.user_id,
              source_user_id: userId,
              post_id: commentInfo.post_id,
              comment_id: commentId,
              comment_like_id: inserted.id
            }),
          });          
        }
      }
    } catch (err) {
      console.error("Napaka pri všečkanju komentarja:", err.message);
      toast.error("Napaka pri všečkanju komentarja.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLikeCount();
  }, [commentId]);

  return (
    <div
      className="comment-buttons-likes"
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