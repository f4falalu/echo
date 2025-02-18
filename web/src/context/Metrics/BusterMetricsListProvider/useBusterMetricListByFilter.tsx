'use client';

import React, { useMemo } from 'react';
import { VerificationStatus } from '@/api/asset_interfaces';
import { useSocketQueryEmitOn } from '@/api/buster_socket_query';
import { queryKeys } from '@/api/query_keys';

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
  } = useSocketQueryEmitOn({
    emitEvent: {
      route: '/metrics/list',
      payload: {
        page_token: 0,
        page_size: 3000, //TODO: make a pagination,
        ...metricListFilters
      }
    },
    responseEvent: '/metrics/list:getMetricList',
    options: queryKeys.metricsGetList()
  });

  return {
    metricList,
    isFetching,
    isFetched
  };
};
