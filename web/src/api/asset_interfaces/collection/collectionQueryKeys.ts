import { queryOptions } from '@tanstack/react-query';
import { BusterCollectionListItem } from './interfaces';
import type { GetCollectionListParams } from '../../request_interfaces/collections';

const collectionsGetList = (filters?: GetCollectionListParams) =>
  queryOptions<BusterCollectionListItem[]>({
    queryKey: ['collections', 'list', filters] as const
  });

export const collectionQueryKeys = {
  '/collections/list:getCollectionsList': collectionsGetList
};
