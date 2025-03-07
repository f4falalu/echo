import { queryKeys } from '@/api/query_keys';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { BusterRoutes } from '@/routes/busterRoutes';
import { useMemoizedFn } from 'ahooks';
import { useSocketQueryMutation } from '@/api/buster_socket_query';
import { useQueryClient } from '@tanstack/react-query';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';

export const useDashboardCreate = ({}: {}) => {
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const queryClient = useQueryClient();
  const { mutateAsync: deleteDashboard, isPending: isDeletingDashboard } = useSocketQueryMutation({
    emitEvent: '/dashboards/delete',
    responseEvent: '/dashboards/delete:deleteDashboard',
    options: queryKeys.dashboardGetList({}),
    preCallback: (currentData, variables) => {
      return currentData?.filter((t) => !variables.ids.includes(t.id)) || [];
    }
  });
  const { openConfirmModal } = useBusterNotifications();

  const { mutateAsync: createDashboard, isPending: isCreatingDashboard } = useSocketQueryMutation({
    emitEvent: '/dashboards/post',
    responseEvent: '/dashboards/post:postDashboard',
    callback: (newData, currentData, variables) => {
      const dashboardId = newData.dashboard.id;
      const options = queryKeys.dashboardGetDashboard(dashboardId);
      queryClient.setQueryData(options.queryKey, newData);
      return currentData;
    }
  });

  const onCreateNewDashboard = useMemoizedFn(
    async (newDashboard: {
      name?: string;
      description?: string | null;
      rerouteToDashboard?: boolean;
    }) => {
      if (isCreatingDashboard) {
        return;
      }
      const { rerouteToDashboard, ...rest } = newDashboard;

      const res = await createDashboard({ ...rest, name: rest.name || '' });

      if (rerouteToDashboard) {
        onChangePage({
          route: BusterRoutes.APP_DASHBOARD_ID,
          dashboardId: res.dashboard.id
        });
      }

      return res.dashboard;
    }
  );

  const onDeleteDashboard = useMemoizedFn(
    async (dashboardId: string | string[], ignoreConfirm?: boolean) => {
      const method = () => {
        const ids = typeof dashboardId === 'string' ? [dashboardId] : dashboardId;
        deleteDashboard({ ids });
      };
      if (ignoreConfirm) {
        return method();
      }
      return await openConfirmModal({
        title: 'Delete Dashboard',
        content: 'Are you sure you want to delete this dashboard?',
        onOk: () => {
          method();
        },
        useReject: true
      });
    }
  );

  return {
    onCreateNewDashboard,
    isCreatingDashboard,
    onDeleteDashboard,
    isDeletingDashboard
  };
};
