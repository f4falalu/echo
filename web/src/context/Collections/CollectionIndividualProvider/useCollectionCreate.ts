import { useBusterNotifications } from '@/context/BusterNotifications';
import { useSocketQueryMutation } from '@/api/buster_socket_query';
import { timeout } from '@/lib';
import { useMemoizedFn } from '@/hooks';
import { queryKeys } from '@/api/query_keys';
import { useCreateCollection, useDeleteCollection } from '@/api/buster_rest/collections';

export const useCollectionCreate = () => {
  const { openConfirmModal } = useBusterNotifications();

  const { mutateAsync: createCollection, isPending: isCreatingCollection } = useCreateCollection();

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
    useDeleteCollection();

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
