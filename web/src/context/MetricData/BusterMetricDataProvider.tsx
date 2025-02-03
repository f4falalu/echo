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

const DEFAULT_MESSAGE_DATA: BusterMetricData = {
  fetched: false,
  fetching: false,
  updatedAt: 0,
  data_metadata: null,
  code: null
};

const useMessageData = () => {
  const busterSocket = useBusterWebSocket();

  const [messageData, setMessageData] = useState<Record<string, BusterMetricData>>({});

  const _setMessageData = useMemoizedFn(
    (metricId: string, newMessageData: Partial<BusterMetricData>) => {
      setMessageData((prev) => ({
        ...prev,
        [metricId]: { ...prev[metricId], ...newMessageData }
      }));
    }
  );

  const _onGetFetchingData = useMemoizedFn((payload: MetricEvent_fetchingData) => {
    const { data, data_metadata, code, progress, metric_id: metricId } = payload;
    const currentMessage = getMessageData(metricId);
    const fallbackData = data || currentMessage?.data;
    const fallbackDataMetadata = data_metadata || currentMessage?.data_metadata;
    const isCompleted = progress === 'completed';

    onSetMessageData({
      metricId,
      data: fallbackData,
      data_metadata: fallbackDataMetadata,
      isDataFromRerun: false,
      fetchedData: isCompleted,
      fetchingData: !isCompleted,
      code
    });
  });

  const onSetLoadingMessageData = useMemoizedFn(
    ({
      metricId,
      ...params
    }: {
      metricId: string;
      data_metadata?: BusterMetricData['data_metadata'];
      code: string | null;
    }) => {
      _setMessageData(metricId, { ...params, fetching: true });
    }
  );

  const onSetMessageData = useMemoizedFn(
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
      const prev = getMessageData(metricId);
      _setMessageData(metricId, {
        [setKey]: data,
        updatedAt: Date.now(),
        fetched: fetchedData ?? true,
        fetching: fetchingData ?? false,
        data_metadata: data_metadata ?? prev?.data_metadata,
        code
      });
    }
  );

  const onSetMessageDataCode = useMemoizedFn(
    ({ messageId, code }: { messageId: string; code: string }) => {
      _setMessageData(messageId, { code });
    }
  );

  const getDataByMessageId = useMemoizedFn(async ({ metricId }: { metricId: string }) => {
    const selectedMessageData = getMessageData(metricId);
    if (selectedMessageData?.fetching || selectedMessageData?.fetched) {
      return;
    }

    _setMessageData(metricId, {
      fetching: true
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

  const getMessageData = useCallback(
    (metricId: string | undefined) => {
      if (metricId && messageData[metricId]) {
        return messageData[metricId];
      }
      return DEFAULT_MESSAGE_DATA;
    },
    [messageData]
  );

  const getAllMessageDataMemoized = useMemoizedFn(() => {
    return messageData.current;
  });

  useMount(() => {
    busterSocket.on({
      route: '/metrics/get:fetchingData',
      callback: _onGetFetchingData
    });
  });

  return {
    onSetMessageDataCode,
    onSetMessageData,
    onSetLoadingMessageData,
    getDataByMessageId,
    getMessageData,
    getAllMessageDataMemoized
  };
};

const BusterMessageDataContext = createContext<ReturnType<typeof useMessageData>>(
  {} as ReturnType<typeof useMessageData>
);

export const BusterMessageDataProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const messageDataContext = useMessageData();

  return (
    <BusterMessageDataContext.Provider value={messageDataContext}>
      {children}
    </BusterMessageDataContext.Provider>
  );
};
BusterMessageDataProvider.displayName = 'BusterMessageDataProvider';

export const useBusterMessageDataContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useMessageData>, T>
) => {
  return useContextSelector(BusterMessageDataContext, selector);
};
