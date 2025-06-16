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
import React, { Suspense } from 'react';

export default function RootLayout({ children }) {
  const supabase = createClient();
  const { isOpen, editingPost, closeReview } = usePostReviewStore();

  return (
    <html lang="sl">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/font/bootstrap-icons.css"
        />
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