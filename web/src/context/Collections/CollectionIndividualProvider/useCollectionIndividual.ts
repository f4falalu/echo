import { queryKeys } from '@/api/query_keys';
import { useSocketQueryEmitOn } from '@/api/buster_socket_query';

export const useCollectionIndividual = ({ collectionId }: { collectionId: string | undefined }) => {
  const id = collectionId || '';

  const { data: collection, isFetched: isCollectionFetched } = useSocketQueryEmitOn({
    emitEvent: {
      route: '/collections/get',
      payload: { id }
    },
    responseEvent: '/collections/get:collectionState',
    options: queryKeys['/collections/get:collectionState'](id),
    callback: undefined,
    enabledTrigger: !!id
  });

  return {
    collection,
    isCollectionFetched
  };
};
