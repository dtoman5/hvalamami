'use client';
import React, { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import UserBadge from "@/components/User/UserBadge";
import FollowButton from "@/components/User/FollowButton";
import Post from "@/components/Posts/Post";
import { toast } from "react-toastify";
import InfinityLoader from "@/components/InfiniteList";

export default function Profile({ params: paramsPromise }) {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ followers: 0, following: 0, posts: 0 });
  const [section, setSection] = useState("posts");

  const params = React.use(paramsPromise);
  const { username } = params;

  useEffect(() => {
    let followersSubscription;
    let postsSubscription;

    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return router.push("/prijava");
        setUser(user);

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("username, first_name, last_name, profile_picture_url, bio, website_url, user_type, id")
          .eq("username", username)
          .single();

        if (profileError || !profileData) return notFound();

        setProfile(profileData);
        await fetchUserStats(profileData.id);

        // Realtime subscription za spremembe sledilcev
        followersSubscription = supabase
          .channel(`user_follows:following_id=eq.${profileData.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'user_follows',
              filter: `following_id=eq.${profileData.id}`
            },
            () => fetchUserStats(profileData.id)
          )
          .subscribe();

        // Realtime subscription za spremembe objav
        postsSubscription = supabase
          .channel(`posts:user_id=eq.${profileData.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'posts',
              filter: `user_id=eq.${profileData.id}`
            },
            () => fetchUserStats(profileData.id)
          )
          .subscribe();

      } catch (error) {
        console.error("Error:", error);
        notFound();
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) setUser(session.user);
      else {
        setUser(null);
        router.push("/prijava");
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
      if (followersSubscription) supabase.removeChannel(followersSubscription);
      if (postsSubscription) supabase.removeChannel(postsSubscription);
    };
  }, [router, username, supabase]);

  const fetchUserStats = async (userId) => {
    try {
      const { count: followersCount } = await supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("following_id", userId);

      const { count: followingCount } = await supabase
        .from("user_follows")
        .select("*", { count: "exact", head: true })
        .eq("follower_id", userId);

      const { count: postsCount } = await supabase
        .from("posts")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      setStats({
        followers: followersCount || 0,
        following: followingCount || 0,
        posts: postsCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchPosts = useCallback(
    async (cursor, pageSize) => {
      if (!profile?.id) return { data: [], nextCursor: null };
      try {
        let data = [], error = null;

        if (section === "posts") {
          ({ data, error } = await supabase
            .from("posts")
            .select("*, profiles(*), categories(*), videos(*), images(*), comments(*, profiles(*)), likes(count)")
            .eq("user_id", profile.id)
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .limit(pageSize)
            .lt("created_at", cursor?.created_at || new Date().toISOString())
          );
        } else if (section === "comments") {
          const { data: commentData, error: commentError } = await supabase
            .from("comments")
            .select("post_id, created_at")
            .eq("user_id", profile.id);

          if (commentError || !commentData.length) return { data: [], nextCursor: null };

          const uniquePostIds = [...new Set(commentData.map((d) => d.post_id))];

          ({ data, error } = await supabase
            .from("posts")
            .select("*, profiles(*), categories(*), videos(*), images(*), comments(*, profiles(*)), likes(count)")
            .in("id", uniquePostIds)
            .neq("user_id", profile.id)
            .order("created_at", { ascending: false })
            .order("id", { ascending: false })
            .limit(pageSize)
            .lt("created_at", cursor?.created_at || new Date().toISOString())
          );
        }

        if (error) throw error;

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
      } catch (error) {
        console.error("Napaka pri nalaganju objav:", error);
        toast.error("Napaka pri nalaganju objav: " + error.message);
        return { data: [], nextCursor: null };
      }
    },
    [section, supabase, profile]
  );

  if (loading) {
    return (
      <div className="loading-screen">
        <div>Nalaganje...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="error-message">
        Profil ni najden.
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="container-content">
          <div className="row p-t-5">
            <div className="profile-section">
              <div className="profile-content text-center m-b-5">
                <div className="profile-avatar position-center">
                  <img 
                    src={profile.profile_picture_url} 
                    alt="Profile Picture" 
                    className="profile-avatar-img" 
                  />
                </div>
                <div className="profile-username m-t-2 m-b-2">
                  {profile.username}
                  <span className="p-l-1">
                    <UserBadge userType={profile.user_type} />
                  </span>
                </div>
                <div className="profile-info">
                  <div className="profile-info-stat">
                    <span className="stat-number">{stats.followers}</span>
                    <span>Sledilcev</span>
                  </div>
                  <div className="profile-info-stat">
                    <span className="stat-number">{stats.following}</span>
                    <span>Sledi</span>
                  </div>
                  <div className="profile-info-stat">
                    <span className="stat-number">{stats.posts}</span>
                    <span>Objav</span>
                  </div>
                </div>
                <div className="profile-description m-t-2 m-b-3">
                  {profile.bio || ""}
                </div>
                {profile.website_url && (
                  <a 
                    href={profile.website_url} 
                    className="profile-links" 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    <span>{profile.website_url}</span> <i className="bi bi-arrow-up-right"></i>
                  </a>
                )}
                <div className="m-t-2">
                {user && user.id !== profile.id && (
                  <FollowButton
                    followingId={profile.id}
                    onFollowChange={() => fetchUserStats(profile.id)}
                    center={true}
                  />
                )}
                </div>
              </div>

              <div className="navigation m-b-3">
                <button 
                  className={section === "posts" ? "active" : ""} 
                  onClick={() => setSection("posts")}
                >
                  Objave
                </button>
                <button 
                  className={section === "comments" ? "active" : ""} 
                  onClick={() => setSection("comments")}
                >
                  Komentirane
                </button>
              </div>

              <InfinityLoader
                key={section}
                fetchItems={fetchPosts}
                renderItem={(post) => (
                  <Post
                    key={post.id}
                    post={post}
                    onDelete={async (id) => {
                      try {
                        const { error } = await supabase.from("posts").delete().eq("id", id);
                        if (error) throw error;
                        setStats((prev) => ({ ...prev, posts: prev.posts - 1 }));
                        toast.success("Objava uspešno izbrisana.");
                      } catch (error) {
                        console.error("Error deleting post:", error);
                        toast.error("Napaka pri brisanju objave: " + error.message);
                      }
                    }}
                    onEdit={(post) => console.log("Urejanje objave:", post)}
                  />
                )}
                pageSize={10}
                emptyComponent={<p className="text-center p-b-10">Ni objav za prikaz.</p>}
                endComponent={<p className="text-center p-b-10">Ni več objav za prikaz.</p>}
                className="post-loader-wrapper"
              />
            </div>
          </div>
        </div>
      </div>
      <Sidebar />
    </>
  );
}