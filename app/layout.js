'use client'

import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import { useEffect } from 'react';

import { createClient } from '@/lib/supabase/client'; // ✅ pravilni uvoz
import AuthProvider from "@/providers/AuthProvider";
import { Providers } from '@/providers';
import UploadNotification from '@/components/UploadNotification';
import { usePostReviewStore } from "@/store/postReviewStore";
import PostReview from '@/components/Overlays/PostReview';
import ScrollManager from '@/components/sessionStorage';

export default function RootLayout({ children }) {
  const supabase = createClient(); // ✅ uporabi enoten odjemalec
  const router = useRouter();
  const { isOpen, editingPost, closeReview } = usePostReviewStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      router.refresh();
    });
    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase, router]);

  return (
    <html lang="sl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" as="style" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" as="style" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Red+Hat+Display:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet" as="style" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/font/bootstrap-icons.css"
          as="style"
        />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <AuthProvider>
          <Providers>
            <ScrollManager />
            <UploadNotification />
            {children}
            {isOpen && (
              <PostReview
                isOpen={isOpen}
                post={editingPost}
                onClose={closeReview}
                categories={[]}
              />
            )}
            <ToastContainer
              position="top-right"
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
        </AuthProvider>
      </body>
    </html>
  );
}