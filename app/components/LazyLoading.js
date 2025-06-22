"use client";
import React, { useState } from 'react';

const MediaLazyLoader = ({
  src,
  alt = '',
  type = 'image',
  className = '',
  imageClassName = '',
  videoClassName = '',
  videoOptions = {},
  width = 16,
  height = 9,
  thumbnail = '',
}) => {
  const [loaded, setLoaded] = useState(false);
  const aspectRatio = (width && height) ? (width / height) : (16 / 9);

  return (
    <div
      className={`lazy-media-container relative ${className}`}
      style={{
        aspectRatio,
        backgroundColor: '#e2e2e2',
        animation: !loaded ? 'pulse 1.5s infinite' : 'none',
        overflow: 'hidden',
        borderRadius: '0.5rem',
      }}
    >
      {!loaded && <div className="absolute inset-0 bg-gray-300 animate-pulse" />}
      
      {type === 'image' ? (
        <img
          src={src}
          alt={alt}
          className={`lazy-media-loaded w-full h-full object-cover transition-opacity duration-300 ${imageClassName}`}
          onLoad={() => setLoaded(true)}
          loading="lazy"
          style={{ opacity: loaded ? 1 : 0 }}
        />
      ) : (
        <>
          {!loaded && thumbnail && (
            <img
              src={thumbnail}
              alt="video-thumbnail"
              className="w-full h-full object-cover"
              loading="lazy"
              onLoad={() => setLoaded(true)}
            />
          )}
          {loaded && (
            <video
              className={`lazy-media-loaded w-full h-full object-cover ${videoClassName}`}
              controls={videoOptions.controls !== false}
              muted={videoOptions.muted !== false}
              autoPlay={videoOptions.autoPlay || false}
              loop={videoOptions.loop || false}
              playsInline={videoOptions.playsInline !== false}
            >
              <source src={src} type={`video/${src.split('.').pop()}`} />
              Vaš brskalnik ne podpira video elementa.
            </video>
          )}
        </>
      )}
    </div>
  );
};

export default MediaLazyLoader;