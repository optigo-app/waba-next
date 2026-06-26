'use client';

import { useEffect, useRef } from 'react';

export default function useLazyLoading(callback, hasMore, isLoading) {
  const observer = useRef(null);
  const hasTriggeredRef = useRef(false);

  useEffect(() => {
    if (!isLoading) {
      hasTriggeredRef.current = false;
    }
  }, [isLoading]);

  useEffect(() => {
    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, []);

  const lastElementRef = (node) => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore && !hasTriggeredRef.current) {
        hasTriggeredRef.current = true;
        callback();
      }
    });
    if (node) observer.current.observe(node);
  };

  return lastElementRef;
}
