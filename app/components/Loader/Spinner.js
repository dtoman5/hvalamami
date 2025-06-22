// app/components/Loader/Spinner.js
'use client';

import React from 'react';

export default function Spinner({ size = 40 }) {
  return (
    <div className="spinner-wrapper" style={{ width: size, height: size }}>
      <div className="spinner" />
    </div>
  );
}