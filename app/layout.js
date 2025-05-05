'use client';

import "./globals.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useRouter } from "next/navigation";
import AuthProvider from "@/providers/AuthProvider";
import { Providers } from '@/providers';
import UploadNotification from '@/components/UploadNotification';
import { useEffect } from 'react';
import { usePostReviewStore } from "@/store/postReviewStore";
import PostReview from '@/components/Overlays/PostReview';
import { DM_Serif_Display, Red_Hat_Display } from 'next/font/google';  // Uporabi next/font za nalaganje fontov

// Nalaganje fontov z next/font
const dmSerif = DM_Serif_Display({
  weight: ['400', '700'],
  subsets: ['latin'],
  display: 'swap',
});

const redHat = Red_Hat_Display({
  weight: ['300', '400', '500', '700', '900'],
  subsets: ['latin'],
  display: 'swap',
});

export default function RootLayout({ children }) {
  const router = useRouter();
  const { isOpen, editingPost, closeReview } = usePostReviewStore();

  // Ta useEffect je za spremljanje sprememb v avtentikaciji
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
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className={`${dmSerif.className} ${redHat.className}`}>
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