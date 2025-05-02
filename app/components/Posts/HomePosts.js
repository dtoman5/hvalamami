'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import Post from './Post';
import { toast } from 'react-toastify';
import InfinityLoader from '../InfiniteList';
import SugestedUsers from '../User/SugestedUsers';

function HomePosts({ onDelete, onEdit }) {
  const [section, setSection] = useState('followers');
  const [user, setUser] = useState(null);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, [supabase]);

  const fetchPosts = useCallback(
    async (cursor, pageSize) => {
      if (!user) return { data: [], nextCursor: null };
      try {
        let query = supabase
          .from('posts')
          .select(`*, profiles(*), categories(*), videos(*), images(*), comments(*, profiles(*)), likes(count)`)
          .eq('is_story', section === 'stories')
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
          .limit(pageSize);

        if (section === 'followers' || section === 'stories') {
          const { data: follows, error: followErr } = await supabase
            .from('user_follows')
            .select('following_id')
            .eq('follower_id', user.id);
          if (followErr) throw followErr;
          const followedUserIds = follows.map(f => f.following_id).filter(id => id !== user.id);
          const queryUserIds = followedUserIds.length > 0 ? followedUserIds : ['00000000-0000-0000-0000-000000000000'];
          query = query.in('user_id', queryUserIds);

          if (section === 'stories') {
            query = query.gt('expires_at', new Date().toISOString());
          }
        } else if (section === 'categories') {
          const { data: followedCategories, error: catErr } = await supabase
            .from('category_followers')
            .select('category_id')
            .eq('user_id', user.id);
          if (catErr) throw catErr;
          const catIds = followedCategories.map(c => c.category_id);
          const queryCatIds = catIds.length > 0 ? catIds : ['00000000-0000-0000-0000-000000000000'];
          query = query.in('category_id', queryCatIds).neq('user_id', user.id);
        }

        if (cursor) {
          query = query
            .lt('created_at', cursor.created_at)
            .or(`created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
        }

        const { data, error } = await query;
        if (error) throw error;

        const last = data[data.length - 1];
        return {
          data,
          nextCursor: data.length === pageSize ? { id: last.id, created_at: last.created_at } : null
        };
      } catch (error) {
        console.error('Napaka pri nalaganju objav:', error);
        toast.error('Napaka pri nalaganju objav: ' + error.message);
        return { data: [], nextCursor: null };
      }
    },
    [section, user, supabase]
  );

  return (
    <div className='p-b-10'>
      <div className="navigation">
        <button className={section === 'followers' ? 'active' : ''} onClick={() => setSection('followers')}>
          Objave
        </button>
        <button className={section === 'stories' ? 'active' : ''} onClick={() => setSection('stories')}>
          Zgodbe
        </button>
        <button className={section === 'categories' ? 'active' : ''} onClick={() => setSection('categories')}>
          Kategorije
        </button>
      </div>

      <div className='m-t-3'>
      < SugestedUsers />
      </div>

      {user && (
        <InfinityLoader
        key={section}
        fetchItems={fetchPosts}
        renderItem={(post) => <Post key={post.id} post={post} onDelete={onDelete} onEdit={onEdit} />}
        pageSize={10}
        emptyComponent={
        <div className='no-posts text-center p-t-5'>
        <div className='sad-f-anim'>
          <i className="bi bi-emoji-frown"></i>
        </div>
          <p className="">Ni še objav za prikazati.</p>
        </div>
        }
        endComponent={<p className="text-center posts-complete p-t-2 p-b-2">Ni več objav za prikaz.</p>}
        className="post-loader-wrapper"
        />      
      )}
    </div>
  );
}

export default HomePosts;