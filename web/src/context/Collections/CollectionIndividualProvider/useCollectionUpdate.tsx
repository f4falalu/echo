import type { CollectionUpdateCollection } from '@/api/buster_socket/collections';
import { useSocketQueryMutation } from '@/api/buster_socket_query';
import { useMemoizedFn } from '@/hooks';
import type { BusterCollection, BusterCollectionListItem } from '@/api/asset_interfaces';
import { queryKeys } from '@/api/query_keys';
import { useQueryClient } from '@tanstack/react-query';

export const useCollectionUpdate = () => {
  const queryClient = useQueryClient();

  const { mutateAsync: updateCollection, isPending: isUpdatingCollection } = useSocketQueryMutation(
    {
      emitEvent: '/collections/update',
      responseEvent: '/collections/update:collectionState',
      preCallback: (_, variables) => {
        const collectionId = variables.id!;
        const collectionOptions = queryKeys.collectionsGetCollection(collectionId);
        const queryKey = collectionOptions.queryKey;
        const collection = queryClient.getQueryData(queryKey);
        if (collection) {
          const newCollection: BusterCollection = {
            ...collection!,
            ...(variables as unknown as Partial<BusterCollection>)
          };
          queryClient.setQueryData(queryKey, newCollection);
        }

        const collectionListOptions = queryKeys.collectionsGetList();
        const collectionList = queryClient.getQueryData(collectionListOptions.queryKey);
        if (collectionList && variables.name) {
          const newCollectionList: BusterCollectionListItem[] = collectionList.map((collection) =>
            collection.id === collectionId ? { ...collection, name: variables.name! } : collection
          );
          queryClient.setQueryData(collectionListOptions.queryKey, newCollectionList);
        }
      }
    }
  );

  const onShareCollection = useMemoizedFn(
    async (
      props: Pick<
        CollectionUpdateCollection['payload'],
        | 'id'
        | 'publicly_accessible'
        | 'public_password'
        | 'user_permissions'
        | 'team_permissions'
        | 'public_expiry_date'
        | 'remove_users'
        | 'remove_teams'
      >
    ) => {
      return updateCollection(props);
    }
  );

  const onBulkAddRemoveToCollection = useMemoizedFn(
    async ({
      assets,
      collectionId
    }: {
      collectionId: string;
      assets: CollectionUpdateCollection['payload']['assets'];
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
