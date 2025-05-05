'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '../components/Navbar';

export default function UpgradeProfile() {
  const supabase = createClientComponentClient();
  const [user, setUser] = useState(null);
  const [requestedType, setRequestedType] = useState('');
  const [existingRequest, setExistingRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        setUser({
          ...user,
          ...profile
        });

        const { data: request } = await supabase
          .from('upgrade_requests')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (request) {
          setExistingRequest(request);
        }

      } catch (err) {
        setError('Napaka pri nalaganju podatkov');
        console.error(err);
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
      setError('Napaka pri oddaji zahteve: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="container-content-full">
          <div className="row row-bg p-b-10">
            <div className="row-inner-nbg">
              <div className="loading">Nalaganje...</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    < Navbar />
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
                src={user?.profile_picture_url || 'https://static.vecteezy.com/system/resources/previews/029/796/026/non_2x/asian-girl-anime-avatar-ai-art-photo.jpg'} 
                alt="Avatar" 
                className="avatar" 
              />
              <div className="user-post-intro">
                @{user?.username} 
                <i className="bi bi-bag-check-fill"></i>
                <i className="bi bi-patch-check-fill"></i>
                <i className="bi bi-patch-check-fill"></i>
              </div>
            </div>

            {existingRequest ? (
              <div className="m-t-2 m-b-2">
                <div className="alert alert-info">
                  <h3>Vaša prošnja čaka na potrditev</h3>
                  <p>Status: {existingRequest.status === 'pending' ? 'v čakanju' : 
                              existingRequest.status === 'approved' ? 'odobreno' : 'zavrnjeno'}</p>
                  <p>Zahtevana nadgradnja: {existingRequest.requested_type === 'store' ? 'Trgovina' : 
                                          existingRequest.requested_type === 'influencer' ? 'Influencer' : 'Strokovnjak'}</p>
                </div>
              </div>
            ) : (
              <>
                <div className="m-t-2 m-b-2">
                  <p>Convert to a personal account. You will no longer have access to business tools or other data.</p>
                </div>

                <form onSubmit={handleSubmit}>
                  <div className="form-group form-age m-b-2">
                    <div className="form-age-icon"><i className="bi bi-arrow-down-short"></i></div>
                    <select 
                      id="user-age"
                      value={requestedType}
                      onChange={(e) => setRequestedType(e.target.value)}
                      required
                    >
                      <option value="" selected hidden>Željena nadgradnja profila</option>
                      <option value="store">Zlati uporabnik</option>
                      <option value="influencer">Influencer</option>
                      <option value="store">Trgovina</option>
                      <option value="expert">Strokovnjak</option>
                    </select>
                  </div>

                  <div style={{backgroundColor: 'red', color: 'white'}} className="row-inner-bg">
                    <div style={{color: 'white'}} className="menu-title p-b-1">Pozor! Pred zahtevo za nadgradnjo...</div>
                    <p className="p-b-5">
                      Pazi, da imaš v uredi profil dodana socialna omrežja za zahteve, ki jasno dokazujejo, 
                      da ste nedvoumno profil za katerega zaprošate. V nasprotnem primeru vam nadgradnje ne bomo potrdili.
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
      

      <style jsx>{`
        .alert {
          padding: 15px;
          margin-bottom: 20px;
          border: 1px solid transparent;
          border-radius: 4px;
        }
        .alert-info {
          background-color: #d9edf7;
          border-color: #bce8f1;
          color: #31708f;
        }
        .alert-error {
          background-color: #f2dede;
          border-color: #ebccd1;
          color: #a94442;
        }
        .loading {
          text-align: center;
          padding: 20px;
        }
        .upgrade-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
    </>
  );
}