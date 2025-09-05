import { useGetSupabaseUser } from '@/context/Supabase';

export type SignInType = 'google' | 'github' | 'azure' | 'email' | null;

export const useLastUsed = () => {
  const supabaseUser = useGetSupabaseUser();

  const isAnonymousUser = !!supabaseUser?.is_anonymous;
  const isCurrentlySignedIn = !isAnonymousUser && !!supabaseUser?.id;

  return {
    isAnonymousUser,
    isCurrentlySignedIn,
    supabaseUser,
  };
};

export type LastUsedReturnType = ReturnType<typeof useLastUsed>;
