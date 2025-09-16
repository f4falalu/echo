import type { User } from '@supabase/supabase-js';
import React, { useRef, useState } from 'react';
import { createContext } from 'use-context-selector';
import { useMount } from '@/hooks/useMount';
import { getBrowserClient } from '@/integrations/supabase/client';

export type SupabaseContextType = {
  supabaseUser: Pick<User, 'id' | 'is_anonymous' | 'email'>;
  accessToken: string;
};

const supabase = getBrowserClient();
const fiveMinutes = 5 * 60 * 1000;

const useSupabaseContextInternal = ({
  supabaseUser: supabaseUserProp,
  accessToken: accessTokenProp,
}: SupabaseContextType) => {
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseContextType['supabaseUser'] | null>(
    supabaseUserProp
  );
  const [accessToken, setAccessToken] = useState(accessTokenProp);

  const isAnonymousUser: boolean = !supabaseUser?.id || supabaseUser?.is_anonymous === true;

  useMount(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      const expiresAt = session?.expires_at ?? 0;
      const timerMs = expiresAt - fiveMinutes;
      const accessToken = session?.access_token ?? '';

      setSupabaseUser(user);

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
> = React.memo(({ supabaseUser, accessToken, children }) => {
  const value = useSupabaseContextInternal({ supabaseUser, accessToken });

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>;
});
SupabaseContextProvider.displayName = 'SupabaseContextProvider';

export type SupabaseContextReturnType = ReturnType<typeof useSupabaseContextInternal>;
