import { useGetCollection } from '@/api/buster_rest/collections';

export const useCollectionIndividual = ({ collectionId }: { collectionId: string | undefined }) => {
  const id = collectionId || '';

  const { data: collection, isFetched: isCollectionFetched } = useGetCollection(id);

  return {
    collection,
    isCollectionFetched
  };
};
