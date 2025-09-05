import { useMutation, useQueryClient } from '@tanstack/react-query';
import { create } from 'mutative';
import { reportsQueryKeys } from '@/api/query_keys/reports';
import { shareReport, unshareReport, updateReportShare } from '../requests';

/**
 * useShareReport
 */
export const useShareReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: shareReport,
    onMutate: ({ id, params }) => {
      const queryKey = reportsQueryKeys.reportsGetReport(id, 'LATEST').queryKey;

      queryClient.setQueryData(queryKey, (previousData) => {
        if (!previousData) return previousData;
        previousData.individual_permissions?.[0].role;
        return create(previousData, (draft) => {
          draft.individual_permissions = [
            ...params.map((p) => ({
              ...p,
              name: p.name,
              avatar_url: p.avatar_url || null,
            })),
            ...(draft.individual_permissions || []),
          ].sort((a, b) => a.email.localeCompare(b.email));
        });
      });
    },
    onSuccess: (_, variables) => {
      const partialMatchedKey = reportsQueryKeys
        .reportsGetReport(variables.id, 'LATEST')
        .queryKey.slice(0, -1);
      queryClient.invalidateQueries({
        queryKey: partialMatchedKey,
        refetchType: 'all',
      });
    },
  });
};

/**
 * useUnshareReport
 */
export const useUnshareReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unshareReport,
    onMutate: (variables) => {
      const queryKey = reportsQueryKeys.reportsGetReport(variables.id, 'LATEST').queryKey;
      queryClient.setQueryData(queryKey, (previousData) => {
        if (!previousData) return previousData;
        return create(previousData, (draft) => {
          draft.individual_permissions = (
            draft.individual_permissions?.filter((t) => !variables.data.includes(t.email)) || []
          ).sort((a, b) => a.email.localeCompare(b.email));
        });
      });
    },
  });
};

/**
 * useUpdateReportShare
 */
export const useUpdateReportShare = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: updateReportShare,
    onMutate: ({ id, params }) => {
      const queryKey = reportsQueryKeys.reportsGetReport(id, 'LATEST').queryKey;
      queryClient.setQueryData(queryKey, (previousData) => {
        if (!previousData) return previousData;
        return create(previousData, (draft) => {
          draft.individual_permissions = (
            draft.individual_permissions?.map((t) => {
              const found = params.users?.find((v) => v.email === t.email);
              if (found) return { ...t, ...found };
              return t;
            }) || []
          ).sort((a, b) => a.email.localeCompare(b.email));

          if (params.publicly_accessible !== undefined) {
            draft.publicly_accessible = params.publicly_accessible;
          }
          if (params.public_password !== undefined) {
            draft.public_password = params.public_password;
          }
          if (params.public_expiry_date !== undefined) {
            draft.public_expiry_date = params.public_expiry_date;
          }
          if (params.workspace_sharing !== undefined) {
            draft.workspace_sharing = params.workspace_sharing;
          }
        });
      });
    },
  });
};
