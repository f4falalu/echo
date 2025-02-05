import type { BusterDashboardListItem, BusterDashboardResponse } from '@/api/asset_interfaces';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useMemoizedFn } from 'ahooks';
import React from 'react';

export const useDashboardAssosciations = ({
  openedDashboardId,
  setDashboard,
  setDashboardsList
}: {
  openedDashboardId: string;
  setDashboard: React.Dispatch<React.SetStateAction<Record<string, BusterDashboardResponse>>>;
  setDashboardsList: React.Dispatch<React.SetStateAction<BusterDashboardListItem[]>>;
}) => {
  const busterSocket = useBusterWebSocket();
  const { openConfirmModal } = useBusterNotifications();

  const onAddToCollection = useMemoizedFn(
    async ({
      dashboardId,
      collectionId
    }: {
      collectionId: string | string[];
      dashboardId?: string;
    }) => {
      const id = dashboardId || openedDashboardId;
      busterSocket.emit({
        route: '/dashboards/update',
        payload: {
          add_to_collections: typeof collectionId === 'string' ? [collectionId] : collectionId,
          id
        }
      });
    }
  );

  const onRemoveFromCollection = useMemoizedFn(
    async ({
      dashboardId,
      collectionId
    }: {
      collectionId: string | string[];
      dashboardId?: string;
    }) => {
      const id = dashboardId || openedDashboardId;
      busterSocket.emit({
        route: '/dashboards/update',
        payload: {
          remove_from_collections: typeof collectionId === 'string' ? [collectionId] : collectionId,
          id
        }
      });
    }
  );

  const onBulkAddRemoveToDashboard = useMemoizedFn(
    async ({ metricIds, dashboardId }: { dashboardId: string; metricIds: string[] }) => {
      busterSocket.emit({
        route: '/dashboards/update',
        payload: {
          id: dashboardId,
          metrics: metricIds
        }
      });
    }
  );

  const removeItemFromIndividualDashboard = useMemoizedFn(
    ({ dashboardId, metricId }: { dashboardId: string; metricId: string }) => {
      setDashboard((prevDashboards) => {
        const dashboardResponse: BusterDashboardResponse | undefined = prevDashboards[dashboardId];
        if (!dashboardResponse) return prevDashboards;
        const newMetrics = dashboardResponse.metrics.filter((t) => t.id !== metricId);
        return {
          ...prevDashboards,
          [dashboardId]: {
            ...prevDashboards[dashboardId],
            metrics: newMetrics
          }
        };
      });
    }
  );

  const onDeleteDashboard = useMemoizedFn(
    async (dashboardId: string | string[], ignoreConfirm?: boolean) => {
      const method = () => {
        setDashboardsList((prevDashboards) => {
          return prevDashboards.filter((dashboard) => dashboard.id !== dashboardId);
        });
        const ids = typeof dashboardId === 'string' ? [dashboardId] : dashboardId;
        busterSocket.emit({
          route: '/dashboards/delete',
          payload: {
            ids
          }
        });
        setDashboardsList((prevDashboards) => {
          return prevDashboards.filter((dashboard) => !ids.includes(dashboard.id));
        });
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
    removeItemFromIndividualDashboard,
    onAddToCollection,
    onRemoveFromCollection,
    onBulkAddRemoveToDashboard,
    onDeleteDashboard
  };
};
