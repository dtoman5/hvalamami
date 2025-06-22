import { getServerSupabase } from '../../../lib/supabase/server';

export async function fetchPostsByUser({ userId, page = 1, limit = 10 }) {
  const supabase = getServerSupabase();

  // count
  const { count: totalCount } = await supabase
    .from('posts')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);
  const totalPages = Math.ceil((totalCount || 0) / limit);

  // data
  const from = (page - 1) * limit;
  const to = page * limit - 1;
  const { data: posts, error } = await supabase
    .from('posts')
    .select('*, profiles(*), categories(*), images(*), videos(*), comments(count), likes(count)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;
  const nextCursor = posts.length === limit ? posts[posts.length - 1].created_at : null;

  return {
    items: posts || [],
    currentPage: page,
    totalPages,
    nextCursor,
  };
}