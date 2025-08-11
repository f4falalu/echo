'use client';

import { jwtDecode } from 'jwt-decode';
import React, { type PropsWithChildren, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createContext, useContextSelector } from 'use-context-selector';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { millisecondsFromUnixTimestamp } from '@/lib/timestamp';
import type { UseSupabaseUserContextType } from '@/lib/supabase';
import { timeout } from '@/lib/timeout';
import { useBusterNotifications } from '../BusterNotifications';
import { flushSync } from 'react-dom';
import { getBrowserClient } from '@/lib/supabase/client';

const PREEMTIVE_REFRESH_MINUTES = 5;
const supabase = getBrowserClient();

const useSupabaseContextInternal = ({
  supabaseContext
}: {
  supabaseContext: UseSupabaseUserContextType;
}) => {
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const { openErrorNotification } = useBusterNotifications();
  const [accessToken, setAccessToken] = useState(supabaseContext.accessToken || '');
  const refreshInFlightRef = useRef<Promise<string> | null>(null);

  const isAnonymousUser: boolean =
    !supabaseContext.user?.id || supabaseContext.user?.is_anonymous === true;

  const getExpiresAt = useMemoizedFn((token?: string) => {
    try {
      const decoded = jwtDecode(token || accessToken);
      const expiresAtDecoded = (decoded as { exp?: number } | undefined)?.exp ?? 0;
      const expiresAtMs = millisecondsFromUnixTimestamp(expiresAtDecoded);
      const msUntilExpiry = Math.max(0, expiresAtMs - Date.now());
      return msUntilExpiry;
    } catch {
      // If token is missing/invalid, report that it is effectively expired now
      return 0;
    }
  });

  const onUpdateToken = useMemoizedFn(
    async ({ accessToken, expiresAt: _expiresAt }: { accessToken: string; expiresAt: number }) => {
      setAccessToken(accessToken);
      flushSync(() => {
        //noop
      });
    }
  );

  const checkTokenValidity = useMemoizedFn(async () => {
    try {
      // Anonymous users do not require refresh; return current token as-is
      if (isAnonymousUser) {
        return {
          access_token: accessToken,
          isTokenValid: true
        };
      }

      // If we don't have a token in memory, try to recover it from Supabase session
      if (!accessToken) {
        const { data: sessionData } = await supabase.auth.getSession();
        const recoveredToken = sessionData.session?.access_token || '';
        if (recoveredToken) {
          await onUpdateToken({
            accessToken: recoveredToken,
            expiresAt: sessionData.session?.expires_at ?? 0
          });
          return {
            access_token: recoveredToken,
            isTokenValid: true
          };
        }
      }

      const msUntilExpiration = getExpiresAt();
      const minutesUntilExpiration = msUntilExpiration / 60000;
      const needsPreemptiveRefresh = minutesUntilExpiration < PREEMTIVE_REFRESH_MINUTES;

      if (needsPreemptiveRefresh) {
        try {
          // Ensure only one refresh is in-flight
          let refreshPromise = refreshInFlightRef.current;
          if (!refreshPromise) {
            refreshPromise = (async () => {
              const { data: refreshedSession, error: refreshedSessionError } =
                await supabase.auth.refreshSession();

              if (refreshedSessionError || !refreshedSession.session) {
                throw refreshedSessionError || new Error('Failed to refresh session');
              }

              const refreshedAccessToken = refreshedSession.session.access_token;
              const expiresAt = refreshedSession.session.expires_at ?? 0;
              await onUpdateToken({ accessToken: refreshedAccessToken, expiresAt });
              return refreshedAccessToken;
            })();
            refreshInFlightRef.current = refreshPromise;
            // Clear the ref when the refresh resolves/rejects
            void refreshPromise.finally(() => {
              refreshInFlightRef.current = null;
            });
          }

          const refreshedAccessToken = await refreshPromise;
          await timeout(25);
          return {
            access_token: refreshedAccessToken,
            isTokenValid: true
          };
        } catch (err) {
          openErrorNotification({
            title: 'Error refreshing session',
            description: 'Please refresh the page and try again',
            duration: 120 * 1000 //2 minutes
          });
          // As a fallback, try to read whatever session is available
          const { data: sessionData } = await supabase.auth.getSession();
          const fallbackToken = sessionData.session?.access_token || '';
          if (fallbackToken) {
            await onUpdateToken({
              accessToken: fallbackToken,
              expiresAt: sessionData.session?.expires_at ?? 0
            });
            return { access_token: fallbackToken, isTokenValid: true };
          }
          throw err;
        }
      }

      return {
        access_token: accessToken,
        isTokenValid: true
      };
    } catch (e) {
      console.error(e);
      openErrorNotification({
        title: 'Error checking user authentication',
        description: 'Please try again later',
        duration: 120 * 1000 //2 minutes
      });
      throw e;
    }
  });

  useLayoutEffect(() => {
    if (supabaseContext.accessToken) {
      setAccessToken(supabaseContext.accessToken);
    }
  }, [supabaseContext.accessToken]);

  useEffect(() => {
    const setupRefreshTimer = () => {
      const expiresInMs = getExpiresAt();
      const refreshBuffer = PREEMTIVE_REFRESH_MINUTES * 60000; // Refresh minutes before expiration
      const timeUntilRefresh = Math.max(0, expiresInMs - refreshBuffer);

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      // Set up timer for future refresh
      refreshTimerRef.current = setTimeout(() => {
        checkTokenValidity();
      }, timeUntilRefresh);
    };

    setupRefreshTimer();

    // Cleanup timer on unmount or when expiration changes
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, [accessToken, checkTokenValidity, getExpiresAt]);

  useEffect(() => {
    // Keep access token in sync with Supabase client (captures auto-refresh events)
    const { data: subscription } = supabase.auth.onAuthStateChange((event, session) => {
      const newToken = session?.access_token;
      if (event === 'SIGNED_OUT' || !newToken) {
        setAccessToken('');
        if (refreshTimerRef.current) {
          clearTimeout(refreshTimerRef.current);
        }
        return;
      }
      void onUpdateToken({ accessToken: newToken, expiresAt: session?.expires_at ?? 0 });
    });

    return () => {
      subscription.subscription.unsubscribe();
    };
  }, [onUpdateToken]);

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        void checkTokenValidity();
      }
    };
    const onOnline = () => {
      void checkTokenValidity();
    };

    window.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('online', onOnline);

    return () => {
      window.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('online', onOnline);
    };
  }, [checkTokenValidity]);

  return {
    isAnonymousUser,
    setAccessToken,
    accessToken,
    user: supabaseContext.user,
    checkTokenValidity
  };
};

const SupabaseContext = createContext<ReturnType<typeof useSupabaseContextInternal>>({
  isAnonymousUser: true
} as ReturnType<typeof useSupabaseContextInternal>);

export const SupabaseContextProvider: React.FC<
  PropsWithChildren<{
    supabaseContext: UseSupabaseUserContextType;
  }>
> = React.memo(({ supabaseContext, children }) => {
  const value = useSupabaseContextInternal({ supabaseContext });

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
});
SupabaseContextProvider.displayName = 'SupabaseContextProvider';

export type SupabaseContextReturnType = ReturnType<typeof useSupabaseContextInternal>;

export const useSupabaseContext = <T,>(selector: (state: SupabaseContextReturnType) => T) => {
  return useContextSelector(SupabaseContext, selector);
};
