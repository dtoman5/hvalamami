'use client'
import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from "next/navigation";
import AuthProvider from "@/providers/AuthProvider";
import { Providers } from '@/providers';
import UploadNotification from '@/components/UploadNotification';
import { useEffect } from 'react';
import { usePostReviewStore } from "@/store/postReviewStore";
import PostReview from '@/components/Overlays/PostReview';

export default function RootLayout({ children }) {
  const supabase = createClientComponentClient();
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Red+Hat+Display:ital,wght@0,300..900;1,300..900&display=swap" rel="stylesheet" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.5.0/font/bootstrap-icons.css"
        />
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <AuthProvider>
          <Providers>
            <UploadNotification />
            {children}
            {isOpen && (
              <PostReview
                isOpen={isOpen}
                post={editingPost}
                onClose={closeReview}
                categories={[]} // opcijsko: naloži kategorije globalno
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