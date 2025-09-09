import { useMemo } from 'react';
import { isServer } from '@/lib/window';

/**
 * Hook to detect if the user is on a Mac system
 * @returns {boolean} true if the user is on a Mac, false otherwise (Windows, Linux, etc.)
 */
export const useIsMac = (): boolean => {
  return useMemo(() => {
    if (isServer) {
      return false; // Server-side rendering fallback
    }

    // Check the user agent for Mac indicators
    const userAgent = window.navigator.userAgent.toLowerCase();

    return userAgent.includes('macintosh') || userAgent.includes('mac os');
  }, []);
};

/**
 * Hook to detect if the user is on a Windows system
 * @returns {boolean} true if the user is on Windows, false otherwise
 */
export const useIsWindows = (): boolean => {
  return useMemo(() => {
    if (isServer) {
      return false; // Server-side rendering fallback
    }

    // Check the user agent for Windows indicators
    const userAgent = window.navigator.userAgent.toLowerCase();
    return userAgent.includes('windows');
  }, []);
};

/**
 * Hook to get the platform type
 * @returns {'mac' | 'windows' | 'other'} the detected platform
 */
export const usePlatform = (): 'mac' | 'windows' | 'other' => {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return 'other'; // Server-side rendering fallback
    }

    const userAgent = window.navigator.userAgent.toLowerCase();

    if (userAgent.includes('macintosh') || userAgent.includes('mac os')) {
      return 'mac';
    }

    if (userAgent.includes('windows')) {
      return 'windows';
    }

    return 'other';
  }, []);
};

export const useBrowser = (): 'chrome' | 'firefox' | 'safari' | 'edge' | 'other' => {
  return useMemo(() => {
    if (isServer) {
      return 'other'; // Server-side rendering fallback
    }

    const userAgent = window.navigator.userAgent.toLowerCase();

    if (userAgent.includes('chrome')) {
      return 'chrome';
    }

    if (userAgent.includes('firefox')) {
      return 'firefox';
    }

    if (userAgent.includes('safari')) {
      return 'safari';
    }

    if (userAgent.includes('edge')) {
      return 'edge';
    }

    return 'other';
  }, []);
};
