import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/api/query_keys';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useMemoizedFn } from '@/hooks';
import type {
  InitiateOAuthRequest,
  UpdateIntegrationRequest
} from '@buster/server-shared/slack';
import {
  initiateSlackOAuth,
  getSlackIntegration,
  removeSlackIntegration,
  updateSlackIntegration,
  getSlackChannels
} from './request';

// GET /api/v2/slack/integration
export const useGetSlackIntegration = (enabled = true) => {
  return useQuery({
    ...queryKeys.slackGetIntegration,
    queryFn: getSlackIntegration,
    enabled
  });
};

// GET /api/v2/slack/channels
export const useGetSlackChannels = (enabled = true) => {
  return useQuery({
    ...queryKeys.slackGetChannels,
    queryFn: getSlackChannels,
    enabled
  });
};

// POST /api/v2/slack/auth/init
export const useInitiateSlackOAuth = () => {
  return useMutation({
    mutationFn: initiateSlackOAuth
  });
};

// PUT /api/v2/slack/integration
export const useUpdateSlackIntegration = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateSlackIntegration,
    onSuccess: () => {
      // Invalidate the integration query to refetch the updated data
      queryClient.invalidateQueries({
        queryKey: queryKeys.slackGetIntegration.queryKey,
        refetchType: 'all'
      });
    }
  });
};

// DELETE /api/v2/slack/integration
export const useRemoveSlackIntegration = () => {
  const queryClient = useQueryClient();
  const { openConfirmModal } = useBusterNotifications();

  const mutationFn = useMemoizedFn(
    async ({ ignoreConfirm = false }: { ignoreConfirm?: boolean } = {}) => {
      const method = async () => {
        return await removeSlackIntegration();
      };

      if (ignoreConfirm) {
        return method();
      }

      return openConfirmModal({
        title: 'Remove Slack Integration',
        content: 'Are you sure you want to remove the Slack integration? This will disconnect your workspace from Slack.',
        primaryButtonProps: {
          text: 'Remove'
        },
        onOk: method
      });
    }
  );

  return useMutation({
    mutationFn,
    onSuccess: () => {
      // Invalidate both integration and channels queries
      queryClient.invalidateQueries({
        queryKey: queryKeys.slackGetIntegration.queryKey,
        refetchType: 'all'
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.slackGetChannels.queryKey,
        refetchType: 'all'
      });
    }
  });
};
