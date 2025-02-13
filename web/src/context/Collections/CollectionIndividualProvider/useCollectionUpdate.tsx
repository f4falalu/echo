import type { BusterCollection } from '@/api/asset_interfaces';
import type { CollectionUpdateCollection } from '@/api/buster_socket/collections';
import { useSocketQueryMutation } from '@/hooks';
import { useMemoizedFn } from 'ahooks';

export const useCollectionUpdate = () => {
  const { mutateAsync: updateCollection, isPending: isUpdatingCollection } = useSocketQueryMutation(
    { route: '/collections/update' },
    { route: '/collections/update:collectionState' },
    {
      preSetQueryData(data, _variables) {
        const variables = _variables as Partial<BusterCollection>;
        const newObject: BusterCollection = { ...data!, ...variables };
        return newObject;
      },
      preSetQueryDataFunction: {
        responseRoute: '/collections/list:listCollections',
        callback: (data, _variables) => {
          const existingData = data || [];
          const variables = _variables as Partial<BusterCollection>;
          return existingData.map((collection) =>
            collection.id === variables.id
              ? { ...collection, name: variables.name || collection.name }
              : collection
          );
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
