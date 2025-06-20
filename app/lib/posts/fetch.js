import { createClient } from '../../../lib/supabase/server'

export async function fetchFeed({ section, userId, page = 1, limit = 10 }) {
  const supabase = createClient();

  // 1) zberi filter glede na sekcijo
  let filterQuery = supabase
    .from('posts')
    .select(
      '*, profiles(*), categories(*), images(*), videos(*), comments(count), likes(count)'
    )
    .order('created_at', { ascending: false });

  if (section === 'stories') {
    filterQuery = filterQuery
      .eq('is_story', true)
      .gt('expires_at', new Date().toISOString());
  } else if (section === 'categories') {
    const { data: cats } = await supabase
      .from('category_followers')
      .select('category_id')
      .eq('user_id', userId);
    const ids = (cats || []).map((c) => c.category_id);
    filterQuery = filterQuery.in(
      'category_id',
      ids.length ? ids : ['00000000-0000-0000-0000-000000000000']
    );
  } else {
    const { data: follows } = await supabase
      .from('user_follows')
      .select('following_id')
      .eq('follower_id', userId);
    const ids = (follows || []).map((f) => f.following_id);
    filterQuery = filterQuery
      .eq('is_story', false)
      .in(
        'user_id',
        ids.length ? ids : ['00000000-0000-0000-0000-000000000000']
      );
  }

  // 2) count
  const { count: totalCount } = await filterQuery
    .clone()
    .select('*', { count: 'exact', head: true });
  const totalPages = Math.ceil((totalCount || 0) / limit);

  // 3) naloži stran
  const from = (page - 1) * limit;
  const to = page * limit - 1;
  const { data: posts, error } = await filterQuery.range(from, to);
  if (error) throw error;

  // 4) določi cursor (timestamp zadnjega elementa) ali null
  const nextCursor =
    posts.length === limit ? posts[posts.length - 1].created_at : null;

  return {
    items: posts || [],
    currentPage: page,
    totalPages,
    nextCursor,
  };
}