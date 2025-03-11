import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTerm, deleteTerms, getTerm, getTermsList, updateTerm } from './requests';
import { TermsListParams } from '@/api/request_interfaces/terms';
import { queryKeys } from '@/api/query_keys';
import { BusterTerm } from '@/api/asset_interfaces/terms';
import { useMemo } from 'react';

export const useGetTermsList = (params?: Omit<TermsListParams, 'page' | 'page_size'>) => {
  const compiledParams: TermsListParams = useMemo(
    () => ({ page: 0, page_size: 3000, ...params }),
    [params]
  );

  return useQuery({
    ...queryKeys.termsGetList,
    queryFn: () => getTermsList(compiledParams)
  });
};

export const useGetTerm = (id: string) => {
  return useQuery({
    ...queryKeys.termsGetTerm(id),
    queryFn: () => getTerm(id)
  });
};

export const useCreateTerm = () => {
  return useMutation({
    mutationFn: createTerm
  });
};

export const useUpdateTerm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateTerm,
    onMutate: (params) => {
      const options = queryKeys.termsGetTerm(params.id);
      const previousTerm = queryClient.getQueryData(options.queryKey);
      if (previousTerm) {
        const newTerm: BusterTerm = {
          ...previousTerm,
          ...params
        };
        queryClient.setQueryData(options.queryKey, newTerm);
      }
    }
  });
};

export const useDeleteTerm = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTerms,
    onSuccess: (data) => {
      const options = queryKeys.termsGetList;
      queryClient.invalidateQueries({ queryKey: options.queryKey });
    }
  });
};
