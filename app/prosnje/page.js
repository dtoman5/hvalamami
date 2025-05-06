'use client';

import { createClient } from '@/lib/supabase/client'
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

  useEffect(() => {
    async function fetchData() {
      try {
        // Preveri ali je uporabnik admin
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/prijava');
          return;
        }

        // Pridobi podatke o uporabniku
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('user_type')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        setUserType(profile.user_type);

        // Če ni admin, preusmeri
        if (profile.user_type !== 'admin') {
          router.push('/');
          return;
        }

        // Pridobi vse zahteve v čakanju s povezanimi podatki
        const { data: upgradeRequests, error: requestsError } = await supabase
          .from('upgrade_requests')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: true });

        if (requestsError) throw requestsError;

        // Pridobi podrobnosti o uporabnikih in njihovih socialnih omrežjih
        const enrichedRequests = await Promise.all(
          (upgradeRequests || []).map(async (request) => {
            // Pridobi osnovne podatke o uporabniku
            const { data: profile } = await supabase
              .from('profiles')
              .select('username, first_name, last_name, website_url, profile_picture_url, user_type')
              .eq('id', request.user_id)
              .single();

            // Pridobi socialna omrežja uporabnika
            const { data: socialLinks } = await supabase
              .from('social_media_links')
              .select('platform, link')
              .eq('profile_id', request.user_id);

            return {
              ...request,
              profile,
              socialLinks: socialLinks || []
            };
          })
        );

        setRequests(enrichedRequests);
        // Nastavi privzete izbrane tipe
        const initialSelectedTypes = {};
        enrichedRequests.forEach(request => {
          initialSelectedTypes[request.id] = request.requested_type === 'store' ? 'golduser' :
                                           request.requested_type === 'influencer' ? 'influencer' : 'superinfluencer';
        });
        setSelectedTypes(initialSelectedTypes);

      } catch (err) {
        setError('Napaka pri nalaganju podatkov: ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [supabase, router]);

  const handleTypeChange = (requestId, newType) => {
    setSelectedTypes(prev => ({
      ...prev,
      [requestId]: newType
    }));
  };

  const handleDecision = async (requestId, action) => {
    try {
      setLoading(true);
      
      if (action === 'approve') {
        // 1. Pridobi podatke o zahtevi
        const request = requests.find(req => req.id === requestId);
        if (!request) return;

        // 2. Posodobi profil uporabnika z izbranim tipom
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ 
            user_type: selectedTypes[requestId]
          })
          .eq('id', request.user_id);

        if (profileError) throw profileError;
      }

      // 3. Posodobi status zahteve
      const { error: updateError } = await supabase
        .from('upgrade_requests')
        .update({
          status: action === 'approve' ? 'approved' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // 4. Osveži seznam zahtev
      setRequests(requests.filter(req => req.id !== requestId));

    } catch (err) {
      setError('Napaka pri obdelavi zahteve: ' + err.message);
      console.error(err);
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

  if (userType !== 'admin') {
    return (
      <div className="container">
        <div className="container-content-full">
          <div className="row row-bg p-b-10">
            <div className="row-inner-nbg">
              <div className="alert alert-error">Dostop dovoljen samo administratorjem</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="container-content-full">
            <h1 className="m-b-5">Zahteve za nadgradnjo profila</h1>

            {error && (
              <div className="alert alert-error m-b-2">
                {error}
              </div>
            )}

            {requests.length === 0 ? (
              <div className="alert alert-info">
                Trenutno ni novih zahtev za pregled.
              </div>
            ) : (
              <div className="requests-table">
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
                    {requests.map(request => (
                      <tr key={request.id}>
                        <td>
                          <div className="user-info">
                            <img 
                              src={request.profile.profile_picture_url || 'https://static.vecteezy.com/system/resources/previews/029/796/026/non_2x/asian-girl-anime-avatar-ai-art-photo.jpg'} 
                              alt="Avatar" 
                              className="avatar-small" 
                              onError={(e) => {
                                e.target.src = 'https://static.vecteezy.com/system/resources/previews/029/796/026/non_2x/asian-girl-anime-avatar-ai-art-photo.jpg';
                              }}
                            />
                            @{request.profile.username}
                          </div>
                        </td>
                        <td>{request.profile.first_name} {request.profile.last_name}</td>
                        <td>
                          {request.profile.website_url ? (
                            <a href={request.profile.website_url} target="_blank" rel="noopener noreferrer">
                              {request.profile.website_url}
                            </a>
                          ) : 'Ni podatka'}
                        </td>
                        <td>
                          {request.socialLinks.length > 0 ? (
                            <ul className="social-links-list">
                              {request.socialLinks.map((link, index) => (
                                <li key={index} className="social-link-item">
                                  <span className="social-platform">{link.platform}: </span>
                                  <a 
                                    href={link.link} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="social-link-url"
                                  >
                                    {link.link}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          ) : 'Ni podatka'}
                        </td>
                        <td>
                          {request.requested_type === 'store' ? 'Trgovina' :
                           request.requested_type === 'influencer' ? 'Influencer' : 'Strokovnjak'}
                        </td>
                        <td>
                          <select
                            value={selectedTypes[request.id] || ''}
                            onChange={(e) => handleTypeChange(request.id, e.target.value)}
                            className="type-select"
                          >
                            <option value="golduser">Gold User</option>
                            <option value="influencer">Influencer</option>
                            <option value="superinfluencer">Super Influencer</option>
                            <option value="trgovina">Trgovina</option>
                            <option value="strokovnjak">Strokovnjak</option>
                          </select>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button 
                              onClick={() => handleDecision(request.id, 'approve')}
                              className="btn-approve"
                              disabled={loading}
                            >
                              <i className="bi bi-check-circle"></i> Odobri
                            </button>
                            <button 
                              onClick={() => handleDecision(request.id, 'reject')}
                              className="btn-reject"
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
              </div>
            )}
      </div>

      <style jsx>{`
        .alert {
          padding: 15px;
          margin-bottom: 20px;
          border: 1px solid transparent;
          border-radius: 4px;
        }
        .alert-info {
          background-color: #d1ecf1;
          border-color: #bee5eb;
          color: #0c5460;
        }
        .alert-error {
          background-color: #f8d7da;
          border-color: #f5c6cb;
          color: #721c24;
        }
        .loading {
          text-align: center;
          padding: 20px;
        }
        
        .styled-table {
          width: 100%;
          border-collapse: collapse;
          margin: 25px 0;
          font-size: 0.9em;
          font-family: sans-serif;
          min-width: 400px;
          box-shadow: 0 0 20px rgba(0, 0, 0, 0.15);
        }
        
        .styled-table thead tr {
          background-color: #f8f9fa;
          color: #495057;
          text-align: left;
          font-weight: bold;
        }
        
        .styled-table th,
        .styled-table td {
          padding: 12px 15px;
          border-bottom: 1px solid #e9ecef;
        }
        
        .styled-table tbody tr {
          border-bottom: 1px solid #e9ecef;
        }
        
        .styled-table tbody tr:nth-of-type(even) {
          background-color: #f8f9fa;
        }
        
        .styled-table tbody tr:last-of-type {
          border-bottom: 2px solid #f8f9fa;
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        
        .avatar-small {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          object-fit: cover;
        }
        
        .social-links-list {
          list-style-type: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        
        .social-link-item {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        
        .social-platform {
          font-weight: 500;
          color: #555;
        }
        
        .social-link-url {
          color: #0066cc;
          text-decoration: none;
          word-break: break-all;
        }
        
        .social-link-url:hover {
          text-decoration: underline;
        }
        
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        
        .type-select {
          padding: 6px;
          border-radius: 4px;
          border: 1px solid #ddd;
        }
        
        .btn-approve {
          background-color: #28a745;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .btn-reject {
          background-color: #dc3545;
          color: white;
          border: none;
          padding: 6px 12px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 5px;
        }
        
        .btn-approve:hover, .btn-reject:hover {
          opacity: 0.9;
        }
        
        .btn-approve:disabled, .btn-reject:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}