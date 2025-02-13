import { queryOptions, useQuery, useQueryClient } from '@tanstack/react-query';
import { BusterCollectionListItem } from './interfaces';

const collectionsGetList = (filters?: GetCollectionListParams) =>
  queryOptions<BusterCollectionListItem[]>({
    queryKey: ['collections', 'list', filters] as const
  });

export const collectionQueryKeys = {
  '/collections/list:getCollectionsList': collectionsGetList
};
