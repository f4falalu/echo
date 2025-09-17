import { useCookieState } from '@/hooks/useCookieState';
import type { SignInTypes } from './useAuthMutations';

export const useLastUsed = () => {
  const [lastUsedMethod, setLastUsedMethod] = useCookieState<SignInTypes>('lastUsedMethod', {
    defaultValue: null,
    expirationTime: 120 * 24 * 60 * 60 * 1000, // 120 days
  });

  console.log('lastUsedMethod', lastUsedMethod);

  return {
    lastUsedMethod,
    setLastUsedMethod,
  };
};

export type LastUsedReturnType = ReturnType<typeof useLastUsed>;
