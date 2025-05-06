'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Uporabi za navigacijo

export default function ScrollManager() {
  const router = useRouter();

  // Shrani pozicijo ob preklopu med stranmi
  useEffect(() => {
    const tabKey = router.asPath;  // To bo ključ za posamezno stran
    const savedY = localStorage.getItem(`scroll-${tabKey}`);
    if (savedY) {
      window.scrollTo(0, Number(savedY));  // Obnovi pozicijo pomika
    }

    return () => {
      localStorage.setItem(`scroll-${tabKey}`, window.scrollY); // Shrani pozicijo pomika ob preklopu
    };
  }, [router.asPath]); // Ob preklopu strani

  return null; // Ta komponenta ne vrne ničesar v UI, samo upravlja scroll
}