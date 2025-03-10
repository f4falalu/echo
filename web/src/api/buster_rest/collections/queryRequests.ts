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

export const useGetCollectionsList = (filters: GetCollectionListParams) => {
  return useQuery({
    ...collectionQueryKeys.collectionsGetList(filters),
    queryFn: () => collectionsGetList(filters)
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
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: collectionsDeleteCollection,
    onMutate: (variables) => {
      const queryKey = collectionQueryKeys.collectionsGetList().queryKey;
      queryClient.setQueryData(queryKey, (v) => {
        return v?.filter((c) => !variables.ids.includes(c.id));
      });
    }
  });
};
