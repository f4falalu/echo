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
    (
      newDashboard: BusterDashboardResponse & {
        status?: VerificationStatus;
      }
    ) => {
      const oldDashboard = dashboards[newDashboard.dashboard.id];
      if (isEqual(oldDashboard, newDashboard)) {
        return;
      }

      busterSocket.emit({
        route: '/dashboards/update',
        payload: {
          id: newDashboard.dashboard.id,
          description: newDashboard.dashboard.description,
          title: newDashboard.dashboard.title,
          config: newDashboard.dashboard.config
        }
      });
    }
  );

  const onUpdateDashboardRequest = useMemoizedFn(
    (newDashboard: Partial<BusterDashboardResponse>, dashboardId: string) => {
      const newDashboardState: BusterDashboardResponse = {
        ...dashboards[dashboardId],
        ...newDashboard
      };
      setDashboard((prevDashboards) => {
        return {
          ...prevDashboards,
          [dashboardId]: newDashboardState
        };
      });
      _updateDashboardResponseToServer(newDashboardState);
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

      onUpdateDashboardRequest(newDashboardState, id);
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
      onUpdateDashboardRequest(newDashboardState, dashboardId);
    }
  );

  const onVerifiedDashboard = useMemoizedFn(
    async ({ dashboardId, status }: { dashboardId: string; status: VerificationStatus }) => {
      await _updateDashboardResponseToServer({
        ...dashboards[dashboardId],
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
