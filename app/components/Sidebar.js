// app/components/Sidebar.js
'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { createClient } from '../../lib/supabase/client';
import Link from 'next/link';
import UserBadge from './User/UserBadge';
import FollowButton from './User/FollowButton';
import Spinner from './Loader/Spinner';

export default function Sidebar() {
  const supabase = createClient();
  const [recommendedUsers, setRecommendedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [session, setSession] = useState(null);

  // filtriramo profile, kjer stolpec `selected` vsebuje 'izbran'
  const FILTER_TERM = 'izbran';

  const truncateUsername = (username, maxLength = 8) =>
    username.length > maxLength ? `${username.slice(0, maxLength)}...` : username;

  // 1) Pridobi session enkrat ob mountu
  useEffect(() => {
    supabase
      .auth
      .getSession()
      .then(({ data: { session }, error }) => {
        if (!error) setSession(session);
      });
  }, [supabase]);

  // 2) Funkcija za fetch
  const fetchRecommendedUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, profile_picture_url, user_type, is_verified')
        .ilike('selected', `%${FILTER_TERM}%`)
        .limit(6);

      if (error) throw error;
      setRecommendedUsers(data || []);
    } catch (err) {
      console.error('Error fetching recommended users:', err);
      setError('Prišlo je do napake pri nalaganju priporočil');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // 3) Ob mountu naloži in subscribaj na spremembe
  useEffect(() => {
    let channel;
    fetchRecommendedUsers().then(() => {
      channel = supabase
        .channel('profiles-selected')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `selected=ilike.*${FILTER_TERM}*`,
          },
          () => {
            fetchRecommendedUsers();
          }
        )
        .subscribe();
    });
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [fetchRecommendedUsers, supabase]);

  return (
    <div className="sidebar">
      <div className="sidebar-content">
        <div className="sidebar-invitation m-b-2">
          <h3>Povabi prijatelje</h3>
          <p className="p-t-2 p-b-2">
            Klikni na gumb in povabi prijatelje, ki želiš, da ti sledijo.
          </p>
          <button className="btn-sidebar">Deli profil</button>
        </div>

        <div className="sidebar-our-pick">
          <h3>Priporočeni uporabniki</h3>

          <div className="sidebar-all-pick">
            {loading ? (
              <div className="text-center p-t-2"><Spinner /></div>
            ) : error ? (
              <div className="error-message">{error}</div>
            ) : recommendedUsers.length === 0 ? (
              <div className="no-results">Trenutno ni priporočil</div>
            ) : (
              recommendedUsers.map((user) => (
                <div key={user.id} className="sidebars-pick-follow-cont">
                  <div className="sidebars-pick-follow">
                    <Link
                      scroll={false}
                      href={`/profil/${user.username}`}
                      className="sidebar-avatars"
                    >
                      <img
                        src={
                          user.profile_picture_url ||
                          'https://newprofilepic.photo-cdn.net//assets/images/article/profile.jpg?90af0c8'
                        }
                        alt={user.username}
                        onError={(e) => {
                          e.currentTarget.src =
                            'https://newprofilepic.photo-cdn.net//assets/images/article/profile.jpg?90af0c8';
                        }}
                      />
                    </Link>
                    <div className="sidebar-username">
                      <Link
                        scroll={false}
                        href={`/profil/${user.username}`}
                        className="p-r-1"
                      >
                        {truncateUsername(user.username)}
                      </Link>
                      <UserBadge userType={user.user_type} />
                    </div>
                  </div>
                  <div className="sidebar-follow-btn">
                    {session?.user?.id !== user.id && <FollowButton followingId={user.id} small />}
                  </div>
                </div>
              ))
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
        .no-results {
          text-align: center;
          padding: 10px;
          color: #666;
        }
      `}</style>
    </div>
  );
}