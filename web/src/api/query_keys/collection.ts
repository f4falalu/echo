import { queryOptions } from '@tanstack/react-query';
import type { BusterCollectionListItem, BusterCollection } from '@/api/asset_interfaces/collection';
import { collectionsGetList as collectionsGetListRequest } from '@/api/buster_rest/collections/requests';

const collectionsGetList = (
  filters?: Omit<Parameters<typeof collectionsGetListRequest>[0], 'page' | 'page_size'>
) =>
  queryOptions<BusterCollectionListItem[]>({
    queryKey: ['collections', 'list', filters] as const,
    staleTime: 60 * 1000,
    initialData: [],
    initialDataUpdatedAt: 0
  });

const collectionsGetCollection = (collectionId: string) =>
  queryOptions<BusterCollection>({
    queryKey: ['collections', 'get', collectionId] as const
  });

export const collectionQueryKeys = {
  collectionsGetList,
  collectionsGetCollection
};
