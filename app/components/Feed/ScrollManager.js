'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useFeedStore } from '../../store/feedStore';
import { useDebouncedCallback } from 'use-debounce';
import { createClient } from '../../../lib/supabase/client';

/**
 * ScrollManager – ohranja scroll pozicijo glede na sectionKey.
 * Pozicija se shranjuje v zustand in v sessionStorage, 
 * ob menjavi userja se resetira.
 * 
 * Primer: <ScrollManager sectionKey="profile:janez:posts">{children}</ScrollManager>
 */
export default function ScrollManager({ sectionKey, children }) {
  const pathname = usePathname();
  const supabase = createClient();

  const scrollPos = useFeedStore((s) => s.sections[sectionKey]?.scrollPos || 0);
  const setScrollPos = useFeedStore((s) => s.setScrollPos);
  const resetAll = useFeedStore((s) => s.resetAll);

  // Debounce za shranjevanje scroll pozicije v zustand
  const debouncedSave = useDebouncedCallback((pos) => {
    setScrollPos(sectionKey, pos);
  }, 300);

  // 1) Ob mountu: preveri user in resetiraj sectione če se spremeni
  useEffect(() => {
    const handleUserCheck = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const storedUser = sessionStorage.getItem('scroll-user-id');
      if (storedUser && storedUser !== user.id) {
        resetAll();
      }
      sessionStorage.setItem('scroll-user-id', user.id);

      // Scroll na pozicijo iz sessionStorage ali zustand
      const storedPos = sessionStorage.getItem(`scrollPos-${sectionKey}`);
      const pos = storedPos !== null ? parseInt(storedPos, 10) : scrollPos;
      window.scrollTo({ top: pos, behavior: 'auto' });
    };

    handleUserCheck();
    // eslint-disable-next-line
  }, [pathname, scrollPos, resetAll, supabase, sectionKey]);

  // 2) Ob scrollu: shrani v zustand in sessionStorage (debounce)
  useEffect(() => {
    const handler = () => {
      const pos = window.scrollY;
      debouncedSave(pos);
      sessionStorage.setItem(`scrollPos-${sectionKey}`, pos);
    };
    window.addEventListener('scroll', handler);
    return () => window.removeEventListener('scroll', handler);
  }, [debouncedSave, sectionKey]);

  // 3) Ob menjavi zavihka (visibilitychange): shrani scroll
  useEffect(() => {
    const onBlur = () => {
      const pos = window.scrollY;
      setScrollPos(sectionKey, pos);
      sessionStorage.setItem(`scrollPos-${sectionKey}`, pos);
    };
    document.addEventListener('visibilitychange', onBlur);
    return () => document.removeEventListener('visibilitychange', onBlur);
  }, [sectionKey, setScrollPos]);

  return (
    <div className="scroll-section-manager">
      {children}
    </div>
  );
}