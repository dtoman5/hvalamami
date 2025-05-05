// app/components/Posts/Post.js
"use client";
import React, { useState, useEffect } from "react";
import TimeAgo from "./TimeAgo";
import UserBadge from "../User/UserBadge";
import LikeButton from "./LikeButtons";
import { usePostReviewStore } from "@/store/postReviewStore";
import MediaLazyLoader from "@/components/LazyLoading";
import Link from "next/link";

function Post({ post, onDelete }) {
  const supabase = createClientComponentClient();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [showShareNotification, setShowShareNotification] = useState(null);
  const { openReview } = usePostReviewStore();

  if (!post) return null;

  const displayedContent = showFullContent
    ? post?.content || ''
    : (post?.content || '').slice(0, 200);

  const toggleShowFullContent = () => setShowFullContent(!showFullContent);

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser();
      setIsAuthor(user?.id === post.user_id);

      if (user) {
        const { data: existingReport } = await supabase
          .from("post_reports")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", user.id)
          .single();

        if (existingReport) setHasReported(true);
      }
    }

    fetchData();
  }, [post.id]);

  const handleReport = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return alert("Prijavite se, da označite objavo za sporno.");

    if (hasReported) return alert("To objavo ste že označili kot sporno.");

    const { error } = await supabase.from("post_reports").insert([{ post_id: post.id, user_id: user.id }]);

    if (!error) {
      setHasReported(true);
      alert("Objava je označena kot sporna.");
    }
  };

  const handleEdit = () => {
    openReview(post);
  };

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
        // Fallback za naprave brez Web Share API
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

  const image = post.images?.[0];
  const video = post.videos?.[0];

  return (
    <div className="posts">
      {showShareNotification && (
        <div className={`share-notification ${showShareNotification.type}`}>
          {showShareNotification.message}
        </div>
      )}
      
      <div className="posts-content">
        
        <div className="posts-info">
          <div className="posts-user-cat">
            <Link scroll={false} href={`/profil/${post.profiles?.username}`} className="posts-avatar">
              <img src={post.profiles?.profile_picture_url} alt="Profilna slika" loading="lazy" />
            </Link>
            <div className="posts-username-cat">
              <div className="posts-username">
                <Link scroll={false} href={`/profil/${post.profiles?.username}`}>{post.profiles?.username}</Link>
                <UserBadge userType={post.profiles?.user_type} />
              </div>
              <div className="posts-cat">
                {post.categories?.name && (
                  <div>
                    Objavljeno v <Link href={`/kategorija/${post.categories?.name}`}><span>{post.categories?.name}</span></Link>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="posts-time-menu">
            <div className="posts-time">
              <TimeAgo timestamp={post?.created_at} />
            </div>
            <div className="posts-menu">
              <i className="bi bi-three-dots-vertical" onClick={() => setIsMenuOpen(!isMenuOpen)}></i>
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="show-post-menu">
            {isAuthor ? (
              <>
                <button className="dropdown-item edit" onClick={handleEdit}><i className="bi bi-pencil"></i> Uredi objavo</button>
                <button className="dropdown-item delete" onClick={() => onDelete(post.id)}><i className="bi bi-trash"></i> Izbriši objavo</button>
              </>
            ) : (
              <button className="dropdown-item report" onClick={handleReport} disabled={hasReported}>
                <i className="bi bi-flag"></i> {hasReported ? "Označeno" : "Označi kot sporno"}
              </button>
            )}
          </div>
        )}

        <div className="m-b-2">
          {post.is_story && (
            <p className="story-label">Zgodba</p>
          )}
          <span className="posts-review">Ocena: {post?.rating} <i className="bi bi-asterisk"></i></span>
        </div>

        {(image || video) && (
          <div className="posts-img">
            {video ? (
              <MediaLazyLoader
                type="video"
                src={video.file_url}
                thumbnail={video.thumbnail_url}
                width={video.width}
                height={video.height}
              />
            ) : (
              <MediaLazyLoader
                type="image"
                src={image.file_url}
                width={image.width}
                height={image.height}
              />
            )}
          </div>
        )}

        <h2 className="posts-content-text">
          {displayedContent}
          {post.content?.length > 200 && (
            <span className="p-l-1 posts-show-more" onClick={toggleShowFullContent}>
              {showFullContent ? 'pokaži manj' : 'pokaži več'}
            </span>
          )}
        </h2>

        <div className="posts-buttons">
          <div className="posts-buttons-left">
            <LikeButton postId={post.id} />
            <Link scroll={false} href={`/objava/${post.id}`} className="posts-buttons-comments">
              <i className="bi bi-chat"></i> <span>{post.comments?.length || 0}</span>
            </Link>
            <div className="posts-buttons-share" onClick={handleShare}>
              <i className="bi bi-share"></i>
            </div>
          </div>
          <div className="posts-buttons-right">
            {post.external_url && (
              <a href={post.external_url} className="posts-button-visit" target="_blank" rel="noopener noreferrer">
                Obišči <i className="bi bi-arrow-up-right"></i>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Post;