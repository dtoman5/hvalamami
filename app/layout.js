'use client';

import './globals.css';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { createClient } from '@/lib/supabase/client';
import { Providers } from '@/providers';
import UploadNotification from '@/components/UploadNotification';
import { usePostReviewStore } from '@/store/postReviewStore';
import PostReview from '@/components/Overlays/PostReview';
import FullPageLoader from '@/components/FullPageLoader';
import React, { Suspense, useEffect } from 'react';

export default function RootLayout({ children }) {
  const supabase = createClient();
  const { isOpen, editingPost, closeReview } = usePostReviewStore();

  // Register the service worker for Firebase Messaging
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((reg) => {
          console.log('Service worker registered with scope:', reg.scope);
        })
        .catch((err) => {
          console.error('Service worker registration failed:', err);
        });
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
        <Providers>
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
        </Providers>
      </body>
    </html>
  );
}