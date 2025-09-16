import type { User } from '@supabase/supabase-js';
import React, { useRef, useState } from 'react';
import { createContext } from 'use-context-selector';
import { useMount } from '@/hooks/useMount';
import { getBrowserClient } from '@/integrations/supabase/client';
import type { SimplifiedSupabaseSession } from '@/integrations/supabase/getSupabaseUserClient';

export type SupabaseContextType = {
  supabaseSession: SimplifiedSupabaseSession;
};

const supabase = getBrowserClient();
const fiveMinutes = 5 * 60 * 1000;

const useSupabaseContextInternal = ({ supabaseSession }: SupabaseContextType) => {
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [supabaseUser, setSupabaseUser] = useState<
    SupabaseContextType['supabaseSession']['user'] | null
  >(supabaseSession?.user);
  const [accessToken, setAccessToken] = useState(supabaseSession.accessToken);

  const isAnonymousUser: boolean = !supabaseUser?.id || supabaseUser?.is_anonymous === true;

  useMount(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      const expiresAt = session?.expires_at ?? 0;
      const timerMs = expiresAt - fiveMinutes;
      const accessToken = session?.access_token ?? '';

      setSupabaseUser(
        user ? { id: user.id, is_anonymous: user.is_anonymous, email: user.email } : null
      );

      if (accessToken) setAccessToken(accessToken);

      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }

      refreshTimerRef.current = setTimeout(() => {
        supabase.auth.refreshSession();
      }, timerMs);
    });

    return () => {
      subscription.unsubscribe();
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  });

  return {
    supabaseUser,
    isAnonymousUser,
    accessToken,
  };
};

export const SupabaseContext = createContext<ReturnType<typeof useSupabaseContextInternal>>({
  isAnonymousUser: true,
} as ReturnType<typeof useSupabaseContextInternal>);

export const SupabaseContextProvider: React.FC<
  SupabaseContextType & { children: React.ReactNode }
> = React.memo(({ supabaseSession, children }) => {
  const value = useSupabaseContextInternal({ supabaseSession });

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
});
SupabaseContextProvider.displayName = 'SupabaseContextProvider';

export type SupabaseContextReturnType = ReturnType<typeof useSupabaseContextInternal>;
