import { useBusterNotifications } from '@/context/BusterNotifications';
import { useSocketQueryMutation } from '@/api/buster_socket_query';
import { timeout } from '@/utils';
import { useMemoizedFn } from 'ahooks';
import { queryKeys } from '@/api/asset_interfaces';

export const useCollectionCreate = () => {
  const { openConfirmModal } = useBusterNotifications();

  const { mutateAsync: createCollection, isPending: isCreatingCollection } = useSocketQueryMutation(
    '/collections/post',
    '/collections/post:collectionState'
  );

  const createNewCollection = useMemoizedFn(
    async ({
      name,
      onCollectionCreated
    }: {
      name: string;
      onCollectionCreated?: (id: string) => Promise<void>;
    }) => {
      const res = await createCollection({ name, description: '' });
      await onCollectionCreated?.(res.id);
      await timeout(250);
      return res;
    }
  );

  const { mutateAsync: deleteCollectionMutation, isPending: isDeletingCollection } =
    useSocketQueryMutation(
      '/collections/delete',
      '/collections/delete:deleteCollections',
      queryKeys['/collections/list:getCollectionsList'](),
      (data, variables) => {
        return data?.filter((collection) => !variables.ids.includes(collection.id)) || [];
      }
    );

  const deleteCollection = useMemoizedFn(async (id: string | string[], useConfirmModal = true) => {
    const ids = Array.isArray(id) ? id : [id];
    const deleteMethod = async () => {
      await deleteCollectionMutation({ ids });
    };

    if (useConfirmModal) {
      return await openConfirmModal({
        title: 'Delete Collection',
        content: 'Are you sure you want to delete this collection?',
        onOk: deleteMethod,
        useReject: true
      });
    }

    return deleteMethod();
  });

  return {
    createNewCollection,
    isCreatingCollection,
    deleteCollection,
    isDeletingCollection
  };
};
