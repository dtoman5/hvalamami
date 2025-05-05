'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useUploadStore } from '@/store/uploadStore';

const AppContext = createContext();

export function Providers({ children }) {
  const { addUpload, updateUpload } = useUploadStore();
  
  useEffect(() => {
    // Realtime subscription for upload status
    const channel = supabase
      .channel('upload_status')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'session_upload'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          addUpload(payload.new);
        } else if (payload.eventType === 'UPDATE') {
          updateUpload(payload.new.id, payload.new);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <AppContext.Provider value={{}}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);