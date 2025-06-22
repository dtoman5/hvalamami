import { NextResponse } from 'next/server';
import { getServerSupabase } from '../../../lib/supabase/server';

export async function GET(req) {
  const supabase = getServerSupabase();
  const { searchParams } = new URL(req.url);

  const section = searchParams.get('section') || 'followers';
  const cursor = parseInt(searchParams.get('cursor') || '1', 10);
  const limit = 10;
  const from = (cursor - 1) * limit;
  const to = from + limit - 1;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let query = supabase
    .from('posts')
    .select('*, profiles(*), categories(*), images(*), videos(*), comments(count), likes(count)')
    .order('created_at', { ascending: false })
    .range(from, to);

  if (section === 'stories') {
    query = query.eq('is_story', true).gt('expires_at', new Date().toISOString());
  } else if (section === 'categories') {
    const { data: cats } = await supabase
      .from('category_followers')
      .select('category_id')
      .eq('user_id', user.id);
    const ids = (cats || []).map((c) => c.category_id);
    query = query.in('category_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  } else {
    const { data: follows } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', user.id);
    const ids = (follows || []).map((f) => f.following_id);
    query = query
      .eq('is_story', false)
      .in('user_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000']);
  }

  const { data: posts, error } = await query;
  if (error) {
    console.error('Napaka pri pridobivanju objav:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const nextCursor = posts?.length === limit ? cursor + 1 : null;

  return NextResponse.json({
    posts: posts || [],
    currentPage: cursor,
    totalPages: nextCursor ? Infinity : cursor,
    nextCursor,
  });
}