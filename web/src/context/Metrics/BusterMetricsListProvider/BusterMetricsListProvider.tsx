'use client';

import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { VerificationStatus } from '@/api/asset_interfaces';
import {
  createContext,
  useContextSelector,
  ContextSelector
} from '@fluentui/react-context-selector';
import { useSocketQueryEmitOn } from '@/api/buster_socket_query';
import { queryKeys } from '@/api/query_keys';

interface IMetricsList {
  fetching: boolean;
  fetched: boolean;
  fetchedAt: number;
  metricListIds: string[];
}

const useMetricsList = () => {
  const [metricListFilters, setMetricListFilters] = useState<{
    filters?: VerificationStatus[];
    admin_view: boolean;
  }>({ filters: undefined, admin_view: false });

  const { data: metricList, isFetching: fetchingMetricList } = useSocketQueryEmitOn(
    {
      route: '/metrics/list',
      payload: {
        page_token: 0,
        page_size: 3000, //TODO: make a pagination,
        ...metricListFilters
      }
    },
    '/metrics/list:getMetricList',
    queryKeys['/metrics/list:getMetricsList']()
  );

  return {
    metricList,
    metricListFilters,
    fetchingMetricList,
    setMetricListFilters
  };
};

const BusterMetricsList = createContext<ReturnType<typeof useMetricsList>>(
  {} as ReturnType<typeof useMetricsList>
);

export const BusterMetricsListProvider: React.FC<PropsWithChildren> = React.memo(({ children }) => {
  const metricsContext = useMetricsList();

  return <BusterMetricsList.Provider value={metricsContext}>{children}</BusterMetricsList.Provider>;
});
BusterMetricsListProvider.displayName = 'BusterMetricsListProvider';

export const useBusterMetricsListContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useMetricsList>, T>
) => {
  return useContextSelector(BusterMetricsList, selector);
};

export const useBusterMetricListByFilter = (params: {
  filters: VerificationStatus[];
  admin_view: boolean;
}) => {
  const metricListFilters = useMemo(
    () => ({
      filters: params.filters,
      admin_view: params.admin_view
    }),
    [params.filters.join(','), params.admin_view]
  );

  const {
    data: metricList,
    isFetching,
    isFetched
  } = useSocketQueryEmitOn(
    {
      route: '/metrics/list',
      payload: {
        page_token: 0,
        page_size: 3000, //TODO: make a pagination,
        ...metricListFilters
      }
    },
    '/metrics/list:getMetricList',
    queryKeys['/metrics/list:getMetricsList']()
  );

  return {
    metricList,
    isFetching,
    isFetched
  };
};
