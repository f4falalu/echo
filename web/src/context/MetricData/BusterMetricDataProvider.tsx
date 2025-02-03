import React, { PropsWithChildren, useCallback, useState } from 'react';
import {
  createContext,
  ContextSelector,
  useContextSelector
} from '@fluentui/react-context-selector';
import { useMemoizedFn, useMount } from 'ahooks';
import { useBusterWebSocket } from '../BusterWebSocket';
import type { BusterMetricData } from '../Metrics';
import { MetricEvent_fetchingData } from '@/api/buster_socket/metrics/eventsInterfaces';
import { MOCK_DATA } from './MOCK_DATA';

const DEFAULT_MESSAGE_DATA: BusterMetricData = {
  fetched: false,
  fetching: false,
  fetchedAt: 0,
  data_metadata: null,
  code: null,
  error: null
};

const useMetricData = () => {
  const busterSocket = useBusterWebSocket();

  const [metricData, setMetricData] = useState<Record<string, BusterMetricData>>({});

  const _setMetricData = useMemoizedFn(
    (metricId: string, newMetricData: Partial<BusterMetricData>) => {
      setMetricData((prev) => ({
        ...prev,
        [metricId]: { ...prev[metricId], ...newMetricData }
      }));
    }
  );

  const _onGetFetchingData = useMemoizedFn((payload: MetricEvent_fetchingData) => {
    const { data, data_metadata, code, progress, metric_id: metricId } = payload;
    const currentMetric = getMetricData(metricId);
    const fallbackData = data || currentMetric?.data;
    const fallbackDataMetadata = data_metadata || currentMetric?.data_metadata;
    const isCompleted = progress === 'completed';

    onSetMetricData({
      metricId,
      data: fallbackData,
      data_metadata: fallbackDataMetadata,
      isDataFromRerun: false,
      fetchedData: isCompleted,
      fetchingData: !isCompleted,
      code
    });
  });

  const onSetMetricData = useMemoizedFn(
    ({
      metricId,
      data,
      data_metadata,
      isDataFromRerun,
      fetchedData,
      fetchingData,
      code
    }: {
      metricId: string;
      data: BusterMetricData['data'];
      data_metadata?: BusterMetricData['data_metadata'];
      isDataFromRerun?: boolean;
      fetchedData?: boolean;
      fetchingData?: boolean;
      code: string | null;
    }) => {
      const setKey = isDataFromRerun ? 'dataFromRerun' : 'data';
      const prev = getMetricData(metricId);
      _setMetricData(metricId, {
        [setKey]: data,
        fetchedAt: Date.now(),
        fetched: fetchedData ?? true,
        fetching: fetchingData ?? false,
        data_metadata: data_metadata ?? prev?.data_metadata,
        code
      });
    }
  );

  const onSetMetricDataCode = useMemoizedFn(
    ({ messageId, code }: { messageId: string; code: string }) => {
      _setMetricData(messageId, { code });
    }
  );

  const fetchDataByMetricId = useMemoizedFn(async ({ metricId }: { metricId: string }) => {
    const selectedMetricData = getMetricData(metricId);
    if (selectedMetricData?.fetching || selectedMetricData?.fetched) {
      return;
    }

    _setMetricData(metricId, {
      fetching: true
    });

    //TODO: remove mock data
    // _setMetricData(metricId, { ...MOCK_DATA, fetched: true });
    onSetMetricData({
      ...MOCK_DATA,
      metricId
    });

    return await busterSocket.emitAndOnce({
      emitEvent: {
        route: '/metrics/data',
        payload: { id: metricId }
      },
      responseEvent: {
        route: '/metrics/get:fetchingData',
        callback: _onGetFetchingData
      }
    });
  });

  const getMetricData = useCallback(
    (metricId: string | undefined) => {
      if (metricId && metricData[metricId]) {
        return metricData[metricId];
      }
      return DEFAULT_MESSAGE_DATA;
    },
    [metricData]
  );

  const getAllMetricDataMemoized = useMemoizedFn(
    (metricId: string): BusterMetricData | undefined => {
      return metricData[metricId];
    }
  );

  useMount(() => {
    busterSocket.on({
      route: '/metrics/get:fetchingData',
      callback: _onGetFetchingData
    });
  });

  return {
    metricData,
    onSetMetricDataCode,
    onSetMetricData,
    fetchDataByMetricId,
    getMetricData,
    getAllMetricDataMemoized
  };
};

const BusterMetricDataContext = createContext<ReturnType<typeof useMetricData>>(
  {} as ReturnType<typeof useMetricData>
);

export const BusterMetricDataProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const messageDataContext = useMetricData();

  return (
    <BusterMetricDataContext.Provider value={messageDataContext}>
      {children}
    </BusterMetricDataContext.Provider>
  );
};
BusterMetricDataProvider.displayName = 'BusterMetricDataProvider';

export const useBusterMetricDataContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useMetricData>, T>
) => {
  return useContextSelector(BusterMetricDataContext, selector);
};
