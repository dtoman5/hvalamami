'use client';
import React, { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';
import Link from 'next/link';
import UserBadge from '../User/UserBadge';
import FollowButton from '../User/FollowButton';

export default function SearchOverlay({ isOpen, onClose }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [followedUsers, setFollowedUsers] = useState([]);
  const [session, setSession] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    // Pridobi trenutno sejo
    async function getSession() {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
    }

    getSession();
  }, [supabase.auth]);

  useEffect(() => {
    // Pridobi uporabnike, ki jim sledimo
    async function fetchFollowedUsers() {
      if (!session?.user?.id) return;
      
      try {
        const { data, error } = await supabase
          .from('user_follows')
          .select('following_id')
          .eq('follower_id', session.user.id);

        if (!error && data) {
          setFollowedUsers(data.map(item => item.following_id));
        }
      } catch (err) {
        console.error('Napaka pri pridobivanju sledenih uporabnikov:', err);
      }
    }

    fetchFollowedUsers();
  }, [session, supabase]);

  useEffect(() => {
    async function fetchUsers() {
      if (!searchTerm) {
        setSearchResults([]);
        setError(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Ustvari osnovno poizvedbo
        let query = supabase
          .from('profiles')
          .select('id, username, profile_picture_url, user_type, is_verified')
          .ilike('username', `%${searchTerm}%`)
          .limit(10);

        // Dodaj filter za lastni profil samo če je uporabnik prijavljen
        if (session?.user?.id) {
          query = query.not('id', 'eq', session.user.id);
        }

        const { data: users, error: usersError } = await query;

        if (usersError) {
          throw new Error(usersError.message || 'Napaka pri pridobivanju uporabnikov');
        }

        // Nato pridobi število sledilcev za vsakega uporabnika
        const usersWithFollowers = await Promise.all(
          users.map(async (user) => {
            const { count, error: countError } = await supabase
              .from('user_follows')
              .select('*', { count: 'exact', head: true })
              .eq('following_id', user.id);

            if (countError) {
              console.warn(`Napaka pri štetju sledilcev za uporabnika ${user.id}:`, countError);
              return { 
                ...user, 
                followerCount: 0,
                isFollowed: session?.user?.id ? followedUsers.includes(user.id) : false
              };
            }

            return { 
              ...user, 
              followerCount: count || 0,
              isFollowed: session?.user?.id ? followedUsers.includes(user.id) : false
            };
          })
        );

        // Razvrsti po vrsti uporabnika
        const priority = { 
          golduser: 1, 
          superinfluencer: 2, 
          influencer: 3, 
          strokovnjak: 4,
          trgovina: 5,
          user: 6 
        };

        const sortedResults = usersWithFollowers.sort((a, b) => {
          // Najprej uporabniki, ki jim sledimo
          if (a.isFollowed && !b.isFollowed) return -1;
          if (!a.isFollowed && b.isFollowed) return 1;
          
          // Nato po prioriteti tipa uporabnika
          return (priority[a.user_type] || 7) - (priority[b.user_type] || 7);
        });

        setSearchResults(sortedResults);
      } catch (err) {
        console.error('Napaka pri iskanju uporabnikov:', err);
        setError(err.message || 'Prišlo je do napake pri iskanju uporabnikov');
      } finally {
        setLoading(false);
      }
    }

    const debounceTimer = setTimeout(() => {
      fetchUsers();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm, followedUsers, session, supabase]);

  if (!isOpen) return null;

  const formatFollowerCount = (count) => {
    return new Intl.NumberFormat('sl-SI').format(count);
  };

  return (
    <div id="searchOverlay" className={`overlay ${isOpen ? 'active' : ''}`}>
      <div className="overlay-backdrop" onClick={onClose}></div>
      <div className="overlay-content">
        <button className="close-btn" onClick={onClose}>
          <i className="bi bi-x-lg"></i>
        </button>
        
        <div className="overlay-content-search">
          <div className="search-icon">
            <i className="bi bi-search"></i>
          </div>
          <input
            type="text"
            placeholder="Išči po strani"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
          />
        </div>

        {loading && <div className="loading p-t-3 p-b-3 text-center">Iščem uporabnike...</div>}
        {error && <div className="error-message">{error}</div>}
        
        {!loading && !error && searchResults.length > 0 && (
          <div className="search-results">
            {searchResults.map((user) => (
              <div key={user.id} className="overlay-list-notify">
                <div className="notification-profile" onClick={onClose}>
                  <div className="avatar">
                    <Link scroll={false} href={`/profil/${user.username}`}>
                    <img 
                      src={user.profile_picture_url || 'https://newprofilepic.photo-cdn.net//assets/images/article/profile.jpg?90af0c8'} 
                      alt={user.username}
                      onError={(e) => {
                        e.target.src = 'https://newprofilepic.photo-cdn.net//assets/images/article/profile.jpg?90af0c8';
                      }}
                    />
                    </Link>
                  </div>
                  <div className="left-nofity-info">
                    <div className="username">
                      <Link scroll={false} href={`/profil/${user.username}`} className='posts-username'>{user.username}</Link>
                      <UserBadge userType={user.user_type} />
                      {user.is_verified && <i className="bi bi-patch-check-fill verified-badge"></i>}
                    </div>
                    <div className="posts-cat p-t-1">
                      {formatFollowerCount(user.followerCount)} sledilcev
                    </div>
                  </div>
                </div>
                {session?.user?.id && session.user.id !== user.id && (
                  <FollowButton followingId={user.id} center={false}/>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && !error && searchTerm && searchResults.length === 0 && (
          <div className="no-results">Ni rezultatov za "{searchTerm}"</div>
        )}
      </div>
    </div>
  );
}