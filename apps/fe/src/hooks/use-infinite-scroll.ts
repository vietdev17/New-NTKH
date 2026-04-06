'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export function useInfiniteScroll(callback: () => void, hasMore: boolean) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const triggerRef = useRef<HTMLDivElement | null>(null);

  const setTriggerRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (node && hasMore) {
      observerRef.current = new IntersectionObserver(
        (entries) => { if (entries[0].isIntersecting) callback(); },
        { threshold: 0.1 }
      );
      observerRef.current.observe(node);
    }
    triggerRef.current = node;
  }, [callback, hasMore]);

  useEffect(() => {
    return () => { if (observerRef.current) observerRef.current.disconnect(); };
  }, []);

  return { triggerRef: setTriggerRef };
}
