// app/components/UploadNotification.js
'use client';

import { useEffect, useState } from 'react';
import { useUploadStore } from '../store/uploadStore';

export default function UploadNotification() {
  const { uploadInProgress, uploadMessage, setUploadMessage } = useUploadStore();
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    let timeoutId;

    // Ko se sporočilo prikaže (uspešno dodana ali posodobljena objava)
    if (uploadMessage && !uploadInProgress) {
      setIsVisible(true);
      
      // Samodejno skrij po 5 sekundah, če uporabnik ne premakne miške nad obvestilo
      if (!isHovered) {
        timeoutId = setTimeout(() => {
          setIsVisible(false);
        }, 5000);
      }
    }

    // Ko se začne nalaganje (show loading indicator)
    if (uploadInProgress) {
      setIsVisible(true);
      setIsHovered(false); // Reset hover state during upload
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [uploadMessage, uploadInProgress, isHovered]);

  useEffect(() => {
    if (!isVisible && !uploadInProgress) {
      // Počakaj malo preden resetiraš sporočilo, da se animacija zaključi
      const timer = setTimeout(() => {
        setUploadMessage(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [isVisible, uploadInProgress, setUploadMessage]);

  // Skrij če ni niti nalaganja niti sporočila
  if ((!uploadInProgress && !uploadMessage) || !isVisible) return null;

  return (
    <div 
      className={`upload-toast ${uploadInProgress ? 'uploading' : 'uploaded'} ${isVisible ? 'visible' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {uploadInProgress ? (
        <div className="upload-content">
          <div className="spinner"></div>
          <span>Nalaganje objave...</span>
        </div>
      ) : (
        <div className="upload-content">
          <i className="bi bi-check-circle-fill"></i>
          <span>
            {uploadMessage === true 
              ? 'Objava uspešno dodana!' 
              : uploadMessage === 'updated' 
                ? 'Objava uspešno posodobljena!' 
                : uploadMessage}
          </span>
        </div>
      )}
    </div>
  );
}