'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { createClient } from '../../../lib/supabase/client';
import FollowButton from '../User/FollowButton';
import TimeAgo from '../Posts/TimeAgo';
import UserBadge from '../User/UserBadge';
import Link from 'next/link';

export default function ObvestilaOverlay({ isOpen, onClose }) {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const PAGE_SIZE = 10;
  const sentinelRef = useRef(null);

  // 1) load current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUser(user);
    });
  }, [supabase]);

  // 2) de-dupe & collapse, and filter out notifications from deleted users
  const collapseNotifications = (items) => {
    const valid = items.filter(n => n.source_profile && n.source_profile.id);
    const seen = new Set();
    return valid.filter((n) => {
      let key;
      switch (n.type) {
        case 'post-update':
        case 'story-update':
          key = `upd:${n.post?.id}:${n.type}`;
          break;
        case 'follow':
          key = `fol:${n.source_profile.id}`;
          break;
        case 'like':
          key = `like:${n.post?.id}`;
          break;
        case 'comment_like':
          key = `cmlike:${n.comment_id}`;
          break;
        default:
          return true;
      }
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  // 3) fetch page
  const fetchNotifications = useCallback(
    async (cursor) => {
      if (!user) return { items: [], nextCursor: null };
      let query = supabase
        .from('notifications')
        .select(`
          *,
          source_profile:source_user_id (
            id, username, profile_picture_url, user_type
          ),
          post:post_id (
            id,
            images(file_url),
            videos(thumbnail_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(PAGE_SIZE);

      if (cursor) {
        query = query
          .lt('created_at', cursor.created_at)
          .or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
      }

      const { data, error } = await query;
      if (error) {
        console.error(error);
        return { items: [], nextCursor: null };
      }

      const uniq = [];
      const seenIds = new Set();
      for (const n of data) {
        if (!seenIds.has(n.id)) {
          seenIds.add(n.id);
          uniq.push(n);
        }
      }

      const last = uniq[uniq.length - 1];
      return {
        items: uniq,
        nextCursor: last ? { id: last.id, created_at: last.created_at } : null
      };
    },
    [supabase, user]
  );

  // 4) initial load
  useEffect(() => {
    if (!isOpen || !user || initialLoaded) return;
    (async () => {
      setLoading(true);
      const { items, nextCursor: c } = await fetchNotifications(null);
      setNotifications(collapseNotifications(items));
      setNextCursor(c);
      setInitialLoaded(true);
      setLoading(false);
    })();
  }, [isOpen, user, fetchNotifications, initialLoaded]);

  // 5) infinite scroll
  useEffect(() => {
    if (!sentinelRef.current || loading || !nextCursor) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) handleLoadMore();
    }, { rootMargin: '200px' });
    obs.observe(sentinelRef.current);
    return () => obs.disconnect();
  }, [nextCursor, loading]);

  const handleLoadMore = async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    const { items, nextCursor: c } = await fetchNotifications(nextCursor);
    const combined = [...notifications, ...items];
    setNotifications(collapseNotifications(combined));
    setNextCursor(c);
    setLoading(false);
  };

  const handleClose = async () => {
    if (user) {
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);
    }
    setInitialLoaded(false);
    setNotifications([]);
    setNextCursor(null);
    onClose();
  };

  const handleClearAll = async () => {
    if (!user) return;
    await supabase.from('notifications').delete().eq('user_id', user.id);
    setNotifications([]);
    setNextCursor(null);
  };

  const getMedia = (n) =>
    n.post?.images?.[0]?.file_url || n.post?.videos?.[0]?.thumbnail_url;

  const shortenUsername = (u) =>
    u && u.length > 8 ? u.slice(0, 8) + '…' : u || '';

  const renderNotification = (n) => {
    const isFollow = n.type === 'follow';
    const profileLink = `/profil/${n.source_profile.username}`;
    const postLink = `/objava/${n.post?.id}`;
    return (
      <Link
        scroll={false}
        href={isFollow ? profileLink : postLink}
        key={`${n.id}-${n.created_at}`}
        className={`overlay-list-notify${!n.is_read ? ' unread' : ''}`}
      >
        <div className="notification-profile">
          <div className="avatar">
            <img
              src={n.source_profile.profile_picture_url || '/default-avatar.png'}
              alt=""
            />
          </div>
          <div className="left-nofity-info">
            <div className="username">
              {shortenUsername(n.source_profile.username)} <UserBadge userType={n.source_profile.user_type} />
              <div className="time"><TimeAgo timestamp={n.created_at} /></div>
            </div>
            <div className="p-t-1">
              {{
                follow: 'Mamica vam je pričela slediti',
                post: 'Objava je uspešno ustvarjena',
                story: 'Zgodba je uspešno ustvarjena',
                like: 'Mamici je všeč tvoja objava',
                comment: 'Mamica je komentirala tvojo objavo',
                comment_reply: 'Mamica je komentirala isto objavo kot vi',
                comment_like: 'Mamici je všeč tvoj komentar',
                'post-update': 'Objava uspešno urejena',
                'story-update': 'Zgodba uspešno urejena'
              }[n.type] || 'Novo obvestilo'}
            </div>
          </div>
        </div>
        {isFollow ? (
          <FollowButton followingId={n.source_profile.id} />
        ) : (
          getMedia(n) && (
            <div className="notify-massage-post">
              <img src={getMedia(n)} alt="" />
            </div>
          )
        )}
      </Link>
    );
  };

  if (!isOpen) return null;

  return (
    <div id="notificationsOverlay" className="overlay active">
      <button className="close-btn" onClick={handleClose}><i className="bi bi-x-lg" /></button>
      <div className="overlay-content">
        <div className="overlay-content-notify">
          <div className="menu-title m-b-2">
            Obvestila
            <button className="btn-delete-not" onClick={handleClearAll}>
              Počisti vsa
            </button>
          </div>
          <div className="inner-not-bg">
            {notifications.length === 0 && !loading && (
              <p className="text-center p-t-2 p-b-2">Ni obvestil.</p>
            )}
            {notifications.map(renderNotification)}
            {loading && (
              <div className="text-center p-4">
                <div className="spinner" style={{ width: 24, height: 24 }} />
              </div>
            )}
            <div ref={sentinelRef} style={{ height: 1 }} />
            {!nextCursor && notifications.length > 0 && !loading && (
              <p className="text-center p-t-2 p-b-2">
                Ni več obvestil za prikaz.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}