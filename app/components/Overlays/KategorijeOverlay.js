'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '../../../lib/supabase/client';
import Link from 'next/link';
import LoadingSpinner from '../Loader/Spinner';

export default function KategorijeOverlay({ isOpen, onClose }) {
  const [kategorije, setKategorije] = useState([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchKategorije() {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data) setKategorije(data);
      setLoading(false);
    }
    if (isOpen) fetchKategorije();
  }, [isOpen, supabase]);

  if (!isOpen) return null;

  return (
    <div className="overlay active">
      <button className="close-btn" onClick={onClose}>
        <i className="bi bi-x-lg"></i>
      </button>
      <div className="overlay-content">
        <div className="category-overlay">
          <div className="menu-title m-b-2">Izbrane kategorije</div>
          {loading ? (
            <div className="text-center"><LoadingSpinner /></div>
          ) : (
            kategorije.map((kategorija) => (
              <Link
                scroll={false}
                href={`/kategorija/${encodeURIComponent(kategorija.name)}`}
                key={kategorija.id}
                className="category-item"
                style={{ backgroundColor: kategorija.hex_color }}
              >
                <div className="category-img">
                  <img
                    src={kategorija.cat_img || 'https://www.minime.si/iimg/9122/i.png'}
                    alt={kategorija.name}
                  />
                </div>
                <div className="category-content">{kategorija.name}</div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}