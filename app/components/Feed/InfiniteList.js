'use client';

import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react';
import Spinner from '../Loader/Spinner';
import { useFeedStore } from '../../store/feedStore';
import { createClient } from '../../../lib/supabase/client';
import { useDebouncedCallback } from 'use-debounce';

/**
 * InfiniteList – Neskončno nalaganje za poljuben "section"
 * (zid, profil, kategorije, komentarji ...)
 *
 * Props:
 * - section: unikaten ključ za zustand sekcijo (npr. 'feed:followers' ali 'post:123:comments')
 * - fetchItems: async funkcija (cursor, pageSize) => { items: [], nextCursor, currentPage, totalPages }
 * - renderItem: funkcija (item, idx) => React element
 * - pageSize: število elementov na stran (privzeta 10)
 * - threshold: razmik v px za IntersectionObserver (privzeto 400)
 * - className: dodatni CSS razredi za glavni wrapper
 * - emptyComponent: JSX za primer, ko ni elementov
 * - endComponent: JSX za primer, ko ni več novih elementov
 */
export default function InfiniteList({
  section,
  fetchItems,
  renderItem,
  pageSize = 10,
  threshold = 400,
  className = '',
  emptyComponent = <div className="text-center p-t-3 text-muted">Ni vsebine za prikaz.</div>,
  endComponent = <div className="text-center p-t-3">Ni več vsebine.</div>,
}) {
  const sentinelRef = useRef(null);
  const [isFetching, setIsFetching] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  // Pridobimo trenutni feed iz zustand: lahko je undefined
  const feedFromStore = useFeedStore((s) => s.sections?.[section]);

  // Če ni, uporabimo default objekt z najnujnejšimi lastnostmi
  const feed = feedFromStore ?? {
    pages: [],
    nextCursor: 1,   // privzeto 1, da se prvič naloži
    scrollPos: 0,
    ids: [],
  };

  const addPage = useFeedStore((s) => s.addPage);
  const upsertItem = useFeedStore((s) => s.upsertItem);
  const removeItem = useFeedStore((s) => s.removeItem);
  const setScrollPos = useFeedStore((s) => s.setScrollPos);

  // Preverimo, da je feed.pages vedno array
  const pagesArray = Array.isArray(feed.pages) ? feed.pages : [];

  // Združimo vse posts naložene v pages
  const flatPosts = useMemo(() => {
    if (!pagesArray) return [];
    // Združimo vse strani v en array
    let items = pagesArray.flatMap((p) => p.posts || []);
    // Odstranimo morebitne duplikate (po id)
    const seen = new Set();
    return items.filter((item) => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [pagesArray]);

  // Funkcija za nalaganje naslednje strani
  const loadMore = useCallback(async () => {
    if (isFetching || !feed.nextCursor) return;
    setIsFetching(true);
    setFetchError(null);
    try {
      const result = await fetchItems(feed.nextCursor, pageSize);
      if (!result || !Array.isArray(result.items)) {
        throw new Error('Neveljaven odgovor od strežnika');
      }
      addPage(section, {
        posts: result.items,
        currentPage: result.currentPage ?? 0,
        totalPages: result.totalPages ?? 0,
        nextCursor: result.nextCursor,
      });
    } catch {
      setFetchError('Napaka pri nalaganju vsebine.');
    } finally {
      setIsFetching(false);
    }
  }, [isFetching, feed.nextCursor, fetchItems, pageSize, addPage, section]);

  // Ob montaži ali spremembi feed.nextCursor: nalagaj naslednjo stran le, če še ni nobene strani
  useEffect(() => {
    if (!isFetching && pagesArray.length === 0 && feed.nextCursor) {
      loadMore();
    }
    // eslint-disable-next-line
  }, [pagesArray.length, feed.nextCursor]);

  // Debounced shranjevanje scroll pozicije
  const debouncedScroll = useDebouncedCallback((pos) => {
    setScrollPos(section, pos);
  }, 250);

  useEffect(() => {
    const onScroll = () => {
      debouncedScroll(window.scrollY);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [debouncedScroll, section]);

  // Ob montaži nastavimo scroll na prejšnji položaj
  useEffect(() => {
    if (typeof window !== 'undefined' && typeof feed.scrollPos === 'number') {
      window.scrollTo(0, feed.scrollPos);
    }
    // eslint-disable-next-line
  }, []);

  // IntersectionObserver za sentinel na dnu (za infinite scroll)
  useEffect(() => {
    if (!feed.nextCursor || isFetching) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: `${threshold}px` }
    );
    const sentinel = sentinelRef.current;
    if (sentinel) observer.observe(sentinel);
    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [loadMore, feed.nextCursor, isFetching, threshold]);

  // Realtime listener za komentarje (prek Supabase kanalov)
  useEffect(() => {
    // Preverimo, ali gre za "post:ID:comments" sekcijo
    if (section.startsWith('post:') && section.endsWith(':comments')) {
      const parts = section.split(':');
      if (parts.length >= 3) {
        const postId = parts[1];
        const supabase = createClient();
        const channel = supabase
          .channel(`comments-${postId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'comments',
              filter: `post_id=eq.${postId}`,
            },
            (payload) => {
              if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
                upsertItem(section, payload.new);
              }
              if (payload.eventType === 'DELETE') {
                removeItem(section, payload.old.id);
              }
            }
          )
          .subscribe();
        return () => {
          supabase.removeChannel(channel);
        };
      }
    }
  }, [section, upsertItem, removeItem]);

  return (
    <div className={className}>
      {/* Prikaz praznega stanja, če noben element in ni nalaganje */}
      {!isFetching && flatPosts.length === 0 && !fetchError && emptyComponent}

      {/* Prikaz vsebine */}
      {flatPosts.map((item, idx) => (
        <div key={item.id || idx} className="m-b-6">
          {renderItem(item, idx)}
        </div>
      ))}

      {/* Spinner med nalaganjem */}
      {isFetching && (
        <div className="text-center p-4">
          <Spinner size={24} />
        </div>
      )}

      {/* Napaka pri nalaganju */}
      {fetchError && (
        <div className="text-center p-4 text-red-600">
          {fetchError}{' '}
          <button onClick={loadMore} className="underline ml-2">
            Poskusi znova
          </button>
        </div>
      )}

      {/* Ko ni več novih strani */}
      {!feed.nextCursor && !isFetching && flatPosts.length > 0 && endComponent}

      {/* Sentinel za IntersectionObserver */}
      <div ref={sentinelRef} style={{ height: 1 }} />
    </div>
  );
}