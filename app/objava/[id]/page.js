'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import TimeAgo from '@/components/Posts/TimeAgo';
import UserBadge from '@/components/User/UserBadge';
import LikeButton from '@/components/Posts/LikeButtons';
import LikeComment from '@/components/Comments/LikeComment';
import Navbar from '@/components/Navbar';
import { usePostReviewStore } from '@/store/postReviewStore';
import { createNotification } from '@/lib/notifications';
import InfinityLoader from '@/components/InfiniteList';
import MediaLazyLoader from '@/components/LazyLoading';

export default function PostPage() {
  const supabase = createClientComponentClient();
  const params = useParams();
  const router = useRouter();
  const { openReview } = usePostReviewStore();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentInput, setCommentInput] = useState("");
  const [userId, setUserId] = useState(null);
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [showShareNotification, setShowShareNotification] = useState(null);
  const textareaRef = useRef(null);
  const commentsChannel = useRef(null);

  // Fetch user and check auth status
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        if (user) setUserId(user.id);
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  // Fetch post data
  useEffect(() => {
    let mounted = true;

    const fetchPost = async () => {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select(`*, profiles(*), categories(*), images(*), videos(*), comments(*)`)
          .eq('id', params.id)
          .single();

        if (!mounted) return;
        
        if (error) throw error;

        setPost(data);
        setIsAuthor(userId === data?.user_id);
        
        // Check if user has reported this post
        if (userId) {
          const { data: report, error: reportError } = await supabase
            .from('post_reports')
            .select('id')
            .eq('post_id', params.id)
            .eq('user_id', userId)
            .single();
          
          if (!reportError && report) setHasReported(true);
        }
      } catch (error) {
        console.error('Error loading post:', error);
        if (!mounted) return;
        setPost(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (params.id) fetchPost();

    return () => {
      mounted = false;
    };
  }, [params.id, userId]);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!params.id) return;

    // Post changes channel
    const postChannel = supabase
      .channel('realtime-post')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'posts',
          filter: `id=eq.${params.id}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setPost(payload.new);
          } else if (payload.eventType === 'DELETE') {
            router.push('/'); // Redirect to home page on delete
          }
        }
      )
      .subscribe();

    // Comments channel for all operations
    commentsChannel.current = supabase
      .channel('realtime-comments')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments',
          filter: `post_id=eq.${params.id}`
        },
        async (payload) => {
          try {
            if (payload.eventType === 'INSERT') {
              const { data: newComment, error } = await supabase
                .from('comments')
                .select('*, profiles(*), comment_likes(count)')
                .eq('id', payload.new.id)
                .single();

              if (!error && newComment) {
                document.dispatchEvent(new CustomEvent('new-comment', { detail: newComment }));
              }
            } else if (payload.eventType === 'UPDATE') {
              document.dispatchEvent(new CustomEvent('update-comment', { 
                detail: payload.new 
              }));
            } else if (payload.eventType === 'DELETE') {
              document.dispatchEvent(new CustomEvent('delete-comment', { 
                detail: payload.old.id 
              }));
            }
          } catch (error) {
            console.error('Error handling comment change:', error);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postChannel);
      if (commentsChannel.current) {
        supabase.removeChannel(commentsChannel.current);
      }
    };
  }, [params.id, router]);

  // Optimized comment fetching with cursor pagination
  const fetchComments = useCallback(async (cursor, pageSize) => {
    try {
      let query = supabase
        .from("comments")
        .select("*, profiles(*), comment_likes(count)")
        .eq("post_id", params.id)
        .order("created_at", { ascending: false })
        .limit(pageSize);

      if (cursor) {
        query = query.lt('created_at', cursor.created_at);
      }

      const { data, error } = await query;
      
      if (error) throw error;

      const last = data[data.length - 1];
      return {
        data,
        nextCursor: data.length === pageSize ? { 
          id: last.id, 
          created_at: last.created_at 
        } : null
      };
    } catch (error) {
      console.error('Error fetching comments:', error);
      return { data: [], nextCursor: null };
    }
  }, [params.id, supabase]);

  // Handle share functionality
  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${post.profiles?.username} - ${post.categories?.name || 'Objava'}`,
          text: post.content?.slice(0, 100) + (post.content?.length > 100 ? '...' : ''),
          url: `${window.location.origin}/objava/${post.id}`,
        });
        setShowShareNotification({ type: 'success', message: 'Uspešno deljeno!' });
      } else {
        const shareUrl = `${window.location.origin}/objava/${post.id}`;
        await navigator.clipboard.writeText(shareUrl);
        setShowShareNotification({ type: 'info', message: 'Povezava kopirana v odložišče' });
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setShowShareNotification({ type: 'error', message: 'Napaka pri deljenju' });
      }
    } finally {
      setTimeout(() => setShowShareNotification(null), 3000);
    }
  };

  // Handle comment add/update with error handling
  const handleAddOrUpdateComment = async () => {
    if (!commentInput.trim()) return;
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        throw new Error("Za komentiranje se morate prijaviti.");
      }

      const now = new Date().toISOString();
      
      if (editingCommentId) {
        const { error } = await supabase
          .from("comments")
          .update({ 
            content: commentInput, 
            updated_at: now 
          })
          .eq("id", editingCommentId);
        
        if (error) throw error;

        setEditingCommentId(null);
        setCommentInput("");
      } else {
        const { data: newComment, error } = await supabase
          .from("comments")
          .insert([{ 
            content: commentInput, 
            post_id: post.id, 
            user_id: user.id,
            created_at: now,
            updated_at: now
          }])
          .select('*, profiles(*)')
          .single();

        if (error) throw error;

        setCommentInput("");

        // Create notification if not commenting on own post
        if (post.user_id !== user.id) {
          await createNotification({
            user_id: post.user_id,
            source_user_id: user.id,
            type: "comment",
            post_id: post.id,
            comment_id: newComment.id
          });
        }
      }
    } catch (error) {
      console.error('Error saving comment:', error);
      alert(error.message || 'Napaka pri shranjevanju komentarja');
    }
  };

  // Handle comment deletion
  const handleDeleteComment = async (commentId) => {
    if (!confirm('Ali ste prepričani, da želite izbrisati ta komentar?')) return;
    
    try {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);
      
      if (error) throw error;

      // Update the UI after deletion
      document.dispatchEvent(new CustomEvent('delete-comment', { detail: commentId }));
    } catch (error) {
      console.error('Error deleting comment:', error);
      alert('Napaka pri brisanju komentarja');
    }
  };

  // Handle post deletion
  const handleDeletePost = async () => {
    if (!confirm('Ali ste prepričani, da želite izbrisati to objavo?')) return;
    
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', post.id);
      
      if (error) throw error;

      // Redirect to home page after deleting the post
      router.push('/');
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Napaka pri brisanju objave');
    }
  };

  // Handle post reporting
  const handleReportPost = async () => {
    if (!userId) {
      alert("Prijavite se, da označite objavo za sporno.");
      return;
    }
    
    if (hasReported) {
      alert("To objavo ste že označili kot sporno.");
      return;
    }
    
    try {
      const { error } = await supabase
        .from('post_reports')
        .insert([{ post_id: post.id, user_id: userId }]);
      
      if (error) throw error;
      
      setHasReported(true);
      alert("Objava je označena kot sporna.");
    } catch (error) {
      console.error('Error reporting post:', error);
      alert('Napaka pri prijavi objave');
    }
  };

  if (loading) return <div>Nalaganje...</div>;
  if (!post) return <div>Objava ni najdena.</div>;

  const image = post.images?.[0];
  const video = post.videos?.[0];

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="container-content-full">
          <div className="row p-b-15">
                <div className="posts">
                  <div className="posts-info">
                    <div className="posts-user-cat">
                      <Link href={`/profil/${post.profiles?.username}`} className="posts-avatar">
                        <img 
                          src={post.profiles?.profile_picture_url || 'https://newprofilepic.photo-cdn.net//assets/images/article/profile.jpg?90af0c8'} 
                          alt="Profilna slika" 
                          loading="lazy" 
                        />
                      </Link>
                      <div className="posts-username-cat">
                        <div className="posts-username">
                          <Link href={`/profil/${post.profiles?.username}`}>{post.profiles?.username}</Link>
                          <span><UserBadge userType={post.profiles?.user_type} /></span>
                          {post.is_story && (
                            <p className="story-label">Zgodba</p>
                          )}
                        </div>
                        <div className="posts-cat">
                          Objavljeno v <Link href={`/kategorija/${post.categories?.name}`}><span>{post.categories?.name}</span></Link>
                        </div>
                      </div>
                    </div>
                    <div className="posts-time-menu">
                      <div className="posts-time">
                        <TimeAgo timestamp={post?.created_at} />
                      </div>
                      <div className="posts-menu">
                        <i 
                          className="bi bi-three-dots-vertical" 
                          onClick={() => setIsMenuOpen(!isMenuOpen)}
                        ></i>
                      </div>
                    </div>
                  </div>

                  {isMenuOpen && (
                    <div className="show-post-menu">
                      {isAuthor ? (
                        <>
                          <button 
                            className="dropdown-item edit" 
                            onClick={() => openReview(post)}
                          >
                            <i className="bi bi-pencil"></i> Uredi objavo
                          </button>
                          <button 
                            className="dropdown-item delete" 
                            onClick={handleDeletePost}
                          >
                            <i className="bi bi-trash"></i> Izbriši objavo
                          </button>
                        </>
                      ) : (
                        <button 
                          className={`dropdown-item report ${hasReported ? 'disabled' : ''}`} 
                          onClick={handleReportPost}
                          disabled={hasReported}
                        >
                          <i className="bi bi-flag"></i> {hasReported ? "Označeno" : "Označi kot sporno"}
                        </button>
                      )}
                    </div>
                  )}

                  {(image || video) && (
                    <div className="posts-img">
                      {image ? (
                        <MediaLazyLoader
                          type="image"
                          src={image.file_url}
                          width={image.width}
                          height={image.height}
                        />
                      ) : video ? (
                        <MediaLazyLoader
                          type="video"
                          src={video.file_url}
                          thumbnail={video.thumbnail_url}
                          width={video.width}
                          height={video.height}
                        />
                      ) : null}
                    </div>
                  )}

                  <h2 className="posts-content-text">{post.content}</h2>

                  <div className="posts-buttons">
                    <div className="posts-buttons-left">
                      <LikeButton postId={post.id} />
                      <Link href={`/objava/${post.id}`} className="posts-buttons-comments">
                        <i className="bi bi-chat"></i> <span>{post.comments.length || 0}</span>
                      </Link>
                      <div className="posts-buttons-share" onClick={handleShare}>
                        <i className="bi bi-share"></i>
                      </div>
                    </div>
                  </div>

                  <section>
                    <h2 className="menu-title m-t-5 m-b-2">Vsi komentarji</h2>
                    <InfinityLoader
                      fetchItems={fetchComments}
                      renderItem={(comment) => (
                        <div key={comment.id} className="flex-inline w-b-container p-t-2 p-b-2">
                          <div className="avatar">
                            <img 
                              src={comment.profiles?.profile_picture_url || 'https://newprofilepic.photo-cdn.net//assets/images/article/profile.jpg?90af0c8'} 
                              alt="Profilna slika" 
                              loading="lazy"
                            />
                          </div>
                          <div className="p-l-2">
                            <div className="username">
                              <Link href={`/profil/${comment.profiles?.username}`}>
                                {comment.profiles?.username}
                              </Link>
                              <UserBadge userType={comment.profiles?.user_type} />
                              <TimeAgo timestamp={comment?.created_at} />
                              {userId === comment.user_id && (
                                <>
                                  <button 
                                    onClick={() => {
                                      setEditingCommentId(comment.id);
                                      setCommentInput(comment.content);
                                    }} 
                                    className="btn-comm-edit"
                                  >
                                    <i className="bi bi-pencil"></i>
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteComment(comment.id)} 
                                    className="btn-comm-delete"
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </>
                              )}
                            </div>
                            <div className="p-t-1">
                              <p>{comment.content}</p>
                            </div>
                            <div className="posts-buttons-left m-t-1">
                              <LikeComment commentId={comment.id} />
                            </div>
                          </div>
                        </div>
                      )}
                      pageSize={10}
                      emptyComponent={<p className="text-center">Ni komentarjev.</p>}
                      endComponent={<p className="text-center m-t-2">Ni več komentarjev.</p>}
                      className="comments-loader-wrapper"
                    />
                  </section>

                  <div className="posts-comment-input">
                    <div className="form-group">
                      <textarea
                        ref={textareaRef}
                        rows={2}
                        placeholder="Dodaj svoj komentar..."
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleAddOrUpdateComment();
                          }
                        }}
                        style={{ 
                          resize: "none",
                          overflowY: "auto",
                          minHeight: '50px',
                          maxHeight: "228px",
                          lineHeight: "1.5",
                          padding: "8px",
                          boxSizing: "border-box"
                        }}
                      />
                      <button 
                        className={`btn-1 ${!commentInput.trim() ? 'disabled' : ''}`} 
                        onClick={handleAddOrUpdateComment}
                        disabled={!commentInput.trim()}
                      >
                        {editingCommentId ? "Posodobi" : "Dodaj"} <i className="bi bi-send-plus"></i>
                      </button>
                    </div>
                  </div>

                  <div className="overlay-list-end"></div>
                </div>
          </div>
        </div>
      </div>
    </>
  );
}