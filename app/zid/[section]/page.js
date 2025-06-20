// app/zid/[section]/page.js
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import SectionClient from '../../components/Feed/SectionClient';

const PAGE_SIZE = 10;
const VALID_SECTIONS = ['followers', 'stories', 'categories'];

export default async function SectionPage({ params, searchParams }) {
  const supabase = createServerComponentClient({ cookies, headers });
  const { section } = params;
  const page = parseInt(searchParams?.page || '1', 10);

  // 1) Validate section
  if (!VALID_SECTIONS.includes(section)) {
    redirect('/zid/followers');
  }

  // 2) Require login
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/prijava');
  }

  const now = new Date().toISOString();
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let data = [];
  let error = null;

  if (section === 'followers') {
    // • only non-story posts
    // • from users you follow
    // • never your own
    const { data: follows = [] } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followedUserIds = follows.map((f) => f.following_id) || [];

    ({ data, error } = await supabase
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
      .neq('user_id', user.id)
      .eq('is_story', false)
      .in(
        'user_id',
        followedUserIds.length
          ? followedUserIds
          : ['00000000-0000-0000-0000-000000000000']
      )
      .order('created_at', { ascending: false })
      .range(from, to));
  } else if (section === 'stories') {
    // • only live stories (expires_at > now)
    // • from users you follow
    // • never your own
    const { data: follows = [] } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followedUserIds = follows.map((f) => f.following_id) || [];

    ({ data, error } = await supabase
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
      .neq('user_id', user.id)
      .eq('is_story', true)
      .gt('expires_at', now)
      .in(
        'user_id',
        followedUserIds.length
          ? followedUserIds
          : ['00000000-0000-0000-0000-000000000000']
      )
      .order('created_at', { ascending: false })
      .range(from, to));
  } else {
    // categories
    // • any non-story post in your followed categories
    // • any live story in your followed categories
    // • never your own
    const { data: cats = [] } = await supabase
      .from('category_followers')
      .select('category_id')
      .eq('user_id', user.id);

    const categoryIds = cats.map((c) => c.category_id) || [];

    ({ data, error } = await supabase
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
      .neq('user_id', user.id)
      .in(
        'category_id',
        categoryIds.length
          ? categoryIds
          : ['00000000-0000-0000-0000-000000000000']
      )
      // we can’t AND non-story vs story+expires in Supabase easily,
      // so we fetch both and filter client-side:
      .order('created_at', { ascending: false })
      .range(from, to));

    // keep only:
    //  • posts where is_story=false
    //  • OR stories where expires_at > now
    data = (data || []).filter(
      (p) => p.is_story === false || p.expires_at > now
    );
  }

  if (error) {
    console.error('Napaka pri pridobivanju objav:', error.message);
    return (
      <div className="text-center p-6">
        Napaka pri nalaganju objav.
      </div>
    );
  }

  return (
    <SectionClient
      section={section}
      initialPosts={data || []}
      initialPage={page}
    />
  );
}