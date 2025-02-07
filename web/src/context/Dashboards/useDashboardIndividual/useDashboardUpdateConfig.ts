import type {
  BusterDashboard,
  BusterDashboardResponse,
  VerificationStatus
} from '@/api/asset_interfaces';
import { useBusterWebSocket } from '@/context/BusterWebSocket';
import { useMemoizedFn } from 'ahooks';
import isEqual from 'lodash/isEqual';
import { useDashboardLists } from '../useDashboardLists';
import React from 'react';

export const useDashboardUpdateConfig = ({
  dashboards,
  openedDashboardId,
  setDashboard,
  updateDashboardNameInList
}: {
  dashboards: Record<string, BusterDashboardResponse>;
  openedDashboardId: string;
  setDashboard: React.Dispatch<React.SetStateAction<Record<string, BusterDashboardResponse>>>;
  updateDashboardNameInList: ReturnType<typeof useDashboardLists>['updateDashboardNameInList'];
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
    (newDashboard: Partial<BusterDashboardResponse>) => {
      const newDashboardState: BusterDashboardResponse = {
        ...dashboards[openedDashboardId],
        ...newDashboard
      };
      setDashboard((prevDashboards) => {
        return {
          ...prevDashboards,
          [openedDashboardId]: newDashboardState
        };
      });
      _updateDashboardResponseToServer(newDashboardState);
    }
  );

  const onUpdateDashboard = useMemoizedFn((newDashboard: Partial<BusterDashboard>) => {
    const id = newDashboard?.id || openedDashboardId;
    const currentDashboard = dashboards[id] || {};
    const newDashboardState = {
      ...currentDashboard,
      dashboard: {
        ...currentDashboard.dashboard,
        ...newDashboard
      }
    };
    const didTitleChange =
      newDashboard.title && newDashboard.title !== currentDashboard.dashboard.title;

    onUpdateDashboardRequest(newDashboardState);

    if (didTitleChange) {
      const newName = newDashboard.title || currentDashboard.dashboard.title;
      updateDashboardNameInList(id, newName);
    }
  });

  const onUpdateDashboardConfig = useMemoizedFn(
    (newDashboard: Partial<BusterDashboard['config']>, dashboardId?: string) => {
      const id = dashboardId || openedDashboardId;
      const newDashboardState = {
        ...dashboards[id],
        dashboard: {
          ...dashboards[id].dashboard,
          config: {
            ...dashboards[id].dashboard.config,
            ...newDashboard
          }
        }
      };
      onUpdateDashboardRequest(newDashboardState);
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
