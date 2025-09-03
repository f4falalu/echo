import { useMemo } from 'react';
import { useGetSupabaseUser } from '@/context/Supabase';

export type SignInType = 'google' | 'github' | 'azure' | 'email' | null;

export const useLastUsed = () => {
  const supabaseUser = useGetSupabaseUser();

  const provider = supabaseUser?.app_metadata?.provider;
  const isAnonymousUser = !!supabaseUser?.is_anonymous;
  const isCurrentlySignedIn = !isAnonymousUser && !!supabaseUser?.id;

  const lastUsed: SignInType = useMemo(() => {
    if (provider === 'google') {
      return 'google';
    } else if (provider === 'github') {
      return 'github';
    } else if (provider === 'azure') {
      return 'azure';
    } else if (provider === 'email' && !isAnonymousUser) {
      return 'email';
    }
    return null;
  }, [provider]);

  return {
    lastUsed,
    isAnonymousUser,
    isCurrentlySignedIn,
    supabaseUser,
  };
};

export type LastUsedReturnType = ReturnType<typeof useLastUsed>;
