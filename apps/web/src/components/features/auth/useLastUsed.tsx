import { useCookieState } from '@/hooks/useCookieState';
import type { SignInTypes } from './useAuthMutations';

export const useLastUsed = () => {
  const [lastUsedMethod, setLastUsedMethod] = useCookieState<SignInTypes>('lastUsedMethod', {
    defaultValue: null,
    expirationTime: 90 * 24 * 60 * 60 * 1000, // 90 days
  });

  return {
    lastUsedMethod,
    setLastUsedMethod,
  };
};

export type LastUsedReturnType = ReturnType<typeof useLastUsed>;
