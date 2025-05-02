// app/components/UploadNotification.js
'use client';

import { useUploadStore } from '@/app/store/uploadStore';

export default function UploadNotification() {
  const { uploadInProgress, uploadMessage } = useUploadStore();

  if (!uploadInProgress && !uploadMessage) return null;

  return (
    <div className={`upload-toast ${uploadInProgress ? 'uploading' : 'uploaded'}`}>
      {uploadInProgress ? (
        <div className="upload-content">
          <div className="spinner"></div>
          <span>Nalaganje objave...</span>
        </div>
      ) : (
        <div className="upload-content">
          <i className="bi bi-check-circle-fill"></i>
          <span>Objava uspešno dodana!</span>
        </div>
      )}
    </div>
  );
}