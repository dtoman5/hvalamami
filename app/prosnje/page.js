'use client';

import { createClient } from '../../lib/supabase/client'
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function UpgradeRequestsAdmin() {
  const supabase = createClient();
  const router = useRouter();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userType, setUserType] = useState(null);
  const [selectedTypes, setSelectedTypes] = useState({});

  // helper to map type → human label
  const TYPE_LABELS = {
    gold:        'Zlati uporabnik',
    influencer:  'Influencer',
    store:       'Trgovina',
    expert:      'Strokovnjak',
  };

  useEffect(() => {
    async function fetchData() {
      try {
        // 1) require login + admin
        const { data: { user }, error: userErr } = await supabase.auth.getUser();
        if (userErr || !user) return router.push('/prijava');

        const { data: profile, error: profErr } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();
        if (profErr) throw profErr;
        if (profile.user_type !== 'admin') return router.push('/');
        setUserType('admin');

        // 2) fetch pending upgrade requests
        const { data: upgradeRequests, error: reqErr } = await supabase
          .from('upgrade_requests')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: true });
        if (reqErr) throw reqErr;

        // 3) enrich with profile + social links
        const enriched = await Promise.all(
          (upgradeRequests || []).map(async (req) => {
            const { data: prof } = await supabase
              .from('profiles')
              .select('username, first_name, last_name, website_url, profile_picture_url')
              .eq('id', req.user_id)
              .single();
            const { data: socialLinks } = await supabase
              .from('social_media_links')
              .select('platform, link')
              .eq('profile_id', req.user_id);
            return { ...req, profile: prof, socialLinks: socialLinks || [] };
          })
        );

        setRequests(enriched);

        // 4) initialize selectedTypes so each dropdown matches requested_type
        const init = {};
        enriched.forEach(r => {
          init[r.id] = r.requested_type;
        });
        setSelectedTypes(init);

      } catch (err) {
        console.error(err);
        setError('Napaka pri nalaganju podatkov: ' + err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [supabase, router]);

  const handleTypeChange = (requestId, newType) => {
    setSelectedTypes((prev) => ({ ...prev, [requestId]: newType }));
  };

  const handleDecision = async (requestId, action) => {
    try {
      setLoading(true);

      // if approved, update the user’s profile.user_type
      if (action === 'approve') {
        const newType = selectedTypes[requestId];
        const { error: profErr } = await supabase
          .from('profiles')
          .update({ user_type: newType })
          .eq('id', requests.find(r => r.id === requestId).user_id);
        if (profErr) throw profErr;
      }

      // update request status
      const { error: updErr } = await supabase
        .from('upgrade_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', requestId);
      if (updErr) throw updErr;

      // remove from list
      setRequests((prev) => prev.filter(r => r.id !== requestId));

    } catch (err) {
      console.error(err);
      setError('Napaka pri obdelavi zahteve: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading || userType === null) {
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
    <div className="container p-l-2 p-r-2">
      <div className="container-content-full">
        <h1 className="m-b-5">Zahteve za nadgradnjo profila</h1>
        {error && <div className="alert alert-error m-b-2">{error}</div>}

        {requests.length === 0 ? (
          <div className="alert alert-info">
            Trenutno ni novih zahtev za pregled.
          </div>
        ) : (
          <table className="styled-table">
            <thead>
              <tr>
                <th>Uporabnik</th>
                <th>Ime</th>
                <th>Spletna stran</th>
                <th>Socialna omrežja</th>
                <th>Zahtevana nadgradnja</th>
                <th>Dodeli tip</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td>
                    <div className="user-info">
                      <img
                        src={req.profile.profile_picture_url || '/default-avatar.png'}
                        className="avatar-small"
                        onError={(e) => e.currentTarget.src = '/default-avatar.png'}
                      />
                      @{req.profile.username}
                    </div>
                  </td>
                  <td>{req.profile.first_name} {req.profile.last_name}</td>
                  <td>
                    {req.profile.website_url
                      ? <a href={req.profile.website_url} target="_blank" rel="noopener noreferrer">{req.profile.website_url}</a>
                      : 'Ni podatka'}
                  </td>
                  <td>
                    {req.socialLinks.length
                      ? <ul className="social-links-list">
                          {req.socialLinks.map((s, i) => (
                            <li key={i}>
                              <strong>{s.platform}:</strong> <a href={s.link} target="_blank" rel="noopener noreferrer">{s.link}</a>
                            </li>
                          ))}
                        </ul>
                      : 'Ni podatka'}
                  </td>
                  <td>
                    {TYPE_LABELS[req.requested_type] || req.requested_type}
                  </td>
                  <td>
                    <select
                      value={selectedTypes[req.id]}
                      onChange={(e) => handleTypeChange(req.id, e.target.value)}
                      className="type-select"
                    >
                      <option value="gold">Zlati uporabnik</option>
                      <option value="influencer">Influencer</option>
                      <option value="store">Trgovina</option>
                      <option value="expert">Strokovnjak</option>
                    </select>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn-approve"
                        onClick={() => handleDecision(req.id, 'approve')}
                        disabled={loading}
                      >
                        <i className="bi bi-check-circle"></i> Odobri
                      </button>
                      <button
                        className="btn-reject"
                        onClick={() => handleDecision(req.id, 'reject')}
                        disabled={loading}
                      >
                        <i className="bi bi-x-circle"></i> Zavrni
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <style jsx>{`
        .alert { padding:15px; margin-bottom:20px; border-radius:4px; }
        .alert-info { background:#d1ecf1; color:#0c5460; }
        .alert-error { background:#f8d7da; color:#721c24; }
        .loading { text-align:center; padding:20px; }
        .styled-table { width:100%; border-collapse:collapse; margin:25px 0; font-size:0.9em; font-family:sans-serif; }
        .styled-table th, .styled-table td { padding:12px 15px; border-bottom:1px solid #e9ecef; }
        .styled-table thead { background:#f8f9fa; font-weight:bold; color:#495057; }
        .avatar-small { width:30px; height:30px; border-radius:50%; object-fit:cover; margin-right:8px; }
        .user-info { display:flex; align-items:center; }
        .social-links-list { list-style:none; padding:0; margin:0; }
        .social-links-list li { margin-bottom:6px; }
        .type-select { padding:6px; border:1px solid #ddd; border-radius:4px; }
        .action-buttons { display:flex; gap:8px; }
        .btn-approve { background:#28a745; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; display:flex; align-items:center; gap:4px; }
        .btn-reject  { background:#dc3545; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; display:flex; align-items:center; gap:4px; }
        .btn-approve:disabled, .btn-reject:disabled { opacity:0.6; cursor:not-allowed; }
      `}</style>
    </div>
  );
}