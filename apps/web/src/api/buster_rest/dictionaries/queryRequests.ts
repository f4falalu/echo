import { useQuery, QueryClient } from '@tanstack/react-query';
import { getColorPalettes, getCurrencies } from './requests';
import { dictionariesQueryKeys } from '@/api/query_keys/dictionaries';
import { useSupabaseContext } from '@/context/Supabase';

export const useColorDictionaryThemes = () => {
  const isAnonymousUser = useSupabaseContext((x) => x.isAnonymousUser);

  return useQuery({
    ...dictionariesQueryKeys.colorPalettes,
    queryFn: getColorPalettes,
    enabled: isAnonymousUser === false
  });
};

export const prefetchColorPalettes = async (queryClientProp?: QueryClient) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    ...dictionariesQueryKeys.colorPalettes,
    queryFn: getColorPalettes
  });

  return queryClient;
};

export const useGetCurrencies = () => {
  return useQuery({
    ...dictionariesQueryKeys.getCurrencies,
    queryFn: getCurrencies
  });
};

export const prefetchGetCurrencies = async (queryClientProp?: QueryClient) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    ...dictionariesQueryKeys.getCurrencies,
    queryFn: getCurrencies
  });

  return queryClient;
};
