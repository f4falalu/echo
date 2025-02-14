import { queryOptions } from '@tanstack/react-query';
import type { BusterCollectionListItem, BusterCollection } from '@/api/asset_interfaces';
import type { GetCollectionListParams } from '@/api/request_interfaces/collections';

const collectionsGetList = (filters?: GetCollectionListParams) =>
  queryOptions<BusterCollectionListItem[]>({
    queryKey: ['collections', 'list', filters] as const
  });

const collectionsGetCollection = (collectionId: string) =>
  queryOptions<BusterCollection>({
    queryKey: ['collections', 'get', collectionId] as const
  });

export const collectionQueryKeys = {
  '/collections/list:getCollectionsList': collectionsGetList,
  '/collections/get:collectionState': collectionsGetCollection
};
