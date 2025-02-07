'use client';

import React, { PropsWithChildren, useEffect, useMemo, useState } from 'react';
import { BusterMetricListItem, VerificationStatus } from '@/api/asset_interfaces';
import isEmpty from 'lodash/isEmpty';
import { useBusterWebSocket } from '../../BusterWebSocket';
import { useMemoizedFn, useThrottleFn } from 'ahooks';
import { createFilterRecord, metricsArrayToRecord } from './helpers';
import {
  createContext,
  useContextSelector,
  ContextSelector
} from '@fluentui/react-context-selector';

interface IMetricsList {
  fetching: boolean;
  fetched: boolean;
  fetchedAt: number;
  metricListIds: string[];
}

const useMetricsList = () => {
  const busterSocket = useBusterWebSocket();

  const [metricsList, setMetricsList] = useState<Record<string, BusterMetricListItem>>({});
  const [metricListIds, setMetricListIds] = useState<Record<string, IMetricsList>>({});

  const _onInitializeListMetrics = useMemoizedFn(
    (metrics: BusterMetricListItem[], filters: VerificationStatus[], admin_view: boolean) => {
      const newMetrics = metricsArrayToRecord(metrics);
      const filterKey = createFilterRecord({ filters, admin_view });

      setMetricsList((prev) => ({
        ...prev,
        ...newMetrics
      }));

      setMetricListIds((prev) => ({
        ...prev,
        [filterKey]: {
          fetching: false,
          fetched: true,
          fetchedAt: Date.now(),
          metricListIds: Object.keys(newMetrics)
        }
      }));
    }
  );

  const onUpdateMetricListItem = useMemoizedFn(
    (newMetric: Partial<BusterMetricListItem> & { id: string }) => {
      setMetricsList((prevMetrics) => {
        return {
          ...prevMetrics,
          [newMetric.id]: {
            ...prevMetrics[newMetric.id],
            ...newMetric
          }
        };
      });
    }
  );

  const removeItemFromMetricsList = useMemoizedFn(({ metricId }: { metricId: string }) => {
    setMetricListIds((prevMetricListIds) => {
      const newMetricListIds = { ...prevMetricListIds };
      Object.keys(newMetricListIds).forEach((key) => {
        newMetricListIds[key] = {
          ...newMetricListIds[key],
          metricListIds: newMetricListIds[key].metricListIds.filter((id) => id !== metricId)
        };
      });
      return newMetricListIds;
    });
  });

  const _getMetricsList = useMemoizedFn(
    ({ filters, admin_view }: { admin_view: boolean; filters?: VerificationStatus[] }) => {
      const recordKey = createFilterRecord({ filters, admin_view });

      if (metricListIds[recordKey]?.fetching) {
        return;
      }

      setMetricListIds((prev) => {
        const foundRecord = prev[recordKey];
        return {
          ...prev,
          [recordKey]: {
            fetching: true,
            metricListIds: foundRecord?.metricListIds || [],
            fetched: foundRecord?.fetched || false,
            fetchedAt: foundRecord?.fetchedAt || 0
          }
        };
      });

      const status = isEmpty(filters) ? null : filters!;

      return busterSocket.emitAndOnce({
        emitEvent: {
          route: '/metrics/list',
          payload: {
            page_token: 0,
            page_size: 3000, //TODO: make a pagination
            admin_view,
            status
          }
        },
        responseEvent: {
          route: '/metrics/list:getMetricList',
          callback: (v) => _onInitializeListMetrics(v, filters || [], admin_view)
        }
      });
    }
  );

  const { run: getMetricsList } = useThrottleFn(_getMetricsList, { wait: 350, leading: true });

  return {
    metricListIds,
    metricsList,
    getMetricsList,
    removeItemFromMetricsList,
    onUpdateMetricListItem
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
  const filterRecord = useMemo(() => createFilterRecord(params), [params]);
  const metricListIds = useBusterMetricsListContextSelector((x) => x.metricListIds);
  const metricsList = useBusterMetricsListContextSelector((x) => x.metricsList);

  const getMetricsList = useBusterMetricsListContextSelector((x) => x.getMetricsList);

  const assosciatedMetricList: IMetricsList = useMemo(() => {
    const listIds: IMetricsList | undefined = metricListIds[createFilterRecord(params)];
    return (
      listIds || {
        fetching: false,
        fetched: false,
        fetchedAt: 0,
        metricListIds: []
      }
    );
  }, [metricListIds, metricsList, filterRecord]);

  const list = useMemo(() => {
    return assosciatedMetricList.metricListIds.map((id) => metricsList[id]);
  }, [assosciatedMetricList.metricListIds, metricsList]);

  useEffect(() => {
    const wasFetchedMoreThanXSecondsAgo =
      Date.now() - (assosciatedMetricList?.fetchedAt || 0) > 3500;

    if (
      (!assosciatedMetricList.fetched || wasFetchedMoreThanXSecondsAgo) &&
      !assosciatedMetricList?.fetching
    ) {
      getMetricsList(params);
    }
  }, [filterRecord]);

  return { list, fetched: assosciatedMetricList.fetched, fetching: assosciatedMetricList.fetching };
};
