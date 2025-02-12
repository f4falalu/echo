import { useSocketQueryEmitOn } from '@/hooks';

export const useCollectionSubscribe = ({ collectionId }: { collectionId: string }) => {
  const { data: collection, isFetched: isCollectionFetched } = useSocketQueryEmitOn(
    { route: '/collections/get', payload: { id: collectionId } },
    { route: '/collections/get:collectionState' }
  );

  return {
    collection,
    isCollectionFetched
  };
};
