import { BusterDashboardResponse } from '@/api/asset_interfaces';
import { useRef, useState } from 'react';
import { useBusterWebSocket } from '../../BusterWebSocket';
import { useDashboardLists } from '../useDashboardLists';
import { useDashboardAssosciations } from './useDashboardAssosciations';
import { useDashboardUpdateConfig } from './useDashboardUpdateConfig';
import { useDashboardSubscribe } from './useDashboardSubscribe';
import { useDashboardCreate } from './useDashboardCreate';
import { useShareDashboard } from './useShareDashboard';

export const useDashboardIndividual = ({
  refreshDashboardsList,
  setDashboardsList,
  openedDashboardId,
  updateDashboardNameInList
}: {
  openedDashboardId: string;
  refreshDashboardsList: ReturnType<typeof useDashboardLists>['refreshDashboardsList'];
  setDashboardsList: ReturnType<typeof useDashboardLists>['setDashboardsList'];
  updateDashboardNameInList: ReturnType<typeof useDashboardLists>['updateDashboardNameInList'];
}) => {
  const busterSocket = useBusterWebSocket();

  const [dashboards, setDashboard] = useState<Record<string, BusterDashboardResponse>>({});

  const dashboardsSubscribed = useRef<Record<string, boolean>>({});

  const { subscribeToDashboard, refreshDashboard, unSubscribeToDashboard } = useDashboardSubscribe({
    dashboardsSubscribed,
    setDashboard
  });

  const { onShareDashboard } = useShareDashboard();

  const { onUpdateDashboard, onUpdateDashboardConfig, onVerifiedDashboard } =
    useDashboardUpdateConfig({
      dashboards,
      openedDashboardId,
      setDashboard,
      updateDashboardNameInList
    });

  const {
    removeItemFromIndividualDashboard,
    onAddToCollection,
    onRemoveFromCollection,
    onBulkAddRemoveToDashboard,
    onDeleteDashboard
  } = useDashboardAssosciations({ openedDashboardId, setDashboard, setDashboardsList });

  const { onCreateNewDashboard, creatingDashboard } = useDashboardCreate({
    refreshDashboardsList,
    onUpdateDashboard
  });

  return {
    dashboards,
    onRemoveFromCollection,
    onShareDashboard,
    removeItemFromIndividualDashboard,
    onBulkAddRemoveToDashboard,
    refreshDashboard,
    onVerifiedDashboard,
    openedDashboardId,
    creatingDashboard,
    onCreateNewDashboard,
    onDeleteDashboard,
    subscribeToDashboard,
    unSubscribeToDashboard,
    onUpdateDashboard,
    onUpdateDashboardConfig,
    onAddToCollection
  };
};
