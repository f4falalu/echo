import { queryKeys } from '@/api/asset_interfaces';
import { useSocketQueryEmitOn } from '@/api/buster_socket_query';

export const useCollectionIndividual = ({ collectionId }: { collectionId: string | undefined }) => {
  const id = collectionId || '';

  const { data: collection, isFetched: isCollectionFetched } = useSocketQueryEmitOn(
    { route: '/collections/get', payload: { id } },
    '/collections/get:collectionState',
    queryKeys['/collections/get:collectionState'](id),
    undefined,
    !!id
  );

  return {
    collection,
    isCollectionFetched
  };
};
