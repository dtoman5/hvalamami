// app/kategorija/[slug]/[section]/page.js

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { redirect, notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import ClientCategoryPage from './ClientCategoryPage';

const PAGE_SIZE = 10;
const VALID_SECTIONS = ['posts', 'stories'];

export default async function CategorySectionPage({ params, searchParams }) {
  const { slug, section } = params;
  const page = parseInt(searchParams?.page || '1', 10);

  // 1) Validate section
  if (!VALID_SECTIONS.includes(section)) {
    return redirect(`/kategorija/${slug}/posts`);
  }

  // 2) Require login
  const supabase = createServerComponentClient({ cookies, headers });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return redirect('/prijava');
  }

  // 3) Load category by slug
  const { data: category, error: catErr } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();
  if (catErr || !category) {
    return notFound();
  }

  // 4) Fetch all categories for sidebar
  const { data: allCategories = [] } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  const now = new Date().toISOString();

  // 5) Initial counts & follow status
  const fetchInitialData = async () => {
    const { count: followerCount = 0 } = await supabase
      .from('category_followers')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', category.id);

    const { count: postCount = 0 } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', category.id)
      .eq('is_story', false)
      .neq('user_id', user.id);

    const { count: storyCount = 0 } = await supabase
      .from('posts')
      .select('*', { count: 'exact', head: true })
      .eq('category_id', category.id)
      .eq('is_story', true)
      .gt('expires_at', now)
      .neq('user_id', user.id);

    const { data: followStatus } = await supabase
      .from('category_followers')
      .select('*')
      .eq('user_id', user.id)
      .eq('category_id', category.id)
      .maybeSingle();

    return {
      followerCount,
      postCount,
      storyCount,
      isFollowing: Boolean(followStatus),
    };
  };

  // 6) Initial posts (non-story)
  const fetchInitialPosts = async () => {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(*), categories(*), videos(*), images(*)')
      .eq('category_id', category.id)
      .eq('is_story', false)
      .neq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    return (
      data?.map((p) => ({
        ...p,
        thumbnail_preview:
          p.videos?.[0]?.thumbnail_url || p.images?.[0]?.file_url || null,
      })) || []
    );
  };

  // 7) Initial stories (live only)
  const fetchInitialStories = async () => {
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(*), categories(*), videos(*), images(*)')
      .eq('category_id', category.id)
      .eq('is_story', true)
      .gt('expires_at', now)
      .neq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    return (
      data?.map((s) => ({
        ...s,
        thumbnail_preview:
          s.videos?.[0]?.thumbnail_url || s.images?.[0]?.file_url || null,
      })) || []
    );
  };

  // 8) Run both in parallel
  const [initialData, initialPosts, initialStories] = await Promise.all([
    fetchInitialData(),
    fetchInitialPosts(),
    fetchInitialStories(),
  ]);

  // 9) Render the client‐side component
  return (
    <ClientCategoryPage
      serverCategory={category}
      serverUser={user}
      categories={allCategories}
      initialData={initialData}
      initialPosts={initialPosts}
      initialStories={initialStories}
      initialSection={section}
      initialPage={page}
    />
  );
}