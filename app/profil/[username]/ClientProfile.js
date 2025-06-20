// app/profil/[username]/ClientProfile.js
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '../../../lib/supabase/client';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import UserBadge from '../../components/User/UserBadge';
import FollowButton from '../../components/User/FollowButton';
import Post from '../../components/Posts/Post';
import InfiniteList from '../../components/Feed/InfiniteList';
import ScrollManager from '../../components/Feed/ScrollManager';
import { toast } from 'react-toastify';
import { useFeedStore } from '../../store/feedStore';
import NavTabs from '../../components/NavTabs';

export default function ClientProfile({
  serverUser,
  serverProfile,
  initialSection,
  initialItems,
  initialCursor,
}) {
  const supabase = createClient();
  const router = useRouter();
  const { username } = useParams();

  const [loggedUser] = useState(serverUser);
  const [profile] = useState(serverProfile);
  const [stats, setStats] = useState({
    followers: 0,
    following: 0,
    posts: 0,
    stories: 0,
    commented: 0,
  });
  const [section, setSection] = useState(initialSection || 'posts');

  const postsKey = `profile:${profile.id}:posts`;
  const storiesKey = `profile:${profile.id}:stories`;
  const commentedKey = `profile:${profile.id}:commented`;

  const addPage = useFeedStore((s) => s.addPage);
  const resetSection = useFeedStore((s) => s.resetSection);
  const removeItem = useFeedStore((s) => s.removeItem);
  const upsertItem = useFeedStore((s) => s.upsertItem);
  const sections = useFeedStore((s) => s.sections);

  const postsFeed = sections[postsKey] || { pages: [], nextCursor: 1 };
  const storiesFeed = sections[storiesKey] || { pages: [], nextCursor: 1 };
  const commentedFeed = sections[commentedKey] || { pages: [], nextCursor: 1 };

  // Fetch profile stats
  const fetchStats = useCallback(async () => {
    const { count: followersCount } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', profile.id);
    const { count: followingCount } = await supabase
      .from('user_follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', profile.id);
    const { count: postsCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_story', false);
    const { count: storiesCount } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .eq('is_story', true);
    const { data: commentRows } = await supabase
      .from('comments')
      .select('post_id')
      .eq('user_id', profile.id);
    const commentedCount = new Set((commentRows || []).map((c) => c.post_id)).size;

    setStats({
      followers: followersCount || 0,
      following: followingCount || 0,
      posts: postsCount || 0,
      stories: storiesCount || 0,
      commented: commentedCount,
    });
  }, [profile.id, supabase]);

  useEffect(() => {
    fetchStats();
    const subs = [];

    subs.push(
      supabase
        .channel(`user_follows:following_id=eq.${profile.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_follows', filter: `following_id=eq.${profile.id}` },
          fetchStats
        )
        .subscribe()
    );
    subs.push(
      supabase
        .channel(`user_follows:follower_id=eq.${profile.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'user_follows', filter: `follower_id=eq.${profile.id}` },
          fetchStats
        )
        .subscribe()
    );
    subs.push(
      supabase
        .channel(`posts_profile:${profile.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'posts', filter: `user_id=eq.${profile.id}` },
          fetchStats
        )
        .subscribe()
    );
    subs.push(
      supabase
        .channel(`comments_profile:${profile.id}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'comments', filter: `user_id=eq.${profile.id}` },
          fetchStats
        )
        .subscribe()
    );

    return () => subs.forEach((c) => supabase.removeChannel(c));
  }, [profile.id, supabase, fetchStats]);

  // Fetchers
  const fetchUserPosts = useCallback(
    async (cursor = 1, pageSize = 10) => {
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(*), categories(*), videos(*), images(*), comments(count), likes(count)')
        .eq('user_id', profile.id)
        .eq('is_story', false)
        .order('created_at', { ascending: false })
        .range((cursor - 1) * pageSize, cursor * pageSize - 1);
      if (error) {
        console.error(error);
        return { items: [], nextCursor: null };
      }
      return {
        items: data.map((p) => ({ ...p, thumbnail_preview: p.videos?.[0]?.thumbnail_url || p.images?.[0]?.file_url || null })),
        nextCursor: data.length === pageSize ? cursor + 1 : null,
        currentPage: cursor,
        totalPages: data.length === pageSize ? Infinity : cursor,
      };
    },
    [profile.id, supabase]
  );

  const fetchUserStories = useCallback(
    async (cursor = 1, pageSize = 10) => {
      let query = supabase
        .from('posts')
        .select('*, profiles(*), categories(*), videos(*), images(*), comments(count), likes(count)')
        .eq('user_id', profile.id)
        .eq('is_story', true);

      if (loggedUser.id !== profile.id) {
        query = query.gt('expires_at', new Date().toISOString());
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })
        .range((cursor - 1) * pageSize, cursor * pageSize - 1);
      if (error) {
        console.error(error);
        return { items: [], nextCursor: null };
      }
      return {
        items: data.map((p) => ({ ...p, thumbnail_preview: p.videos?.[0]?.thumbnail_url || p.images?.[0]?.file_url || null })),
        nextCursor: data.length === pageSize ? cursor + 1 : null,
        currentPage: cursor,
        totalPages: data.length === pageSize ? Infinity : cursor,
      };
    },
    [profile.id, supabase, loggedUser.id]
  );

  const fetchCommentedPosts = useCallback(
    async (cursor = 1, pageSize = 10) => {
      const { data: commentRows, error: commentError } = await supabase
        .from('comments')
        .select('post_id, created_at')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false })
        .range((cursor - 1) * pageSize, cursor * pageSize - 1);
      if (commentError) {
        console.error(commentError);
        return { items: [], nextCursor: null };
      }
      const seen = new Set();
      const ids = [];
      commentRows.forEach((c) => {
        if (!seen.has(c.post_id) && c.post_id !== profile.id) {
          seen.add(c.post_id);
          ids.push(c.post_id);
        }
      });
      if (!ids.length) return { items: [], nextCursor: null };
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*, profiles(*), categories(*), videos(*), images(*), comments(count), likes(count)')
        .in('id', ids)
        .order('created_at', { ascending: false });
      if (postsError) {
        console.error(postsError);
        return { items: [], nextCursor: null };
      }
      return {
        items: postsData.filter((p) => p.user_id !== profile.id).map((p) => ({
          ...p,
          thumbnail_preview: p.videos?.[0]?.thumbnail_url || p.images?.[0]?.file_url || null
        })),
        nextCursor: ids.length === pageSize ? cursor + 1 : null,
        currentPage: cursor,
        totalPages: ids.length === pageSize ? Infinity : cursor,
      };
    },
    [profile.id, supabase]
  );

  // SSR-seed only the active section on mount or section change
  useEffect(() => {
    const key = section === 'posts'
      ? postsKey
      : section === 'stories'
        ? storiesKey
        : commentedKey;
    const feedState = sections[key] || { pages: [], nextCursor: 1 };
    if (!feedState.pages.length) {
      addPage(key, {
        posts: initialItems,
        currentPage: 1,
        totalPages: initialCursor ? Infinity : 1,
        nextCursor: initialCursor,
      });
    }
  }, [section, initialItems, initialCursor]);

  // Real-time subscriptions for profile posts & stories & comments…
  // (keep as-is, using updateLocal/removeLocal)

  const handleDelete = async (postId) => {
    [postsKey, storiesKey, commentedKey].forEach((key) => removeItem(key, postId));
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
      toast.error('Napaka pri brisanju');
    } else {
      toast.success('Objava izbrisana');
      fetchStats();
    }
  };

  const handleEdit = (updated) => {
    // update in-place or move between sections
    updateLocal(postsKey, updated);
    updateLocal(storiesKey, updated);
  };

  const changeSection = (newSection) => {
    if (newSection === section) return;
    setSection(newSection);
    router.push(`/profil/${profile.username}/${newSection}`, { scroll: false });
  };

  return (
    <>
      <Navbar />
        <div className="profile-content text-center m-b-5">
          <div className="profile-avatar position-center">
            <img
              src={profile.profile_picture_url}
              alt="Profile Picture"
              className="profile-avatar-img"
            />
            </div>
              <div className="profile-username m-t-2 m-b-2">
                {profile.username}
                <span className="p-l-1">
                  <UserBadge userType={profile.user_type} />
                </span>
              </div>
              <div className="profile-info">
                <div className="profile-info-stat">
                  <span className="stat-number">{stats.followers}</span>
                  <span>Sledilcev</span>
                </div>
                <div className="profile-info-stat">
                  <span className="stat-number">{stats.following}</span>
                  <span>Sledi</span>
                </div>
                <div className="profile-info-stat">
                  <span className="stat-number">{stats.posts}</span>
                  <span>Objav</span>
                </div>
              </div>
                <div className="profile-description m-t-2 m-b-3">
                  {profile.bio}
                </div>
                {profile.website_url && (
                  <a
                    href={profile.website_url}
                    className="profile-links"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <span>{profile.website_url}</span>{' '}
                    <i className="bi bi-arrow-up-right"></i>
                  </a>
                )}
                <div className="m-t-2">
                  {loggedUser.id === profile.id ? (
                    <Link href="/uredi-profil" className="btn-1">
                      Uredi profil
                    </Link>
                  ) : (
                    <FollowButton
                      followingId={profile.id}
                      onFollowChange={fetchStats}
                      center={true}
                    />
                  )}
                </div>
              </div>

              <NavTabs
                basePath={`/profil/${profile.username}`}
                tabs={[
                { key: 'posts',    label: 'Objave' },
                { key: 'stories',  label: 'Zgodbe' },
                { key: 'commented', label: 'Komentiral' },
                ]}
              />

              {section === 'posts' && (
                <ScrollManager sectionKey={postsKey}>
                  <InfiniteList
                    section={postsKey}
                    fetchItems={fetchUserPosts}
                    renderItem={(post) => (
                      <Post
                        key={post.id}
                        post={post}
                        onDelete={() => handleDelete(post.id)}
                        onEdit={handleEdit}
                      />
                    )}
                    pageSize={10}
                    emptyComponent={<p className="text-center p-t-5 p-b-10">Ni objav za prikaz.</p>}
                    endComponent={<p className="text-center p-t-5 p-b-10">Ni več objav za prikaz.</p>}
                    className="post-loader-wrapper"
                  />
                </ScrollManager>
              )}
              {section === 'stories' && (
                <ScrollManager sectionKey={storiesKey}>
                  <InfiniteList
                    section={storiesKey}
                    fetchItems={fetchUserStories}
                    renderItem={(post) => (
                      <Post
                        key={post.id}
                        post={post}
                        onDelete={() => handleDelete(post.id)}
                        onEdit={handleEdit}
                      />
                    )}
                    pageSize={10}
                    emptyComponent={<p className="text-center p-t-5 p-b-10">Ni zgodb za prikaz.</p>}
                    endComponent={<p className="text-center p-t-5 p-b-10">Ni več zgodb za prikaz.</p>}
                    className="post-loader-wrapper"
                  />
                </ScrollManager>
              )}
              {section === 'commented' && (
                <ScrollManager sectionKey={commentedKey}>
                  <InfiniteList
                    section={commentedKey}
                    fetchItems={fetchCommentedPosts}
                    renderItem={(post) => (
                      <Post
                        key={post.id}
                        post={post}
                        onDelete={() => handleDelete(post.id)}
                        onEdit={handleEdit}
                      />
                    )}
                    pageSize={10}
                    emptyComponent={<p className="text-center p-t-5 p-b-10">Ni objav za prikaz.</p>}
                    endComponent={<p className="text-center p-t-5 p-b-10">Ni več objav za prikaz.</p>}
                    className="post-loader-wrapper"
                  />
                </ScrollManager>
              )}
            
      <Sidebar />
    </>
  );
}