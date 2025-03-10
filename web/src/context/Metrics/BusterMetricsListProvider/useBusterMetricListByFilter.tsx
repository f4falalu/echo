'use client';

import React, { useMemo } from 'react';
import { VerificationStatus } from '@/api/asset_interfaces/share';
import { type ListMetricsParams, useGetMetricsList } from '@/api/buster_rest/metrics';

export const useBusterMetricListByFilter = (params: {
  filters: VerificationStatus[];
  admin_view: boolean;
}) => {
  const metricListFilters: ListMetricsParams = useMemo(
    () => ({
      filters: params.filters,
      admin_view: params.admin_view,
      page_token: 0,
      page_size: 3000
    }),
    [params.filters.join(','), params.admin_view]
  );

  const { data: metricList, isFetching, isFetched } = useGetMetricsList(metricListFilters);

  return {
    metricList,
    isFetching,
    isFetched
  };
};
