'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useUploadStore } from './store/uploadStore';
import { createClient } from '../lib/supabase/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const AppContext = createContext(null);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,
      cacheTime: 1000 * 60 * 60,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

export function Providers({ children }) {
  const { addUpload, updateUpload } = useUploadStore();
  const supabase = createClient();

  useEffect(() => {
    // 1) Session-upload realtime channel
    const chUpload = supabase
      .channel('public:session_upload')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'session_upload' },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            addUpload(payload.new);
          } else if (payload.eventType === 'UPDATE') {
            updateUpload(payload.new.id, payload.new);
          }
        }
      )
      .subscribe();

    // 2) Helper to subscribe any table → dispatch a document event
    function subscribe(table, [onIns, onUpd, onDel]) {
      return supabase
        .channel(`public:${table}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table },
          (payload) => {
            const ev =
              payload.eventType === 'INSERT'
                ? onIns
                : payload.eventType === 'UPDATE'
                ? onUpd
                : onDel;
            document.dispatchEvent(
              new CustomEvent(ev, { detail: payload.new ?? payload.old })
            );
          }
        )
        .subscribe();
    }

    // 3) Posts, comments and notifications channels
    const chPosts = subscribe('posts', [
      'new-post',
      'update-post',
      'delete-post',
    ]);
    const chComments = subscribe('comments', [
      'new-comment',
      'update-comment',
      'delete-comment',
    ]);
    const chNotifications = subscribe('notifications', [
      'new-notification',
      'update-notification',
      'delete-notification',
    ]);

    // cleanup
    return () => {
      supabase.removeChannel(chUpload);
      supabase.removeChannel(chPosts);
      supabase.removeChannel(chComments);
      supabase.removeChannel(chNotifications);
    };
  }, [supabase, addUpload, updateUpload]);

  return (
    <QueryClientProvider client={queryClient}>
      <AppContext.Provider value={null}>
        {children}
      </AppContext.Provider>
    </QueryClientProvider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}