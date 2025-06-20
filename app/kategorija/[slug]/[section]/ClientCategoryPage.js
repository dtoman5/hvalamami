// app/kategorija/[slug]/ClientCategoryPage.js
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '../../../components/Navbar';
import Sidebar from '../../../components/Sidebar';
import NavTabs from '../../../components/NavTabs';
import ScrollManager from '../../../components/Feed/ScrollManager';
import InfiniteList from '../../../components/Feed/InfiniteList';
import Post from '../../../components/Posts/Post';
import CategoryFollowButton from '../../../components/Categories/CategoryFollowButton';
import { createClient } from '../../../../lib/supabase/client';
import { useFeedStore } from '../../../store/feedStore';

const POSTS_KEY   = id => `category:${id}:posts`;
const STORIES_KEY = id => `category:${id}:stories`;
const PAGE_SIZE   = 10;

export default function ClientCategoryPage({
  serverCategory,
  serverUser,
  initialData,
  initialSection = 'posts',
  initialPosts = [],
  initialStories = [],
  categories = [],
}) {
  const supabase = createClient();
  const router   = useRouter();
  const slug     = serverCategory.slug;

  const [category]    = useState(serverCategory);
  const [userId]      = useState(serverUser.id);
  const [followerCount, setFollowerCount] = useState(initialData.followerCount);
  const [postCount,     setPostCount]     = useState(initialData.postCount);
  const [storyCount,   setStoryCount]     = useState(initialData.storyCount);
  const [isFollowing, setIsFollowing]     = useState(initialData.isFollowing);

  // which tab is active?
  const [activeTab, setActiveTab] = useState(initialSection);

  // zustand keys & actions
  const postsKey   = POSTS_KEY(category.id);
  const storiesKey = STORIES_KEY(category.id);

  const addPage      = useFeedStore(s => s.addPage);
  const resetSection = useFeedStore(s => s.resetSection);
  const removeLocal  = useFeedStore(s => s.removeItem);
  const updateLocal  = useFeedStore(s => s.upsertItem);
  const sections     = useFeedStore(s => s.sections);

  const feedPosts   = sections[postsKey]   || { pages: [], ids: [], nextCursor: 1 };
  const feedStories = sections[storiesKey] || { pages: [], ids: [], nextCursor: 1 };

  // 1) Hydrate SSR data only for the active tab
  useEffect(() => {
    if (activeTab === 'posts') {
      if (!feedPosts.pages.length && initialPosts.length) {
        addPage(postsKey, {
          posts:       initialPosts,
          currentPage: 1,
          totalPages:  initialPosts.length < PAGE_SIZE ? 1 : Infinity,
          nextCursor:  initialPosts.length === PAGE_SIZE ? 2 : null,
        });
      }
    } else {
      if (!feedStories.pages.length && initialStories.length) {
        addPage(storiesKey, {
          posts:       initialStories,
          currentPage: 1,
          totalPages:  initialStories.length < PAGE_SIZE ? 1 : Infinity,
          nextCursor:  initialStories.length === PAGE_SIZE ? 2 : null,
        });
      }
    }
  }, [
    activeTab,
    initialPosts,
    initialStories,
    feedPosts.pages.length,
    feedStories.pages.length,
    addPage,
    postsKey,
    storiesKey,
  ]);

  // 2) Fetchers
  const fetchMorePosts = useCallback(
    async (cursor = 1, pageSize = PAGE_SIZE) => {
      const from = (cursor - 1) * pageSize, to = from + pageSize - 1;
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(*), categories(*), videos(*), images(*), comments(count), likes(count)')
        .eq('category_id', category.id)
        .eq('is_story', false)
        .neq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) return { items: [], nextCursor: null };
      return {
        items:      data || [],
        nextCursor: data.length === pageSize ? cursor + 1 : null,
        currentPage: cursor,
        totalPages:  data.length === pageSize ? Infinity : cursor,
      };
    },
    [supabase, category.id, userId]
  );

  const fetchMoreStories = useCallback(
    async (cursor = 1, pageSize = PAGE_SIZE) => {
      const from = (cursor - 1) * pageSize, to = from + pageSize - 1;
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('posts')
        .select('*, profiles(*), categories(*), videos(*), images(*), comments(count), likes(count)')
        .eq('category_id', category.id)
        .eq('is_story', true)
        .gt('expires_at', now)
        .neq('user_id', userId)
        .order('created_at', { ascending: false })
        .range(from, to);
      if (error) return { items: [], nextCursor: null };
      return {
        items:      data || [],
        nextCursor: data.length === pageSize ? cursor + 1 : null,
        currentPage: cursor,
        totalPages:  data.length === pageSize ? Infinity : cursor,
      };
    },
    [supabase, category.id, userId]
  );

  // 3) Realtime updates
  useEffect(() => {
    const now = new Date().toISOString();
    const chan = supabase.channel(`realtime-cat-${category.id}`);
    chan
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'posts' }, ({ new: p }) => {
        if (p.category_id !== category.id || p.user_id === userId) return;
        if (p.is_story) {
          if (p.expires_at > now) updateLocal(storiesKey, p);
        } else {
          updateLocal(postsKey, p);
        }
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'posts' }, ({ new: p }) => {
        if (feedPosts.ids.includes(p.id))   updateLocal(postsKey,   p);
        if (feedStories.ids.includes(p.id)) updateLocal(storiesKey, p);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'posts' }, ({ old: p }) => {
        removeLocal(postsKey,   p.id);
        removeLocal(storiesKey, p.id);
      })
      .subscribe();
    return () => supabase.removeChannel(chan);
  }, [
    supabase,
    category.id,
    userId,
    postsKey,
    storiesKey,
    feedPosts.ids,
    feedStories.ids,
    removeLocal,
    updateLocal,
  ]);

  // render helper
  const renderItem = useCallback(
    (post) => (
      <Post
        key={post.id}
        post={post}
        onDelete={() => removeLocal(
          activeTab === 'posts' ? postsKey : storiesKey, post.id
        )}
        onEdit={(u) => updateLocal(
          activeTab === 'posts' ? postsKey : storiesKey, u
        )}
      />
    ),
    [activeTab, postsKey, storiesKey, removeLocal, updateLocal]
  );

  // tab change handler
  const onTabChange = (key) => {
    resetSection(key === 'posts' ? postsKey : storiesKey);
    setActiveTab(key);
    router.push(`/kategorija/${slug}/${key}`);
  };

  // filter out current category for sidebar
  const otherCats = categories.filter(c => c.id !== category.id);

  return (
    <>
      <Navbar />
      <Sidebar />

      <div className="container">
        <div className="container-content">

          {/* header */}
          <div className="row">
            <div className="dashboard-text m-b-5">
              <div className="text-center p-t-5">
                <h1>{category.name}</h1>
              </div>
              <div className="text-center p-t-1">
                <div className="profile-info">
                  <div className="profile-info-stat">
                    <span className="stat-number">{followerCount}</span>
                    <span>Sledilcev</span>
                  </div>
                  <div className="profile-info-stat">
                    <span className="stat-number">{postCount}</span>
                    <span>Objav</span>
                  </div>
                  <div className="profile-info-stat">
                    <span className="stat-number">{storyCount}</span>
                    <span>Zgodb</span>
                  </div>
                </div>
                <div className="m-t-2">
                  <CategoryFollowButton
                    categoryId={category.id}
                    initialIsFollowing={isFollowing}
                    onFollowChange={setIsFollowing}
                    center
                  />
                </div>
              </div>
            </div>
          </div>

          {/* other categories */}
          <div className="category-row">
            <div className="flex-content m-b-2">
              <div className="menu-title">Ostale kategorije</div>
            </div>
            <div className="flex-content-x">
              {otherCats.slice(0, 15).map(c => (
                <Link
                  key={c.id}
                  href={`/kategorija/${c.slug}/posts`}
                  className="category-item"
                  style={{ backgroundColor: c.hex_color }}
                >
                  <div className="category-img">
                    <img src={c.cat_img || '/default-avatar.png'} alt={c.name} />
                  </div>
                  <div className="category-content">{c.name}</div>
                </Link>
              ))}
            </div>
          </div>

          {/* tabs */}
          <NavTabs
            basePath={`/kategorija/${slug}`}
            tabs={[
              { key: 'posts',   label: 'Objave'  },
              { key: 'stories', label: 'Zgodbe' },
            ]}
            activeKey={activeTab}
            onChange={onTabChange}
          />

          {/* feed */}
          <div className="row">
            <ScrollManager sectionKey={activeTab === 'posts' ? postsKey : storiesKey}>
              <div className="posts-wrapper m-t-4">
                <InfiniteList
                  section={activeTab === 'posts' ? postsKey : storiesKey}
                  fetchItems={activeTab === 'posts' ? fetchMorePosts : fetchMoreStories}
                  renderItem={renderItem}
                  pageSize={PAGE_SIZE}
                  emptyComponent={
                    <p className="text-center p-b-10">
                      {activeTab === 'posts' ? 'Ni objav za prikaz.' : 'Ni zgodb za prikaz.'}
                    </p>
                  }
                  endComponent={
                    <p className="text-center p-b-10">
                      {activeTab === 'posts' ? 'Ni več objav.' : 'Ni več zgodb.'}
                    </p>
                  }
                  className="post-loader-wrapper"
                />
              </div>
            </ScrollManager>
          </div>
        </div>
      </div>
    </>
  );
}