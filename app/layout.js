'use client';

import './globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider } from '@supabase/auth-helpers-react';
import { useState, useEffect, Suspense } from 'react';

import UploadNotification from './components/UploadNotification';
import { usePostReviewStore } from './store/postReviewStore';
import PostReview from './components/Overlays/PostReview';
import FullPageLoader from './components/FullPageLoader';

export default function RootLayout({ children }) {
  const [supabaseClient] = useState(() => createBrowserSupabaseClient());
  const { isOpen, editingPost, closeReview } = usePostReviewStore();

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((reg) => console.log('✅ Service worker registered:', reg.scope))
        .catch((err) => console.error('❌ SW napaka:', err));
    }
  }, []);

  return (
    <html lang="sl">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/font/bootstrap-icons.css"
        />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <SessionContextProvider supabaseClient={supabaseClient}>
          <UploadNotification />

          <Suspense fallback={<FullPageLoader />}>
            {children}
          </Suspense>

          {isOpen && (
            <PostReview
              isOpen={isOpen}
              post={editingPost}
              onClose={closeReview}
              categories={[]}
            />
          )}

          <ToastContainer
            position="bottom-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
          />
        </SessionContextProvider>
      </body>
    </html>
  );
}