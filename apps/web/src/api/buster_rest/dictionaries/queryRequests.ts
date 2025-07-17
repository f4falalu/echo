import { useQuery, QueryClient } from '@tanstack/react-query';
import { getColorThemes } from './requests';
import { dictionariesQueryKeys } from '../../query_keys/dictionaries';

export const useColorThemes = () => {
  return useQuery({
    ...dictionariesQueryKeys.colorThemes,
    initialData: [],
    initialDataUpdatedAt: 0,
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
