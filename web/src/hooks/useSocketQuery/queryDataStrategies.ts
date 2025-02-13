import { QueryClient } from '@tanstack/react-query';
import { QueryDataStrategy } from './mutationTypes';
import { BusterSocketResponseRoute } from '@/api/buster_socket';
import { InferBusterSocketResponseData } from './types';

export const executeQueryDataStrategy = async <TRoute extends BusterSocketResponseRoute>(
  queryClient: QueryClient,
  queryKey: unknown[],
  data: InferBusterSocketResponseData<TRoute>,
  strategy: QueryDataStrategy
) => {
  if (strategy === 'ignore') return;

  const strategies: Record<Exclude<QueryDataStrategy, 'ignore'>, () => Promise<void>> = {
    replace: async () => {
      await queryClient.setQueryData(queryKey, data);
    },
    append: async () => {
      await queryClient.setQueryData<InferBusterSocketResponseData<TRoute>[]>(queryKey, (prev) => [
        ...(Array.isArray(prev) ? prev : []),
        data
      ]);
    },
    prepend: async () => {
      await queryClient.setQueryData<InferBusterSocketResponseData<TRoute>[]>(queryKey, (prev) => [
        data,
        ...(Array.isArray(prev) ? prev : [])
      ]);
    },
    merge: async () => {
      if (typeof data === 'object' && data !== null && 'id' in data) {
        await queryClient.setQueryData<Record<string, InferBusterSocketResponseData<TRoute>>>(
          queryKey,
          (prev) => ({
            ...(prev || {}),
            [(data as { id: string }).id]: data
          })
        );
      }
    }
  };

  const updateStrategy = strategies[strategy as Exclude<QueryDataStrategy, 'ignore'>];

  if (updateStrategy) {
    await updateStrategy();
  }
};
