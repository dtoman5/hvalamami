'use client';

import { createClient } from '../../lib/supabase/client'
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function UpgradeProfile() {
  const supabase = createClient();
  const [user, setUser] = useState(null);
  const [requestedType, setRequestedType] = useState('');
  const [existingRequest, setExistingRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // fetch user, profile, and last upgrade request
  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          window.location.href = '/prijava';
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        setUser({ ...user, ...profile });

        const { data: request } = await supabase
          .from('upgrade_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (request) setExistingRequest(request);
      } catch (err) {
        console.error(err);
        setError('Napaka pri nalaganju podatkov');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [supabase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('upgrade_requests')
        .insert([{
          user_id: user.id,
          requested_type: requestedType,
          status: 'pending'
        }])
        .select()
        .single();

      if (error) throw error;
      setExistingRequest(data);
    } catch (err) {
      console.error(err);
      setError('Napaka pri oddaji zahteve: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // map statuses to display text + color
  const statusInfo = existingRequest && (() => {
    switch (existingRequest.status) {
      case 'approved':
        return { text: 'Odobrena sprememba', color: 'green' };
      case 'rejected':
        return { text: 'Zavrnjeno', color: 'red' };
      default:
        return { text: 'Profil čaka na potrditev', color: 'black' };
    }
  })();

  return (
    <>
      <Navbar />
      <div className="container">
        <div className="container-content-full">
          <div className="row row-bg p-b-10">
            <div className="row-inner-nbg">
              <div className="m-b-5">
                <h1>Nadgradi profil</h1>
                <p>Keep your personal details private. Information you add here is visible to anyone who can view your profile.</p>
              </div>

              <div className="user-post padding-none">
                <img 
                  src={user?.profile_picture_url || '/default-avatar.png'} 
                  alt="Avatar" 
                  className="avatar" 
                />
                <div className="user-post-intro">
                  {user?.username}
                  <i className="bi bi-bag-check-fill p-l-1"></i>
                  <i className="bi bi-patch-check-fill"></i>
                </div>
              </div>

              {existingRequest ? (
                <div className="m-t-2 m-b-2">
                  <div className="alert alert-info">
                    <h3
                      className="menu-title m-b-1"
                      style={{ color: statusInfo.color, fontSize: '1.2rem' }}
                    >
                      {statusInfo.text}
                    </h3>
                    <p>
                      Željena nadgradnja: {
                        {
                          gold: 'Zlati uporabnik',
                          influencer: 'Influencer',
                          store: 'Trgovina',
                          expert: 'Strokovnjak',
                        }[existingRequest.requested_type]
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="m-t-2 m-b-2">
                    <p>Convert to a personal account. You will no longer have access to business tools or other data.</p>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="form-group form-age m-b-2">
                      <div className="form-age-icon">
                        <i className="bi bi-arrow-down-short"></i>
                      </div>
                      <select
                        id="upgrade-type"
                        className={error ? 'is-invalid' : ''}
                        defaultValue=""
                        onChange={(e) => setRequestedType(e.target.value)}
                        required
                      >
                        <option value="" hidden>Željena nadgradnja profila</option>
                        <option value="gold">Zlati uporabnik</option>
                        <option value="influencer">Influencer</option>
                        <option value="store">Trgovina</option>
                        <option value="expert">Strokovnjak</option>
                      </select>
                    </div>

                    <div style={{ backgroundColor: 'red', color: 'white' }} className="row-inner-bg">
                      <div style={{ color: 'white' }} className="menu-title p-b-1">
                        Pozor! Pred zahtevo za nadgradnjo...
                      </div>
                      <p className="p-b-5">
                        Pazi, da imaš v urejanju profila dodana socialna omrežja za zahteve, ki jasno dokazujejo, 
                        da si primeren za želeno nadgradnjo. V nasprotnem primeru ti nadgradnje ne bomo potrdili.
                      </p>
                    </div>

                    {error && (
                      <div className="alert alert-error m-b-2">
                        {error}
                      </div>
                    )}

                    <div className="upgrade-profile text-center">
                      <button 
                        type="submit" 
                        className="upgrade-btn"
                        disabled={loading}
                      >
                        {loading ? 'Oddajanje...' : 'Zahtevaj nadgradnjo profila'}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}