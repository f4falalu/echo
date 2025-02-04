'use client';

import React, { PropsWithChildren, useEffect, useMemo, useRef, useState } from 'react';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { BusterMetricListItem, VerificationStatus } from '@/api/asset_interfaces';
import isEmpty from 'lodash/isEmpty';
import { useBusterWebSocket } from '../BusterWebSocket';
import { useParams } from 'next/navigation';
import { BusterRoutes } from '@/routes';
import { useMemoizedFn, useThrottleFn } from 'ahooks';
import { createFilterRecord, metricsArrayToRecord } from './helpers';
import {
  createContext,
  useContextSelector,
  ContextSelector
} from '@fluentui/react-context-selector';
import { useBusterMetricsContextSelector } from './BusterMetricsProvider';

const useMetricsList = () => {
  const { metricId: openedMetricId } = useParams<{ metricId: string }>();
  const busterSocket = useBusterWebSocket();
  const onChangePage = useAppLayoutContextSelector((s) => s.onChangePage);
  const getMetric = useBusterMetricsContextSelector((x) => x.getMetricNotLiveDataMethodOnly);
  const onUpdateMetric = useBusterMetricsContextSelector((x) => x.onUpdateMetric);

  const [metricsList, setMetricsList] = useState<Record<string, BusterMetricListItem>>({});
  const [metricListIds, setMetricListIds] = useState<Record<string, string[]>>({});
  const loadedMetricList = useRef<
    Record<
      string, //filters
      {
        loading: boolean;
        fetched: boolean;
        fetchedAt: number | null;
      }
    >
  >({});

  const _onInitializeMetrics = useMemoizedFn(
    (metrics: BusterMetricListItem[], filters: VerificationStatus[], admin_view: boolean) => {
      const newMetrics = metricsArrayToRecord(metrics);
      const filterKey = createFilterRecord({ filters, admin_view });

      loadedMetricList.current = {
        ...loadedMetricList.current,
        [filterKey]: {
          loading: false,
          fetched: true,
          fetchedAt: Date.now()
        }
      };

      setMetricsList((prev) => ({
        ...prev,
        ...newMetrics
      }));

      setMetricListIds((prev) => ({
        ...prev,
        [filterKey]: Object.keys(newMetrics)
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
    setMetricsList((prevMetrics) => {
      const newMetrics = { ...prevMetrics };
      delete newMetrics[metricId];
      return newMetrics;
    });
    setMetricListIds((prevMetricListIds) => {
      const newMetricListIds = { ...prevMetricListIds };
      Object.keys(newMetricListIds).forEach((key) => {
        newMetricListIds[key] = newMetricListIds[key].filter((id) => id !== metricId);
      });
      return newMetricListIds;
    });
  });

  const onOpenMetric = useMemoizedFn((metricId: string) => {
    const metric = getMetric({ metricId });
    if (!metric) {
      const metricListItem = metricsList[metricId]!;
      onUpdateMetric({
        id: metricId,
        title: metricListItem.title
      });
    }
    onChangePage({
      route: BusterRoutes.APP_METRIC_ID,
      metricId: metricId
    });
  });

  const _getMetricsList = useMemoizedFn(
    ({ filters, admin_view }: { admin_view: boolean; filters?: VerificationStatus[] }) => {
      const recordKey = createFilterRecord({ filters, admin_view });

      if (loadedMetricList.current[recordKey]?.loading) {
        return;
      }

      loadedMetricList.current = {
        ...loadedMetricList.current,
        [recordKey]: {
          loading: true,
          fetched: loadedMetricList.current[recordKey]?.fetched || false,
          fetchedAt: loadedMetricList.current[recordKey]?.fetchedAt || null
        }
      };

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
          callback: (v) => _onInitializeMetrics(v, filters || [], admin_view)
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
    openedMetricId,
    onOpenMetric,
    onUpdateMetricListItem,
    loadedMetricList
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
  const allMetricListLoadingStatus = useBusterMetricsListContextSelector(
    (x) => x.loadedMetricList.current
  );
  const metricListLoadingStatus = allMetricListLoadingStatus[filterRecord];
  const getMetricsList = useBusterMetricsListContextSelector((x) => x.getMetricsList);

  const list = useMemo(() => {
    const listIds = metricListIds[createFilterRecord(params)] || [];
    return listIds.map((id) => metricsList[id]);
  }, [metricListIds, metricsList, filterRecord]);

  useEffect(() => {
    const wasFetchedMoreThanXSecondsAgo =
      Date.now() - (metricListLoadingStatus?.fetchedAt || 0) > 2000;
    if (
      (!metricListLoadingStatus?.fetched || wasFetchedMoreThanXSecondsAgo) &&
      !metricListLoadingStatus?.loading
    ) {
      getMetricsList(params);
    }
  }, [getMetricsList, filterRecord]);

  return { list, metricListLoadingStatus };
};
