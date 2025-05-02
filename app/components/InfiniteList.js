'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import LoadingSpinner from './Loader/Spinner';

const InfinityLoader = ({
  fetchItems,
  renderItem,
  pageSize = 10,
  emptyComponent = null,
  endComponent = null,
  className = ''
}) => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState(null);
  const observerRef = useRef(null);
  const initialLoad = useRef(true);
  const loadingRef = useRef(false);

  const loadItems = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;

    loadingRef.current = true;
    setIsLoading(true);

    try {
      const { data: newItems, nextCursor } = await fetchItems(cursor, pageSize);

      setItems(prev => {
        const existingIds = new Set(prev.map(item => item.id));
        const filtered = newItems.filter(item => !existingIds.has(item.id));
        return [...prev, ...filtered];
      });

      setCursor(nextCursor);
      setHasMore(!!nextCursor);

      if (initialLoad.current) initialLoad.current = false;
    } catch (error) {
      console.error('Napaka pri nalaganju:', error);
      setHasMore(false);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [cursor, pageSize, fetchItems, hasMore]);

  useEffect(() => {
    if (initialLoad.current) loadItems();
  }, [loadItems]);

  useEffect(() => {
    if (!hasMore || initialLoad.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loadingRef.current) {
          loadItems();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    const currentObserver = observerRef.current;
    if (currentObserver) observer.observe(currentObserver);

    return () => {
      if (currentObserver) observer.unobserve(currentObserver);
    };
  }, [loadItems, hasMore]);

  useEffect(() => {
    const handleNewComment = (event) => {
      const newComment = event.detail;
      setItems(prev => {
        const exists = prev.some(item => item.id === newComment.id);
        if (exists) return prev;
        return [newComment, ...prev];
      });
    };

    const handleUpdateComment = (event) => {
      const updatedComment = event.detail;
      setItems(prev => prev.map(item => item.id === updatedComment.id ? updatedComment : item));
    };

    const handleDeleteComment = (event) => {
      const deletedCommentId = event.detail;
      setItems(prev => prev.filter(item => item.id !== deletedCommentId));
    };

    document.addEventListener('new-comment', handleNewComment);
    document.addEventListener('update-comment', handleUpdateComment);
    document.addEventListener('delete-comment', handleDeleteComment);

    return () => {
      document.removeEventListener('new-comment', handleNewComment);
      document.removeEventListener('update-comment', handleUpdateComment);
      document.removeEventListener('delete-comment', handleDeleteComment);
    };
  }, []);

  return (
    <div className={className}>
      {!initialLoad.current && items.length === 0 && emptyComponent}

      {items.map((item) => (
        <React.Fragment key={`${item.id}-${item.created_at}`}>
          {renderItem(item)}
        </React.Fragment>
      ))}

      {isLoading && <div className="text-center"><LoadingSpinner /></div>}

      {!hasMore && items.length > 0 && endComponent}

      <div ref={observerRef} style={{ height: '1px' }} aria-hidden="true" />
    </div>
  );
};

export default InfinityLoader;