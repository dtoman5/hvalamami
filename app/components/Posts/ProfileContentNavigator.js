+"use client";
import React, { useEffect, useState, useCallback } from 'react';
import Post from './Post';
import InfinityLoader from '../InfiniteList';

function ProfileContentNavigator({ userId, isCurrentUser, onDelete, onEdit, onRate }) {
  const [section, setSection] = useState('posts');
  const [user, setUser] = useState(null);
  const [initialData, setInitialData] = useState([]);
  const [hasFetchedInitial, setHasFetchedInitial] = useState(false);
  const supabase = createClientComponentClient();
  const pageSize = 5;

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, [supabase]);

  // =============================
  // Fetch funkcije po straneh
  // =============================

  const fetchUserPostsPage = useCallback(async (page) => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('posts')
      .select(`
        *,
        profiles(*),
        categories(*),
        media(*),
        comments(*, profiles(*), comment_likes(count)),
        likes(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      console.error('Napaka pri nalaganju objav:', error);
      return [];
    }

    return data || [];
  }, [supabase, userId]);

  const fetchCommentedPostsPage = useCallback(async (page) => {
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const { data: commentsData, error: commentsError } = await supabase
      .from('comments')
      .select('post_id')
      .eq('user_id', userId);

    if (commentsError || !commentsData || commentsData.length === 0) {
      return [];
    }

    const postIds = commentsData.map(c => c.post_id);

    const { data: postsData, error: postsError } = await supabase
      .from('posts')
      .select(`
        *,
        profiles(*),
        categories(*),
        media(*),
        comments(*, profiles(*), comment_likes(count)),
        likes(count)
      `)
      .in('id', postIds)
      .neq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (postsError) {
      console.error('Napaka pri nalaganju komentiranih objav:', postsError);
      return [];
    }

    return postsData || [];
  }, [supabase, userId]);

  // =============================
  // Fetch initialData
  // =============================
  useEffect(() => {
    const loadInitial = async () => {
      setHasFetchedInitial(false);
      const firstPage = section === 'posts'
        ? await fetchUserPostsPage(1)
        : await fetchCommentedPostsPage(1);

      setInitialData(firstPage);
      setHasFetchedInitial(true);
    };

    if (user) {
      loadInitial();
    }
  }, [user, section, fetchUserPostsPage, fetchCommentedPostsPage]);

  return (
    <div>
      <div className="navigation">
        <button
          className={section === 'posts' ? 'active' : ''}
          onClick={() => setSection('posts')}
        >
          Objave
        </button>
        <button
          className={section === 'comments' ? 'active' : ''}
          onClick={() => setSection('comments')}
        >
          Komentirane objave
        </button>
      </div>

      {!hasFetchedInitial ? (
        <p>Nalaganje...</p>
      ) : (
        <InfinityLoader
          fetchData={section === 'posts' ? fetchUserPostsPage : fetchCommentedPostsPage}
          renderItem={(post) => (
            <Post
              key={post.id}
              post={post}
              currentUserId={user.id}
              onDelete={isCurrentUser && post.user_id === userId ? onDelete : null}
              onEdit={isCurrentUser && post.user_id === userId ? onEdit : null}
              onRate={onRate}
              highlightCommentsBy={section === 'comments' ? userId : null}
            />
          )}
          initialData={initialData}
          pageSize={pageSize}
          manualLoadPage={1}
          loadingComponent={<div className="spinner">Nalaganje...</div>}
          emptyComponent={
            <p>
              {section === 'posts'
                ? (isCurrentUser
                  ? "Nimate še nobenih objav."
                  : "Uporabnik še ni objavil nobene vsebine.")
                : (isCurrentUser
                  ? "Niste še komentirali nobene objave."
                  : "Uporabnik še ni komentiral nobene objave.")}
            </p>
          }
          endComponent={<p className="end-message">Ni več objav za prikaz</p>}
        />
      )}
    </div>
  );
}

export default ProfileContentNavigator;