import { useContextSelector } from 'use-context-selector';
import { SupabaseContext, type SupabaseContextReturnType } from './SupabaseContextProvider';

const stableAccessTokenSelector = (state: SupabaseContextReturnType) => state.accessToken;
export const useGetSupabaseAccessToken = () => {
  return useContextSelector(SupabaseContext, stableAccessTokenSelector);
};

const stableIsAnonymousUserSelector = (state: SupabaseContextReturnType) => state.isAnonymousUser;
export const useIsAnonymousSupabaseUser = () => {
  return useContextSelector(SupabaseContext, stableIsAnonymousUserSelector);
};

const stableSupabaseUserSelector = (state: SupabaseContextReturnType) => state.supabaseUser;
export const useGetSupabaseUser = () => {
  return useContextSelector(SupabaseContext, stableSupabaseUserSelector);
};
