'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { useUploadStore } from '@/store/uploadStore';
import { createClient } from '@/lib/supabase/client'; // ✅ nov uvoz

const AppContext = createContext();

export function Providers({ children }) {
  const { addUpload, updateUpload } = useUploadStore();
  const supabase = createClient(); // ✅ ustvari instanco

  useEffect(() => {
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
  }, [supabase]); // ✅ dodan dependency

  return (
    <AppContext.Provider value={{}}>
      {children}
    </AppContext.Provider>
  );
}

export const useAppContext = () => useContext(AppContext);