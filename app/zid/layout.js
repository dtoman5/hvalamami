'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

import { createClient } from '../../lib/supabase/client';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import KategorijeOverlay from '../components/Overlays/KategorijeOverlay';
import SugestedUsers from '../components/User/SugestedUsers';
import { usePostReviewStore } from '../store/postReviewStore';
import NavTabs from '../components/NavTabs';

export default function ZidLayout({ children }) {
  const supabase = createClient();
  const router = useRouter();
  const pathname = usePathname();
  const { openReview } = usePostReviewStore();

  const [profile, setProfile] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isCatOverlayOpen, setCatOverlayOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // ❌ Ni uporabnika → preusmeri
      if (!user) {
        router.replace('/prijava');
        return;
      }

      // ✅ Pridobi profil
      const { data: prof } = await supabase
        .from('profiles')
        .select('username, first_name, profile_picture_url')
        .eq('id', user.id)
        .single();

      setProfile(prof);

      // ✅ Pridobi kategorije
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      setCategories(cats || []);
      setLoading(false);
    };

    fetchData();
  }, [router, supabase]);

  const tabs = [
    { key: 'followers', label: 'Objave' },
    { key: 'stories', label: 'Zgodbe' },
    { key: 'categories', label: 'Kategorije' },
  ];

  return (
    <>
      <Navbar />
      <Sidebar />

      <div className="app-container">
        <main className="main-content">
          <div className="container">
            <div className="container-content">
              <div className="row">
                <div className="dashboard-text p-b-5 m-b-2">
                  <div className="text-center">
                    <div className="user-post">
                      <img
                        src={profile?.profile_picture_url || '/default-avatar.png'}
                        alt="Avatar"
                        className="avatar"
                        onError={(e) => (e.currentTarget.src = '/default-avatar.png')}
                      />
                      <div className="user-post-intro">
                        {profile?.username || 'Uporabnik'}
                      </div>
                    </div>
                    <h1 className="p-t-2 p-b-3">
                      <span>{profile?.first_name}</span>, tukaj je tvoj prostor dogajanja.
                    </h1>
                    <Link href="/" className="btn-1">
                      <i className="bi bi-info-circle"></i> Navodila
                    </Link>
                  </div>
                </div>

                <div className="dashboard-post text-center" onClick={() => openReview(null)}>
                  <div className="dashboard-user-post">
                    <div className="post-username">
                      {profile?.username || 'Uporabnik'}
                    </div>
                  </div>
                  <div className="flex-content-post">
                    <span className="post-icon">
                      <i className="bi bi-plus-circle-dotted"></i>
                    </span>
                    <p>dodaj objavo</p>
                  </div>
                </div>
              </div>

              <div className="category-row">
                <div className="flex-content m-b-2">
                  <div className="menu-title">Izbrane kategorije</div>
                  <div className="category-all text-center">
                    <button
                      className="btn-category-all"
                      onClick={() => setCatOverlayOpen(true)}
                    >
                      Vse kategorije
                    </button>
                  </div>
                </div>
                <div className="flex-content-x">
                  {categories.slice(0, 15).map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/kategorija/${encodeURIComponent(cat.name)}`}
                      className="category-item"
                      style={{ backgroundColor: cat.hex_color }}
                    >
                      <div className="category-img">
                        <img src={cat.cat_img || '/default-avatar.png'} alt={cat.name} />
                      </div>
                      <div className="category-content">{cat.name}</div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="container-content p-t-3 p-b-3">
              <div className="row">
                <div className='flex-content-x m-b-3'>
                <div className="m-b-6">
                  <SugestedUsers />
                </div>
                </div>

                <NavTabs
                  basePath="/zid"
                  tabs={[
                  { key: 'followers', label: 'Objave' },
                  { key: 'stories',  label: 'Zgodbe' },
                  { key: 'categories', label: 'Kategorije' },
                  ]}
                />

                {children}
              </div>
            </div>
          </div>
        </main>
      </div>

      <KategorijeOverlay isOpen={isCatOverlayOpen} onClose={() => setCatOverlayOpen(false)} />
    </>
  );
}