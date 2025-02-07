import type { BusterDashboardResponse } from '@/api/asset_interfaces';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useMemoizedFn } from 'ahooks';
import React from 'react';
import { useBusterDashboardListContextSelector } from '../DashboardListProvider/DashboardListProvider';

export const useDashboardAssosciations = ({
  setDashboard
}: {
  setDashboard: React.Dispatch<React.SetStateAction<Record<string, BusterDashboardResponse>>>;
}) => {
  const busterSocket = useBusterWebSocket();
  const { openConfirmModal } = useBusterNotifications();
  const removeItemFromDashboardsList = useBusterDashboardListContextSelector(
    (state) => state.removeItemFromDashboardsList
  );

  const onAddToCollection = useMemoizedFn(
    async ({
      dashboardId,
      collectionId
    }: {
      collectionId: string | string[];
      dashboardId: string;
    }) => {
      busterSocket.emit({
        route: '/dashboards/update',
        payload: {
          add_to_collections: typeof collectionId === 'string' ? [collectionId] : collectionId,
          id: dashboardId
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
      dashboardId: string;
    }) => {
      busterSocket.emit({
        route: '/dashboards/update',
        payload: {
          remove_from_collections: typeof collectionId === 'string' ? [collectionId] : collectionId,
          id: dashboardId
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
        removeItemFromDashboardsList({ dashboardId });
        const ids = typeof dashboardId === 'string' ? [dashboardId] : dashboardId;
        busterSocket.emit({
          route: '/dashboards/delete',
          payload: { ids }
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
