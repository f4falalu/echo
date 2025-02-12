import { useSocketQueryMutation } from '@/hooks';
import { timeout } from '@/utils';
import { useMemoizedFn } from 'ahooks';

export const useCollectionCreate = () => {
  const { mutateAsync: createCollection, isPending: isCreatingCollection } = useSocketQueryMutation(
    { route: '/collections/post' },
    { route: '/collections/post:collectionState' }
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

  return {
    createNewCollection,
    isCreatingCollection
  };
};
