import { getServerSupabase } from '../../../lib/supabase/server';

export async function fetchPostsByComments({ userId, page = 1, limit = 10 }) {
  const supabase = getServerSupabase();

  // 1) poberi komentarje z offsetom
  const from = (page - 1) * limit;
  const to = page * limit - 1;
  const { data: comments, error: cErr } = await supabase
    .from('comments')
    .select('post_id, created_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);
  if (cErr) throw cErr;

  const postIds = Array.from(new Set((comments || []).map(c => c.post_id)));
  if (!postIds.length) {
    return {
      items: [],
      currentPage: page,
      totalPages: 0,
      nextCursor: null,
    };
  }

  // 2) fetch objave
  const { data: posts, error: pErr } = await supabase
    .from('posts')
    .select('*, profiles(*), categories(*), images(*), videos(*), comments(count), likes(count)')
    .in('id', postIds)
    .order('created_at', { ascending: false })
    .range(0, postIds.length - 1);

  if (pErr) throw pErr;

  const nextCursor = comments.length === limit ? comments[comments.length - 1].created_at : null;

  return {
    items: posts || [],
    currentPage: page,
    totalPages: Math.ceil(postIds.length / limit),
    nextCursor,
  };
}