// app/components/Feed/SectionClient.js
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { createClient } from '../../../lib/supabase/client';
import InfiniteList from './InfiniteList';
import Post from '../Posts/Post';
import ScrollManager from './ScrollManager';
import { useFeedStore } from '../../store/feedStore';

const PAGE_SIZE = 10;

export default function SectionClient({
  section,
  initialPosts = [],
  initialPage = 1,
}) {
  const supabase      = createClient();
  const router        = useRouter();
  const pathname      = usePathname();
  const searchParams  = useSearchParams();
  const sectionKey    = `feed:${section}`;

  // Supabase user
  const [currentUserId, setCurrentUserId] = useState(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setCurrentUserId(user.id);
    });
  }, [supabase]);

  // Zustand actions
  const addPage       = useFeedStore((s) => s.addPage);
  const resetSection  = useFeedStore((s) => s.resetSection);
  const removeItem    = useFeedStore((s) => s.removeItem);
  const upsertItem    = useFeedStore((s) => s.upsertItem);
  const sections      = useFeedStore((s) => s.sections);
  const feed          = sections[sectionKey] || { pages: [], ids: [] };

  // 1️⃣ Hydrate SSR data on first mount or when initialPosts change
  useEffect(() => {
    // Wait until we know user (so that if server-side forgot to filter own, we drop it)
    if (currentUserId === null) return;

    // 1a) clear out old pages
    resetSection(sectionKey);

    // 1b) apply the same expiration rule client-side
    const now = new Date().toISOString();
    const filtered = initialPosts.filter((p) => {
      // never include expired stories
      if (p.is_story && p.expires_at <= now) return false;
      // never include your own posts (defensive)
      if (p.user_id === currentUserId) return false;
      return true;
    });

    // 1c) hydrate page 1
    addPage(sectionKey, {
      posts: filtered,
      currentPage: initialPage,
      totalPages: filtered.length < PAGE_SIZE ? initialPage : Infinity,
      nextCursor: filtered.length === PAGE_SIZE ? initialPage + 1 : null,
    });
  }, [
    sectionKey,
    initialPosts,
    initialPage,
    currentUserId,
    resetSection,
    addPage,
  ]);

  // 2️⃣ Clean up ?page param after SSR
  useEffect(() => {
    if (initialPage > 1) {
      const params = new URLSearchParams(searchParams);
      params.delete('page');
      router.replace(`${pathname}?${params.toString()}`);
    }
  }, [initialPage, router, pathname, searchParams]);

  // 3️⃣ Listen for "force-fetch" to drop and re-fetch
  useEffect(() => {
    const handler = (e) => {
      if (e.detail === sectionKey) {
        resetSection(sectionKey);
      }
    };
    document.addEventListener('force-fetch', handler);
    return () => document.removeEventListener('force-fetch', handler);
  }, [sectionKey, resetSection]);

  // 4️⃣ The fetcher for InfiniteList
  const fetchItems = useCallback(
    async (cursor = 1, limit = PAGE_SIZE) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { items: [], nextCursor: null };

      let query = supabase
        .from('posts')
        .select(`
          *, 
          profiles(*), 
          categories(*), 
          images(*), 
          videos(*), 
          comments(count), 
          likes(count)
        `)
        .order('created_at', { ascending: false })
        .range((cursor - 1) * limit, cursor * limit - 1)
        // always drop your own
        .neq('user_id', user.id);

      const now = new Date().toISOString();

      if (section === 'stories') {
        query = query.eq('is_story', true).gt('expires_at', now);
      } else if (section === 'categories') {
        // posts and live stories in followed categories
        const { data: cats = [] } = await supabase
          .from('category_followers')
          .select('category_id')
          .eq('user_id', user.id);
        const ids = cats.map((c) => c.category_id);
        query = query
          .in('category_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
          // let server return both story+post; we'll filter expired story client-side again
          .in('is_story', [false, true]);
      } else {
        // followers feed: only non-stories, people you follow
        const { data: follows = [] } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', user.id);
        const ids = follows.map((f) => f.following_id);
        query = query.eq('is_story', false)
                     .in('user_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
      }

      const { data: posts } = await query;
      // client‐side: drop expired from categories section too
      const visible = posts.filter((p) => !(p.is_story && p.expires_at <= now));
      const nextCursor = visible.length === limit ? cursor + 1 : null;
      return {
        items: visible,
        nextCursor,
        currentPage: cursor,
        totalPages: nextCursor ? Infinity : cursor,
      };
    },
    [supabase, section]
  );

  // 5️⃣ Real-time subscribe
  useEffect(() => {
    if (currentUserId === null) return;
    const chan = supabase.channel('realtime-posts');
    chan
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        ({ new: np }) => {
          // drop your own
          if (np.user_id === currentUserId) return;
          // drop expired (just in case)
          if (np.is_story && np.expires_at <= new Date().toISOString()) return;
          // if this section cares about stories/posts, skip mismatches:
          if (section === 'stories' && !np.is_story) return;
          if (section === 'followers' && np.is_story) return;
          if (section === 'categories') {
            // must be in one of your cats
            supabase
              .from('category_followers')
              .select('1', { count: 'exact', head: true })
              .eq('user_id', currentUserId)
              .eq('category_id', np.category_id)
              .then(({ count }) => {
                if (count > 0) upsertItem(sectionKey, np);
              });
            return;
          }
          upsertItem(sectionKey, np);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'posts' },
        ({ new: np }) => {
          if (feed.ids.includes(np.id)) {
            upsertItem(sectionKey, np);
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'posts' },
        ({ old }) => {
          if (feed.ids.includes(old.id)) {
            removeItem(sectionKey, old.id);
          }
        }
      )
      .subscribe();

    return () => supabase.removeChannel(chan);
  }, [
    supabase,
    section,
    sectionKey,
    upsertItem,
    removeItem,
    feed.ids,
    currentUserId,
  ]);

  const renderItem = useCallback(
    (post) => (
      <Post
        key={post.id}
        post={post}
        onDelete={() => removeItem(sectionKey, post.id)}
        onEdit={(updated) => upsertItem(sectionKey, updated)}
      />
    ),
    [removeItem, upsertItem, sectionKey]
  );

  return (
    <ScrollManager sectionKey={sectionKey}>
      <div className="infinite-section-wrapper">
        <InfiniteList
          section={sectionKey}
          fetchItems={fetchItems}
          renderItem={renderItem}
          pageSize={PAGE_SIZE}
        />
      </div>
    </ScrollManager>
  );
}