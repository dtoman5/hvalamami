// app/profil/[username]/[section]/page.js

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { redirect, notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import ClientProfile from '../ClientProfile';

const PAGE_SIZE = 10;
const VALID_SECTIONS = ['posts', 'stories', 'commented'];

export default async function ProfileSectionPage({ params, searchParams }) {
  const supabase = createServerComponentClient({ cookies, headers });
  const { username, section } = params;
  const page = parseInt(searchParams?.page || '1', 10);

  // Validate section
  if (!VALID_SECTIONS.includes(section)) {
    redirect(`/profil/${username}/posts`);
  }

  // Require auth
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/prijava');

  // Load profile by username
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, first_name, profile_picture_url, bio, website_url, user_type')
    .eq('username', username)
    .single();
  if (profileError || !profile) notFound();

  let initialItems = [];
  let initialCursor = null;

  if (section === 'posts') {
    // User's regular posts
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(*), categories(*), videos(*), images(*), comments(count), likes(count)')
      .eq('user_id', profile.id)
      .eq('is_story', false)
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    initialItems = data || [];
    initialCursor = initialItems.length === PAGE_SIZE ? page + 1 : null;

  } else if (section === 'stories') {
    // User's stories, hide expired for others
    const now = new Date().toISOString();
    let query = supabase
      .from('posts')
      .select('*, profiles(*), categories(*), videos(*), images(*), comments(count), likes(count)')
      .eq('user_id', profile.id)
      .eq('is_story', true);

    if (profile.id !== user.id) {
      query = query.gt('expires_at', now);
    }

    const { data } = await query
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    initialItems = data || [];
    initialCursor = initialItems.length === PAGE_SIZE ? page + 1 : null;

  } else if (section === 'commented') {
    // Posts this user commented on, excluding their own
    const { data: comments } = await supabase
      .from('comments')
      .select('post_id, created_at')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);

    const postIds = Array.from(
      new Set((comments || [])
        .map((c) => c.post_id))
    );

    if (postIds.length) {
      const { data: postsData } = await supabase
        .from('posts')
        .select('*, profiles(*), categories(*), videos(*), images(*), comments(count), likes(count)')
        .in('id', postIds)
        .neq('user_id', profile.id)             // <-- exclude own posts
        .order('created_at', { ascending: false });

      initialItems = postsData || [];
    }

    initialCursor = comments?.length === PAGE_SIZE ? page + 1 : null;
  }

  return (
    <div className="container-content">
      <div className="row p-t-5">
        <div className="profile-section">
          <ClientProfile
            serverUser={user}
            serverProfile={profile}
            initialSection={section}
            initialItems={initialItems}
            initialCursor={initialCursor}
          />
        </div>
      </div>
    </div>
  );
}