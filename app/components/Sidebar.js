'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import UserBadge from '../components/User/UserBadge';
import FollowButton from '../components/User/FollowButton';


function Sidebar() {
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);
  const supabase = createClientComponentClient();

  const truncateUsername = (username, maxLength = 8) => {
    if (username.length > maxLength) {
      return `${username.substring(0, maxLength)}...`;
    }
    return username;
  };

  // Pridobi trenutno sejo
  useEffect(() => {
    async function getSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setSession(session);
      } catch (err) {
        console.error('Error getting session:', err);
      }
    }

    getSession();
  }, [supabase.auth]);

  // Pridobi priporočene uporabnike
  useEffect(() => {
    async function fetchRecommendedUsers() {
      setLoading(true);
      setError(null);

      try {
        // Najprej poskusimo dobiti gold uporabnike
        let { data: goldUsers, error: goldError } = await supabase
          .from('profiles')
          .select('id, username, profile_picture_url, user_type, is_verified')
          .eq('user_type', 'golduser')
          .limit(6);

        if (goldError) throw goldError;

        // Če ni dovolj gold uporabnikov, dodamo superinfluencerje
        if (!goldUsers || goldUsers.length < 6) {
          const needed = 6 - (goldUsers?.length || 0);
          let { data: superUsers, error: superError } = await supabase
            .from('profiles')
            .select('id, username, profile_picture_url, user_type, is_verified')
            .eq('user_type', 'superinfluencer')
            .limit(needed);

          if (superError) throw superError;
          
          goldUsers = [...(goldUsers || []), ...(superUsers || [])];
        }

        // Če še vedno ni dovolj, dodamo navadne influencerje
        if (goldUsers.length < 6) {
          const needed = 6 - goldUsers.length;
          let { data: influencers, error: infError } = await supabase
            .from('profiles')
            .select('id, username, profile_picture_url, user_type, is_verified')
            .eq('user_type', 'influencer')
            .limit(needed);

          if (infError) throw infError;
          
          goldUsers = [...goldUsers, ...(influencers || [])];
        }

        setRecommendedUsers(goldUsers.slice(0, 6));
      } catch (err) {
        console.error('Error fetching recommended users:', err);
        setError('Prišlo je do napake pri nalaganju priporočil');
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendedUsers();
  }, [supabase]);

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <div className="sidebar-invitation m-b-2">
          <h3>Povabi prijatelje</h3>
          <p className="p-t-2 p-b-2">Klikni na gumb in povabi prijatelje, ki želiš, da ti sledijo.</p>
          <button className="btn-sidebar">Deli profil</button>
        </div>
        
        <div className="sidebar-our-pick">
          <h3>Priporočeni uporabniki</h3>
          
          <div className="sidebar-all-pick">
            {loading ? (
              <div className="loading">Nalaganje...</div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : recommendedUsers.length > 0 ? (
              recommendedUsers.map((user) => (
                <div key={user.id} className="sidebars-pick-follow-cont">
                  <div className="sidebars-pick-follow">
                    <Link href={`/profil/${user.username}`} className="sidebar-avatars">
                      <img 
                        src={user.profile_picture_url || 'https://newprofilepic.photo-cdn.net//assets/images/article/profile.jpg?90af0c8'} 
                        alt={user.username}
                        onError={(e) => {
                          e.target.src = 'https://newprofilepic.photo-cdn.net//assets/images/article/profile.jpg?90af0c8';
                        }}
                      />
                    </Link>
                    <div className="sidebar-username">
                      <Link href={`/profil/${user.username}`} className='p-r-1'>{truncateUsername(user.username)}</Link>
                      <UserBadge userType={user.user_type} />
                    </div>
                  </div>
                  <div className="sidebar-follow-btn">
                    {session?.user?.id !== user.id && (
                      <FollowButton followingId={user.id} small />
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="no-results">Trenutno ni priporočil</div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .error-message {
          color: #e74c3c;
          padding: 10px;
          text-align: center;
          font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}

export default Sidebar;