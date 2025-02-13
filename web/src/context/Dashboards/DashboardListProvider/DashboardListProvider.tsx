import type { BusterDashboardListItem } from '@/api/asset_interfaces';
import { useMemoizedFn, useThrottleFn } from 'ahooks';
import { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { useBusterWebSocket } from '../../BusterWebSocket';
import type { DashboardListFilters } from './interfaces';
import {
  createContext,
  useContextSelector,
  ContextSelector
} from '@fluentui/react-context-selector';
import React from 'react';
import { createFilterRecord, dashboardsArrayToRecord } from './helper';

interface IDashboardsList {
  fetching: boolean;
  fetched: boolean;
  fetchedAt: number;
  dashboardListIds: string[];
}

export const useDashboardLists = () => {
  const busterSocket = useBusterWebSocket();

  const [dashboardsList, setDashboardsList] = useState<Record<string, BusterDashboardListItem>>({});
  const [dashboardListIds, setDashboardListIds] = useState<Record<string, IDashboardsList>>({});

  //STATE UPDATERS
  const onInitializeDashboardsList = (
    dashboards: BusterDashboardListItem[],
    filters?: DashboardListFilters
  ) => {
    const newDashboards = dashboardsArrayToRecord(dashboards);
    const filterKey = createFilterRecord(filters);

    setDashboardsList(newDashboards);
    setDashboardListIds((prev) => ({
      ...prev,
      [filterKey]: {
        fetching: false,
        fetched: true,
        fetchedAt: Date.now(),
        dashboardListIds: Object.keys(newDashboards)
      }
    }));
  };

  // LISTENERS

  const _getDashboardsList = useMemoizedFn((filters?: DashboardListFilters) => {
    const recordKey = createFilterRecord(filters);

    if (dashboardListIds[recordKey]?.fetching) {
      return;
    }

    setDashboardListIds((prev) => {
      const foundRecord = prev[recordKey];
      return {
        ...prev,
        [recordKey]: {
          fetching: true,
          dashboardListIds: foundRecord?.dashboardListIds || [],
          fetched: foundRecord?.fetched || false,
          fetchedAt: foundRecord?.fetchedAt || 0
        }
      };
    });

    return busterSocket.emitAndOnce({
      emitEvent: {
        route: '/dashboards/list',
        payload: {
          page_token: 0,
          page_size: 3000, //TODO: make a pagination
          ...filters
        }
      },
      responseEvent: {
        route: '/dashboards/list:getDashboardsList',
        callback: (v) => onInitializeDashboardsList(v, filters)
      }
    });
  });

  //ACTIONS

  const onUpdateDashboardListItem = useMemoizedFn(
    (newDashboard: Partial<BusterDashboardListItem> & { id: string }) => {
      setDashboardsList((prevDashboards) => {
        return {
          ...prevDashboards,
          [newDashboard.id]: {
            ...prevDashboards[newDashboard.id],
            ...newDashboard
          }
        };
      });
    }
  );

  const removeItemFromDashboardsList = useMemoizedFn(
    ({ dashboardId }: { dashboardId: string | string[] }) => {
      setDashboardListIds((prevDashboardListIds) => {
        const newDashboardListIds = { ...prevDashboardListIds };
        const dashboardIds = Array.isArray(dashboardId) ? dashboardId : [dashboardId];

        Object.keys(newDashboardListIds).forEach((key) => {
          newDashboardListIds[key] = {
            ...newDashboardListIds[key],
            dashboardListIds: newDashboardListIds[key].dashboardListIds.filter(
              (id) => !dashboardIds.includes(id)
            )
          };
        });
        return newDashboardListIds;
      });
    }
  );

  const { run: getDashboardsList } = useThrottleFn(_getDashboardsList, {
    wait: 350,
    leading: true
  });

  return {
    dashboardListIds,
    dashboardsList,
    getDashboardsList,
    onUpdateDashboardListItem
  };
};

const BusterDashboardList = createContext<ReturnType<typeof useDashboardLists>>(
  {} as ReturnType<typeof useDashboardLists>
);

export const BusterDashboardListProvider: React.FC<PropsWithChildren> = React.memo(
  ({ children }) => {
    const dashboardContext = useDashboardLists();

    return (
      <BusterDashboardList.Provider value={dashboardContext}>
        {children}
      </BusterDashboardList.Provider>
    );
  }
);
BusterDashboardListProvider.displayName = 'BusterDashboardListProvider';

export const useBusterDashboardListContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useDashboardLists>, T>
) => useContextSelector(BusterDashboardList, selector);

export const useBusterDashboardListByFilter = (filters: DashboardListFilters) => {
  const filterRecord = useMemo(() => createFilterRecord(filters), [filters]);
  const dashboardListIds = useBusterDashboardListContextSelector((x) => x.dashboardListIds);
  const dashboardsListItems = useBusterDashboardListContextSelector((x) => x.dashboardsList);
  const getDashboardsList = useBusterDashboardListContextSelector((x) => x.getDashboardsList);

  const assosciatedDashboardList: IDashboardsList = useMemo(() => {
    const listIds: IDashboardsList | undefined = dashboardListIds[createFilterRecord(filters)];
    return (
      listIds || {
        fetching: false,
        fetched: false,
        fetchedAt: 0,
        dashboardListIds: []
      }
    );
  }, [dashboardListIds, dashboardsListItems, filterRecord]);

  const list = useMemo(() => {
    return assosciatedDashboardList.dashboardListIds.map((id) => dashboardsListItems[id]);
  }, [assosciatedDashboardList.dashboardListIds, dashboardsListItems]);

  useEffect(() => {
    const wasFetchedMoreThanXSecondsAgo =
      Date.now() - (assosciatedDashboardList?.fetchedAt || 0) > 3500;

    if (
      (!assosciatedDashboardList.fetched || wasFetchedMoreThanXSecondsAgo) &&
      !assosciatedDashboardList?.fetching
    ) {
      getDashboardsList(filters);
    }
  }, [filterRecord]);

  return {
    list,
    fetched: assosciatedDashboardList.fetched,
    fetching: assosciatedDashboardList.fetching
  };
};
