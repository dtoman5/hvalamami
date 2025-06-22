// app/components/Posts/Post.js
'use client';

import React, { useState, useEffect } from "react";
import TimeAgo from "./TimeAgo";
import UserBadge from "../User/UserBadge";
import LikeButton from "./LikeButtons";
import { createClient } from '../../../lib/supabase/client';
import { usePostReviewStore } from "../../store/postReviewStore";
import MediaLazyLoader from "../../components/LazyLoading";
import Link from "next/link";
import DeletePost from "./DeletePost";

function Post({ post, onDelete }) {
  const supabase = createClient();
  const { openReview } = usePostReviewStore();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);
  const [isAuthor, setIsAuthor] = useState(false);
  const [hasReported, setHasReported] = useState(false);
  const [showShareNotification, setShowShareNotification] = useState(null);
  const [deleting, setDeleting] = useState(false);

  if (!post) return null;

  const displayedContent = showFullContent
    ? post.content || ''
    : (post.content || '').slice(0, 200);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsAuthor(user.id === post.user_id);
        const { data: report } = await supabase
          .from("post_reports")
          .select("id")
          .eq("post_id", post.id)
          .eq("user_id", user.id)
          .maybeSingle();
        if (report) setHasReported(true);
      }
    })();
  }, [post.id, post.user_id, supabase]);

  const handleReport = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("Prijavite se, da označite objavo kot sporno.");
      return;
    }
    if (hasReported) {
      alert("Objavo ste že označili.");
      return;
    }
    const { error } = await supabase
      .from("post_reports")
      .insert([{ post_id: post.id, user_id: user.id }]);
    if (!error) {
      setHasReported(true);
      alert("Objava je bila označena.");
    }
  };

  const handleEdit = () => {
    openReview(post);
  };

  const handleDelete = () => {
    const shouldDelete = window.confirm('Res želite izbrisati to objavo?');
    if (shouldDelete) {
      setDeleting(true);
    }
  };

  const handleShare = async () => {
    try {
      const url = `${window.location.origin}/objava/${post.id}`;
      if (navigator.share) {
        await navigator.share({
          title: `${post.profiles?.username} – ${post.categories?.name || 'Objava'}`,
          text: post.content?.slice(0, 100) + (post.content?.length > 100 ? '…' : ''),
          url,
        });
        setShowShareNotification({ type: 'success', message: 'Uspešno deljeno!' });
      } else {
        await navigator.clipboard.writeText(url);
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

  const toggleFull = () => setShowFullContent(v => !v);
  const image = post.images?.[0];
  const video = post.videos?.[0];

  const commentCount = Array.isArray(post.comments)
    ? post.comments[0]?.count ?? 0
    : post.comments?.count ?? 0;

  return (
    <div className="posts">
      {deleting && (
        <DeletePost
          postId={post.id}
          onClose={() => setDeleting(false)}
          onDeleted={() => {
            setDeleting(false);
            onDelete();
          }}
        />
      )}

      {showShareNotification && (
        <div className={`share-notification ${showShareNotification.type}`}>
          {showShareNotification.message}
        </div>
      )}

      <div className="posts-content">
        <div className="posts-info">
          <div className="posts-user-cat">
            <Link scroll={false} href={`/profil/${post.profiles?.username}`} className="posts-avatar">
              <img
                src={post.profiles?.profile_picture_url || '/default-avatar.png'}
                alt="Profilna slika"
                loading="lazy"
              />
            </Link>
            <div className="posts-username-cat">
              <div className="posts-username">
                <Link scroll={false} href={`/profil/${post.profiles?.username}`}>
                  {post.profiles?.username}
                </Link>
                <UserBadge userType={post.profiles?.user_type} />
              </div>
              {post.categories?.name && (
                <div className="posts-cat">
                  Objavljeno v{' '}
                  <Link scroll={false} href={`/kategorija/${post.categories.name}`}>
                    <span>{post.categories.name}</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
          <div className="posts-time-menu">
            <div className="posts-time">
              <TimeAgo timestamp={post.created_at} />
            </div>
            <div className="posts-menu">
              <i
                className="bi bi-three-dots-vertical"
                onClick={() => setIsMenuOpen(v => !v)}
              />
            </div>
          </div>
        </div>

        {isMenuOpen && (
          <div className="show-post-menu m-b-2">
            {isAuthor ? (
              <>
                <button className="dropdown-item edit" onClick={handleEdit}>
                  <i className="bi bi-pencil"></i> Uredi objavo
                </button>
                <button className="dropdown-item delete" onClick={handleDelete}>
                  <i className="bi bi-trash"></i> Izbriši objavo
                </button>
              </>
            ) : (
              <button
                className="dropdown-item report"
                onClick={handleReport}
                disabled={hasReported}
              >
                <i className="bi bi-flag"></i>{' '}
                {hasReported ? 'Označeno' : 'Označi kot sporno'}
              </button>
            )}
          </div>
        )}

        <div className="m-b-2">
          {post.is_story && <p className="story-label">Zgodba</p>}
          {post.rating && <span className="posts-review">
            Ocena: {post.rating} <i className="bi bi-asterisk" />
          </span>}
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
            <span className="posts-show-more" onClick={toggleFull}>
              {showFullContent ? 'pokaži manj' : 'pokaži več'}
            </span>
          )}
        </h2>

        <div className="posts-buttons">
          <div className="posts-buttons-left">
            <LikeButton postId={post.id} />
            <Link href={`/objava/${post.id}`} className="posts-buttons-comments">
              <i className="bi bi-chat" /> <span>{commentCount}</span>
            </Link>
            <div className="posts-buttons-share" onClick={handleShare}>
              <i className="bi bi-share" />
            </div>
          </div>
          <div className="posts-buttons-right">
            {post.external_url && (
              <a
                href={post.external_url}
                className="posts-button-visit"
                target="_blank"
                rel="noopener noreferrer"
              >
                Obišči <i className="bi bi-arrow-up-right" />
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Post;