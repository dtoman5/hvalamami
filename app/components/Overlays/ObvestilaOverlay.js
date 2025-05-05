'use client';

import React, { useEffect, useState, useCallback } from 'react';
import FollowButton from '../User/FollowButton';
import TimeAgo from '../Posts/TimeAgo';
import UserBadge from '../User/UserBadge';
import Link from 'next/link';
import InfinityLoader from '../InfiniteList';

export default function ObvestilaOverlay({ isOpen, onClose }) {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);

  // Fetch user and check auth status
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (!error && user) setUser(user);
    };
    fetchUser();
  }, [supabase]);

  // Remove duplicate notifications
  const removeDuplicates = (notifications) => {
    const uniqueNotifications = [];
    const seenNotifications = new Set();
    
    notifications.forEach((n) => {
      const key = `${n.type}-${n.source_user_id}-${n.post_id}`;
      if (!seenNotifications.has(key)) {
        uniqueNotifications.push(n);
        seenNotifications.add(key);
      }
    });

    return uniqueNotifications;
  };

  // Fetch notifications with pagination
  const fetchNotifications = useCallback(
    async (cursor, pageSize) => {
      if (!user) return { data: [], nextCursor: null };

      let query = supabase
        .from("notifications")
        .select(`*, source_profile:source_user_id (id, username, profile_picture_url, user_type), post:post_id (id, images(file_url), videos(thumbnail_url))`)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(pageSize);

      if (cursor) {
        query = query
          .lt('created_at', cursor.created_at)
          .or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Napaka pri pridobivanju obvestil:', error);
        return { data: [], nextCursor: null };
      }

      const uniqueData = removeDuplicates(data); // Remove duplicate notifications

      const last = uniqueData[uniqueData.length - 1];
      return {
        data: uniqueData,
        nextCursor: uniqueData.length === pageSize ? { id: last.id, created_at: last.created_at } : null,
      };
    },
    [supabase, user]
  );

  // Mark notifications as read when the overlay is closed
  const handleClose = async () => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (!error) {
        // no-op here; InfinityLoader state will persist
      }
    } catch (error) {
      console.error('Napaka pri označevanju kot prebrano:', error);
    }

    onClose();
  };

  // Clear all notifications
  const handleClearAll = async () => {
    if (!user) return;
    await supabase.from('notifications').delete().eq('user_id', user.id);
  };

  // Get media URL from notifications (post images or videos)
  const getMedia = (n) => n.post?.images?.[0]?.file_url || n.post?.videos?.[0]?.thumbnail_url;

  // Shorten username for mobile view
  const shortenUsername = (username) => (username.length > 8 ? `${username.slice(0, 15)}...` : username);

  // Render notification item
  const renderNotification = (n) => (
    <div key={`${n.id}-${n.created_at}`} className={`overlay-list-notify${!n.is_read ? ' unread' : ''}`}>
      <div className="notification-profile">
        <div className="avatar">
          <img src={n.source_profile?.profile_picture_url || '/default-avatar.png'} alt="avatar" />
        </div>
        <div className="left-nofity-info">
          <div className="username">
            <div className='username-m'>{n.source_profile?.username}</div>
            <div className='username-d'>{shortenUsername(n.source_profile?.username)}</div>
            <UserBadge userType={n.source_profile?.user_type} />
            <div className="time"><TimeAgo timestamp={n.created_at} /></div>
          </div>
          <div className="p-t-1">
            {n.type === 'follow' && <span>{n.source_profile?.username} vam je začel slediti</span>}
            {n.type === 'post' && <span>Objava je uspešno ustvarjena</span>}
            {n.type === 'story' && <span>Zgodba je uspešno ustvarjena</span>}
            {n.type === 'like' && <span>{n.source_profile?.username} je všečkal vašo objavo</span>}
            {n.type === 'comment' && <span>{n.source_profile?.username} je komentiral vašo objavo</span>}
            {n.type === 'comment_like' && <span>{n.source_profile?.username} je všečkal vaš komentar</span>}
          </div>
        </div>
      </div>
      {n.type === 'follow' ? (
        <FollowButton followingId={n.source_profile?.id} />
      ) : getMedia(n) && n.post?.id ? (
        <Link href={`/objava/${n.post.id}`} className="notify-massage-post">
          <img src={getMedia(n)} alt="media" />
        </Link>
      ) : null}
    </div>
  );

  if (!isOpen) return null;

  return (
    <div id="notificationsOverlay" className="overlay active">
      <button className="close-btn" onClick={handleClose}><i className="bi bi-x-lg"></i></button>
      <div className="overlay-content">
        <div className="overlay-content-notify">
          <div className="menu-title m-b-2">
            Obvestila
            <button className="btn-delete-not" onClick={handleClearAll}>Počisti vsa</button>
          </div>
          <div className='inner-not-bg'>
          <InfinityLoader
            fetchItems={fetchNotifications}
            renderItem={renderNotification}
            pageSize={10}
            emptyComponent={<p className="text-center p-t-2 p-b-2">Ni obvestil.</p>}
            endComponent={<p className="text-center p-t-2 p-b-2">Ni več obvestil za prikaz.</p>}
            className="p-t-2"
          />
          </div>
        </div>
      </div>
    </div>
  );
}