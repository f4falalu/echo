import type {
  BusterDashboard,
  BusterDashboardResponse,
  VerificationStatus
} from '@/api/asset_interfaces';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useMemoizedFn } from 'ahooks';
import isEqual from 'lodash/isEqual';
import React from 'react';

export const useDashboardUpdateConfig = ({
  dashboards,
  setDashboard
}: {
  dashboards: Record<string, BusterDashboardResponse>;
  setDashboard: React.Dispatch<React.SetStateAction<Record<string, BusterDashboardResponse>>>;
}) => {
  const busterSocket = useBusterWebSocket();

  const _updateDashboardResponseToServer = useMemoizedFn(
    (newDashboard: Partial<BusterDashboardResponse>, dashboardId: string) => {
      const newDashboardState: BusterDashboardResponse = {
        ...dashboards[dashboardId],
        ...newDashboard
      };

      const oldDashboard = dashboards[dashboardId];
      if (isEqual(oldDashboard, newDashboard)) {
        return;
      }

      setDashboard((prevDashboards) => {
        return {
          ...prevDashboards,
          [dashboardId]: newDashboardState
        };
      });

      busterSocket.emit({
        route: '/dashboards/update',
        payload: {
          id: dashboardId,
          description: newDashboardState.dashboard.description,
          title: newDashboardState.dashboard.title,
          config: newDashboardState.dashboard.config
        }
      });
    }
  );

  const onUpdateDashboard = useMemoizedFn(
    (newDashboard: Partial<BusterDashboard> & { id: string }) => {
      const id = newDashboard.id;
      const currentDashboard = dashboards[id] || {};
      const newDashboardState = {
        ...currentDashboard,
        dashboard: {
          ...currentDashboard.dashboard,
          ...newDashboard
        }
      };

      _updateDashboardResponseToServer(newDashboardState, id);
    }
  );

  const onUpdateDashboardConfig = useMemoizedFn(
    (newDashboard: Partial<BusterDashboard['config']>, dashboardId: string) => {
      const newDashboardState = {
        ...dashboards[dashboardId],
        dashboard: {
          ...dashboards[dashboardId].dashboard,
          config: {
            ...dashboards[dashboardId].dashboard.config,
            ...newDashboard
          }
        }
      };
      _updateDashboardResponseToServer(newDashboardState, dashboardId);
    }
  );

  const onVerifiedDashboard = useMemoizedFn(
    async ({ dashboardId, status }: { dashboardId: string; status: VerificationStatus }) => {
      return onUpdateDashboard({
        id: dashboardId,
        status
      });
    }
  );

  return {
    onUpdateDashboardConfig,
    onUpdateDashboard,
    onVerifiedDashboard
  };
};
