import { useState, useEffect, useCallback, useRef } from 'react';

interface WakeLockSentinelLike {
  released: boolean;
  release: () => Promise<void>;
  addEventListener?: (type: string, listener: () => void) => void;
}

interface NavigatorWithWakeLock {
  wakeLock?: {
    request: (type: 'screen') => Promise<WakeLockSentinelLike>;
  };
}

export function useWakeLock(initialEnabled = true) {
  const isSupported =
    typeof navigator !== 'undefined' &&
    'wakeLock' in navigator &&
    typeof window !== 'undefined' &&
    window.isSecureContext;

  const [enabled, setEnabled] = useState(initialEnabled);
  const [isActive, setIsActive] = useState(false);
  const sentinelRef = useRef<WakeLockSentinelLike | null>(null);

  const releaseWakeLock = useCallback(async () => {
    if (sentinelRef.current) {
      try {
        await sentinelRef.current.release();
      } catch {
        // Silent fallback
      } finally {
        sentinelRef.current = null;
        setIsActive(false);
      }
    }
  }, []);

  const requestWakeLock = useCallback(async () => {
    if (!isSupported || !enabled) {
      setIsActive(false);
      return;
    }
    try {
      const nav = navigator as unknown as NavigatorWithWakeLock;
      const sentinel = await nav.wakeLock?.request('screen');
      if (sentinel) {
        sentinelRef.current = sentinel;
        setIsActive(true);
        sentinel.addEventListener?.('release', () => {
          setIsActive(false);
        });
      }
    } catch {
      // Silent fallback if battery saver or non-HTTPS blocks Wake Lock
      setIsActive(false);
    }
  }, [isSupported, enabled]);

  useEffect(() => {
    if (enabled) {
      void requestWakeLock();
    } else {
      void releaseWakeLock();
    }

    return () => {
      void releaseWakeLock();
    };
  }, [enabled, requestWakeLock, releaseWakeLock]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && enabled) {
        void requestWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, requestWakeLock]);

  return {
    isSupported,
    enabled,
    setEnabled,
    isActive,
  };
}
