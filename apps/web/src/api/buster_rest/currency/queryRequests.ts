import { queryKeys } from '@/api/query_keys';
import { QueryClient, usePrefetchQuery, useQuery } from '@tanstack/react-query';
import { mainApiV2 } from '../instances';
import { Currency } from '@buster/server-shared/currency';

export const useGetCurrencies = () => {
  return useQuery({
    ...queryKeys.getCurrencies,
    queryFn: async () => {
      return mainApiV2.get<Currency[]>('/dictionaries/currency').then(async (res) => res.data);
    }
  });
};

export const prefetchGetCurrencies = async (queryClientProp?: QueryClient) => {
  const queryClient = queryClientProp || new QueryClient();

  await queryClient.prefetchQuery({
    ...queryKeys.getCurrencies,
    queryFn: async () => {
      return mainApiV2.get<Currency[]>('/dictionaries/currency').then(async (res) => res.data);
    }
  });

  return queryClient;
};
