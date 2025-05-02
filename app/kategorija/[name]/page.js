'use client';
import React, { useEffect, useState, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useParams, useRouter } from 'next/navigation';
import Post from '@/app/components/Posts/Post';
import { toast } from 'react-toastify';
import InfinityLoader from '@/app/components/InfiniteList';
import Navbar from '@/app/components/Navbar';
import Sidebar from '@/app/components/Sidebar';
import CategoryFollowButton from '@/app/components/Categories/CategoryFollowButton';

function CategoryPage() {
  const { name: categoryName } = useParams();
  const router = useRouter();
  const decodedCategoryName = decodeURIComponent(categoryName);
  const [category, setCategory] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followerCount, setFollowerCount] = useState(0);
  const [postCount, setPostCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    let followersSubscription;
    let postsSubscription;

    const fetchInitialData = async () => {
      if (!decodedCategoryName) return;
      setLoading(true);

      // Pridobi uporabnika
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        toast.error('Napaka pri pridobivanju uporabnika');
        setLoading(false);
        return;
      }
      setUser(user?.id);

      // Pridobi kategorijo
      const { data: categoryData, error: categoryError } = await supabase
        .from('categories')
        .select('*')
        .eq('name', decodedCategoryName)
        .single();

      if (categoryError || !categoryData) {
        toast.error('Kategorija ni bila najdena');
        setLoading(false);
        return;
      }
      setCategory(categoryData);

      // Inicialni podatki
      await updateFollowerData(categoryData.id, user?.id);
      await updatePostCount(categoryData.id);

      // Nastavi realtime subscription za spremembe sledilcev
      followersSubscription = supabase
        .channel(`category_followers:category_id=eq.${categoryData.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'category_followers',
            filter: `category_id=eq.${categoryData.id}`
          },
          () => updateFollowerData(categoryData.id, user?.id)
        )
        .subscribe();

      // Nastavi realtime subscription za spremembe objav
      postsSubscription = supabase
        .channel(`posts:category_id=eq.${categoryData.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'posts',
            filter: `category_id=eq.${categoryData.id}`
          },
          () => updatePostCount(categoryData.id)
        )
        .subscribe();

      setLoading(false);
    };

    const updateFollowerData = async (categoryId, userId) => {
      // Število sledilcev
      const { count } = await supabase
        .from('category_followers')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId);
      setFollowerCount(count || 0);

      // Ali uporabnik sledi kategoriji
      if (userId) {
        const { data } = await supabase
          .from('category_followers')
          .select('*')
          .eq('user_id', userId)
          .eq('category_id', categoryId)
          .single();
        setIsFollowing(!!data);
      }
    };

    const updatePostCount = async (categoryId) => {
      const { count } = await supabase
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('category_id', categoryId)
        .eq('is_story', false);
      setPostCount(count || 0);
    };

    fetchInitialData();

    return () => {
      if (followersSubscription) supabase.removeChannel(followersSubscription);
      if (postsSubscription) supabase.removeChannel(postsSubscription);
    };
  }, [decodedCategoryName, supabase]);

  const fetchCategoryPosts = useCallback(
    async (cursor, pageSize) => {
      if (!category?.id || !user) return { data: [], nextCursor: null };

      let query = supabase
        .from('posts')
        .select('*, profiles(*), categories(*), videos(*), images(*)')
        .eq('category_id', category.id)
        .eq('is_story', false)
        .neq('user_id', user)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .limit(pageSize);

      if (cursor) {
        query = query.or(`and(created_at.lt.${cursor.created_at}),and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`);
      }

      const { data, error } = await query;

      if (error) {
        toast.error('Napaka pri pridobivanju objav: ' + error.message);
        return { data: [], nextCursor: null };
      }

      const mapped = data.map(post => {
        if (post.videos?.[0]?.thumbnail_url) {
          post.thumbnail_preview = post.videos[0].thumbnail_url;
        } else if (post.images?.[0]?.file_url) {
          post.thumbnail_preview = post.images[0].file_url;
        }
        return post;
      });

      const last = mapped[mapped.length - 1];
      return {
        data: mapped,
        nextCursor: mapped.length === pageSize ? { id: last.id, created_at: last.created_at } : null
      };
    },
    [category?.id, user, supabase]
  );

  if (loading) return <div>Nalaganje...</div>;
  if (!category) return <div>Kategorija ni bila najdena.</div>;

  return (
    <>
      <Navbar />
      <Sidebar />
      <div className="container">
        <div className="container-content">
          <div className="row">
            <div className="dashboard-text m-b-5">
              <div className="p-t-5 p-b-5">
                <div className="text-center">
                  <h1>{category.name}</h1>
                </div>
                <div className="p-t-1 text-center">
                  <div className="profile-info">
                    <div className="profile-info-stat">
                      <span className="stat-number">{followerCount}</span>
                      <span>Sledilcev</span>
                    </div>
                    <div className="profile-info-stat">
                      <span className="stat-number">{postCount}</span>
                      <span>Objav</span>
                    </div>
                  </div>
                  <div className="m-t-2">
                    <CategoryFollowButton 
                      categoryId={category.id} 
                      initialIsFollowing={isFollowing}
                      onFollowChange={setIsFollowing}
                      center={true}
                    />
                  </div>
                </div>
              </div>
            </div>

            {user && category?.id && (
              <div className="posts-wrapper m-t-4">
                <InfinityLoader
                  fetchItems={fetchCategoryPosts}
                  renderItem={(post) => <Post key={post.id} post={post} />}
                  pageSize={10}
                  emptyComponent={<p className="text-center p-b-10">Ni objav za prikaz.</p>}
                  endComponent={<p className="text-center p-b-10">Ni več objav za prikaz.</p>}
                  className="post-loader-wrapper"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="position-b-c-w">
        <div className="position-b-c">
          <button className="btn-1" onClick={() => router.push('/zid')}>
            <i className="bi bi-arrow-left p-r-1"></i> Domov
          </button>
        </div>
      </div>
    </>
  );
}

export default CategoryPage;