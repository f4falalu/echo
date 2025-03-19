import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { collectionQueryKeys } from '@/api/query_keys/collection';
import {
  collectionsGetList,
  collectionsGetCollection,
  collectionsCreateCollection,
  collectionsUpdateCollection,
  collectionsDeleteCollection,
  shareCollection,
  unshareCollection,
  updateCollectionShare
} from './requests';
import type { GetCollectionListParams } from '@/api/request_interfaces/collections';
import { useMemo } from 'react';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import { create } from 'mutative';
import type { BusterCollection } from '@/api/asset_interfaces/collection';

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
  const getAssetPassword = useBusterAssetsContextSelector((state) => state.getAssetPassword);
  const { password } = getAssetPassword(collectionId!);

  return useQuery({
    ...collectionQueryKeys.collectionsGetCollection(collectionId!),
    queryFn: () => collectionsGetCollection({ id: collectionId!, password }),
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
          onOk: deleteMethod
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

export const useShareCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shareCollection,
    onMutate: (variables) => {
      const queryKey = collectionQueryKeys.collectionsGetCollection(variables.id).queryKey;
      queryClient.setQueryData(queryKey, (previousData) => {
        return create(previousData!, (draft: BusterCollection) => {
          draft.individual_permissions?.push(...variables.params);
        });
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        collectionQueryKeys.collectionsGetCollection(data.id).queryKey,
        data
      );
    }
  });
};

export const useUnshareCollection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unshareCollection,
    onMutate: (variables) => {
      const queryKey = collectionQueryKeys.collectionsGetCollection(variables.id).queryKey;
      queryClient.setQueryData(queryKey, (previousData) => {
        return create(previousData!, (draft: BusterCollection) => {
          draft.individual_permissions =
            draft.individual_permissions?.filter((t) => !variables.data.includes(t.email)) || [];
        });
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        collectionQueryKeys.collectionsGetCollection(data.id).queryKey,
        data
      );
    }
  });
};

export const useUpdateCollectionShare = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateCollectionShare,
    onMutate: (variables) => {
      const queryKey = collectionQueryKeys.collectionsGetCollection(variables.id).queryKey;
      queryClient.setQueryData(queryKey, (previousData) => {
        return create(previousData!, (draft) => {
          draft.individual_permissions =
            draft.individual_permissions!.map((t) => {
              const found = variables.data.users?.find((v) => v.email === t.email);
              if (found) return found;
              return t;
            }) || [];

          if (variables.data.publicly_accessible !== undefined) {
            draft.publicly_accessible = variables.data.publicly_accessible;
          }
          if (variables.data.public_password !== undefined) {
            draft.public_password = variables.data.public_password;
          }
          if (variables.data.public_expiry_date !== undefined) {
            draft.public_expiry_date = variables.data.public_expiry_date;
          }
        });
      });
    }
  });
};
