import { useSocketQueryEmitOn } from '@/hooks';

export const useCollectionIndividual = ({ collectionId }: { collectionId: string | undefined }) => {
  const { data: collection, isFetched: isCollectionFetched } = useSocketQueryEmitOn(
    { route: '/collections/get', payload: { id: collectionId || '' } },
    { route: '/collections/get:collectionState' },
    { enabled: !!collectionId }
  );

  return {
    collection,
    isCollectionFetched
  };
};
