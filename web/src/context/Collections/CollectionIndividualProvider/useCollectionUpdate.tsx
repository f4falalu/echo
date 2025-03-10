import { useMemoizedFn } from '@/hooks';
import { useUpdateCollection } from '@/api/buster_rest/collections';
import { UpdateCollectionParams } from '@/api/request_interfaces/collections';

export const useCollectionUpdate = () => {
  const { mutateAsync: updateCollection, isPending: isUpdatingCollection } = useUpdateCollection();

  const onShareCollection = useMemoizedFn(async (props: UpdateCollectionParams) => {
    return updateCollection(props);
  });

  const onBulkAddRemoveToCollection = useMemoizedFn(
    async ({
      assets,
      collectionId
    }: {
      collectionId: string;
      assets: UpdateCollectionParams['assets'];
    }) => {
      return updateCollection({
        id: collectionId,
        assets
      });
    }
  );

  return {
    updateCollection,
    isUpdatingCollection,
    onShareCollection,
    onBulkAddRemoveToCollection
  };
};
