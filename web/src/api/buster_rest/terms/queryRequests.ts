import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTerm, deleteTerms, getTerm, getTermsList, updateTerm } from './requests';
import { TermsListParams } from '@/api/request_interfaces/terms';
import { queryKeys } from '@/api/query_keys';
import { BusterTerm } from '@/api/asset_interfaces/terms';

export const useGetTermsList = (params: TermsListParams) => {
  return useQuery({
    ...queryKeys.termsGetList,
    queryFn: () => getTermsList(params)
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
