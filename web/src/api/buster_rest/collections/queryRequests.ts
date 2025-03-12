import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collectionQueryKeys } from '@/api/query_keys/collection';
import {
  collectionsGetList,
  collectionsGetCollection,
  collectionsCreateCollection,
  collectionsUpdateCollection,
  collectionsDeleteCollection
} from './requests';
import type { GetCollectionListParams } from '@/api/request_interfaces/collections';
import { useMemo } from 'react';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';

export const useGetCollectionsList = (
  filters: Omit<GetCollectionListParams, 'page' | 'page_size'>
) => {
  const payload = useMemo(() => {
    return { page: 0, page_size: 1000, ...filters };
  }, [filters]);

  return useQuery({
    ...collectionQueryKeys.collectionsGetList(payload),
    queryFn: () => collectionsGetList(payload)
  });
};

export const useGetCollection = (collectionId: string | undefined) => {
  return useQuery({
    ...collectionQueryKeys.collectionsGetCollection(collectionId!),
    queryFn: () => collectionsGetCollection({ id: collectionId! }),
    enabled: !!collectionId
  });
};

export const useCreateCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: collectionsCreateCollection,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: collectionQueryKeys.collectionsGetList().queryKey
      });
    }
  });
};

export const useUpdateCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: collectionsUpdateCollection,
    onMutate: (variables) => {
      const queryKey = collectionQueryKeys.collectionsGetCollection(variables.id).queryKey;
      queryClient.setQueryData(queryKey, (v) => {
        return {
          ...v!,
          name: variables.name || v?.name!
        };
      });
    }
  });
};

export const useDeleteCollection = () => {
  const { openConfirmModal } = useBusterNotifications();
  const queryClient = useQueryClient();

  const deleteCollection = useMemoizedFn(
    async ({
      id,
      useConfirmModal = true
    }: {
      useConfirmModal?: boolean;
      id: string | string[];
    }) => {
      const ids = Array.isArray(id) ? id : [id];
      const deleteMethod = async () => {
        await collectionsDeleteCollection({ ids });
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
    }
  );

  return useMutation({
    mutationFn: deleteCollection,
    onMutate: (variables) => {
      const queryKey = collectionQueryKeys.collectionsGetList().queryKey;
      queryClient.setQueryData(queryKey, (v) => {
        const ids = Array.isArray(variables.id) ? variables.id : [variables.id];
        return v?.filter((c) => !ids.includes(c.id));
      });
    }
  });
};
