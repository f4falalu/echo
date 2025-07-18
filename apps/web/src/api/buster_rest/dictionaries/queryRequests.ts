import { useQuery, QueryClient } from '@tanstack/react-query';
import { getColorThemes, getCurrencies } from './requests';
import { dictionariesQueryKeys } from '@/api/query_keys/dictionaries';

export const useColorDictionaryThemes = () => {
  return useQuery({
    ...dictionariesQueryKeys.colorThemes,
    queryFn: getColorThemes
  });
};

export const prefetchColorThemes = async (queryClientProp?: QueryClient) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    ...dictionariesQueryKeys.colorThemes,
    queryFn: getColorThemes
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
