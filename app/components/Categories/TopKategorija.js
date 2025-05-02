'use client';
import React, { useState, useEffect } from 'react';

export default function TopKategorije() {
  const [topKategorije, setTopKategorije] = useState([]);

  useEffect(() => {
    async function fetchTopKategorije() {
      const data = await pridobiKategorijeZObjavami();
      if (data) {
        setTopKategorije(data);
      }
    }
    fetchTopKategorije();
  }, []);

  return (
    <div className="flex-content-x m-b-5">
      {topKategorije.map((kategorija) => (
        <a href={`kategorija/${kategorija.name}`} className="category-item" key={kategorija.id} style={{ backgroundColor: kategorija.hex_color }}>
          <div
            className="category-img">
            <img
              className=""
              src={kategorija.cat_img || 'https://www.minime.si/iimg/9122/i.png'}
              alt={kategorija.name}
            />
          </div>
          <div className="category-content">{kategorija.name}</div>
        </a>
      ))}
    </div>
  );
}