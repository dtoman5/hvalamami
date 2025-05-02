'use client';
import React from 'react';
import Link from 'next/link';

export default function MenuOverlay({ isOpen, onClose }) {

if (!isOpen) return null;

  return (
    <div className="overlay active">
      <button className="close-btn" onClick={onClose}>
        <i className="bi bi-x-lg"></i>
      </button>
      <div className="overlay-content">
        <ul>
          <li>
            <Link href="/zid">About Us</Link>
          </li>
          <li>
          <Link href="/zid">zes Us</Link>
          </li>
          <li>
          <Link href="/zid">About Us</Link>
          </li>
        </ul>
      </div>
    </div>
  );
}