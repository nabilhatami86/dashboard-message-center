import { useEffect, useRef, useCallback } from 'react';

interface SmartRefreshOptions {
  onRefresh: () => Promise<void> | void;
  minInterval?: number;
  maxInterval?: number;
  enabled?: boolean;
}

/**
 * Smart refresh hook - mirip WhatsApp
 * FIXED: Stable implementation tanpa infinite loop
 */
export function useSmartRefresh({
  onRefresh,
  minInterval = 15000,
  maxInterval = 60000,
  enabled = true,
}: SmartRefreshOptions) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const currentIntervalRef = useRef(minInterval);
  const lastActivityRef = useRef<number>(0);
  const isVisibleRef = useRef(typeof document !== 'undefined' ? !document.hidden : true);
  const onRefreshRef = useRef(onRefresh);

  // Initialize lastActivityRef only once
  useEffect(() => {
    if (lastActivityRef.current === 0) {
      lastActivityRef.current = Date.now();
    }
  }, []);

  // Update ref setiap render (tapi tidak trigger re-run effect)
  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  // Mark user activity
  const markActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    currentIntervalRef.current = minInterval;
  }, [minInterval]);

  // Get next interval dengan exponential backoff
  const getNextInterval = useCallback(() => {
    const timeSinceActivity = Date.now() - lastActivityRef.current;

    // Jika baru ada aktivitas (< 2 menit), gunakan interval cepat
    if (timeSinceActivity < 120000) {
      return minInterval;
    }

    // Gradually increase interval
    const newInterval = Math.min(
      currentIntervalRef.current * 1.5,
      maxInterval
    );
    currentIntervalRef.current = newInterval;
    return newInterval;
  }, [minInterval, maxInterval]);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      const wasHidden = !isVisibleRef.current;
      isVisibleRef.current = !document.hidden;

      // Jika tab baru saja aktif, refresh langsung
      if (wasHidden && !document.hidden) {
        onRefreshRef.current();
        markActivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [markActivity]);

  // Main polling loop
  useEffect(() => {
    if (!enabled) {
      // Clear timeout jika disabled
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const scheduleNext = () => {
      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Skip jika tab tidak visible
      if (!isVisibleRef.current) {
        return;
      }

      const nextInterval = getNextInterval();

      timeoutRef.current = setTimeout(async () => {
        await onRefreshRef.current();
        scheduleNext(); // Schedule next
      }, nextInterval);
    };

    // Initial load
    onRefreshRef.current();

    // Schedule first refresh
    scheduleNext();

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, getNextInterval]); // Hanya depend on enabled dan getNextInterval

  return { markActivity };
}
