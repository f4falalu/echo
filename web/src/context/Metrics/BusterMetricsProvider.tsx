import React, { PropsWithChildren, useRef, useState } from 'react';
import {
  createContext,
  ContextSelector,
  useContextSelector
} from '@fluentui/react-context-selector';
import { BusterMetricsListProvider } from './BusterMetricsListProvider';
import { useDebounceFn, useMemoizedFn, useMount } from 'ahooks';
import type { IBusterMetric } from './interfaces';
import {
  BusterMetric,
  DEFAULT_CHART_CONFIG,
  IBusterMetricChartConfig,
  ShareRole,
  VerificationStatus
} from '@/api/asset_interfaces';
import { useBusterWebSocket } from '../BusterWebSocket';
import { useParams } from 'next/navigation';
import { useUserConfigContextSelector } from '../Users';
import { useBusterAssetsContextSelector } from '../Assets/BusterAssetsProvider';
import { useDashboardContextSelector } from '../Dashboards';
import { useBusterNotifications } from '../BusterNotifications';
import last from 'lodash/last';
import { useTransition } from 'react';
import type { IColumnLabelFormat } from '@/components/charts/interfaces/columnLabelInterfaces';
import type { ColumnSettings } from '@/components/charts/interfaces/columnInterfaces';
import { RustApiError } from '@/api/buster_rest/errors';
import { prepareMetricUpdateMetric, resolveEmptyMetric, upgradeMetricToIMetric } from './helpers';
import { MetricUpdateMetric } from '@/api/buster_socket/metrics';
import { useBusterMetricDataContextSelector } from '../MetricData';
import { MOCK_METRIC } from './MOCK_METRIC';
import { useUpdateMetricConfig } from './useUpdateMetricConfig';
import { useUpdateMetricAssosciations } from './useUpdateMetricAssosciations';

export const useBusterMetrics = () => {
  const [isPending, startTransition] = useTransition();
  const { metricId: selectedMetricId } = useParams<{ metricId: string }>();
  const { openConfirmModal } = useBusterNotifications();
  const busterSocket = useBusterWebSocket();
  const getAssetPassword = useBusterAssetsContextSelector((state) => state.getAssetPassword);
  const setAssetPasswordError = useBusterAssetsContextSelector(
    (state) => state.setAssetPasswordError
  );
  const metricsRef = useRef<Record<string, IBusterMetric>>({});
  const [editingMetricTitle, setEditingMetricTitle] = useState(false);

  const getMetricId = useMemoizedFn((metricId?: string): string => {
    return metricId || selectedMetricId;
  });

  const setMetrics = useMemoizedFn((newMetrics: Record<string, IBusterMetric>) => {
    metricsRef.current = { ...newMetrics };
    startTransition(() => {
      //trigger a rerender
    });
  });

  const resetMetric = useMemoizedFn(({ metricId }: { metricId: string }) => {
    const prev = metricsRef.current;
    delete prev[metricId];
    setMetrics(prev);
  });

  const deleteMetric = useMemoizedFn(async ({ metricIds }: { metricIds: string[] }) => {
    return await openConfirmModal({
      title: 'Delete metric',
      content: 'Are you sure you want to delete this metric?',
      onOk: async () => {
        await busterSocket.emitAndOnce({
          emitEvent: {
            route: '/metrics/delete',
            payload: {
              ids: metricIds
            }
          },
          responseEvent: {
            route: '/metrics/delete:deleteMetricState',
            callback: (d) => d
          }
        });
      },
      useReject: true
    });
  });

  //UI SELECTORS

  const getMetricMemoized = useMemoizedFn(({ metricId }: { metricId?: string }): IBusterMetric => {
    const _metricId = getMetricId(metricId);
    const metrics = metricsRef.current || {};
    const currentMetric = metrics[_metricId];
    return resolveEmptyMetric(currentMetric, _metricId);
  });

  //STATE UPDATERS

  const onInitializeMetric = useMemoizedFn((newMetric: BusterMetric) => {
    const metrics = metricsRef.current || {};

    const oldMetric = metrics[newMetric.id] as IBusterMetric | undefined; //HMMM is this right?

    const upgradedMetric = upgradeMetricToIMetric(newMetric, oldMetric);

    onUpdateMetric(upgradedMetric);
  });

  const _setLoadingMetric = useMemoizedFn((metricId: string) => {
    const metrics = metricsRef.current || {};
    metrics[metricId] = resolveEmptyMetric(
      {
        ...metrics[metricId],
        fetching: true
      },
      metricId
    );

    setMetrics(metrics);

    return metrics[metricId];
  });

  const bulkUpdateMetrics = useMemoizedFn((newMetrics: Record<string, IBusterMetric>) => {
    metricsRef.current = {
      ...metricsRef.current,
      ...newMetrics
    };
  });

  //LISTENERS

  const _onGetMetricState = useMemoizedFn((metric: BusterMetric) => {
    onInitializeMetric(metric);
  });

  const _onGetMetricStateError = useMemoizedFn((_error: any, metricId: string) => {
    const error = _error as RustApiError;
    setAssetPasswordError(metricId, error.message || 'An error occurred');
  });

  const _onUpdateMetric = useMemoizedFn((metric: BusterMetric) => {
    onInitializeMetric(metric);
  });

  // EMITTERS

  const subscribeToMetric = useMemoizedFn(async ({ metricId }: { metricId: string }) => {
    const { password } = getAssetPassword(metricId);
    const foundMetric: undefined | IBusterMetric = metricsRef.current[metricId];

    if (foundMetric && (foundMetric?.fetching || foundMetric?.fetched)) {
      return foundMetric;
    }

    _setLoadingMetric(metricId);

    //TODO: remove this
    setTimeout(() => {
      _onGetMetricState({
        ...MOCK_METRIC,
        id: metricId
      });
    }, 300);

    return await busterSocket.emitAndOnce({
      emitEvent: {
        route: '/metrics/get',
        payload: {
          id: metricId,
          password
        }
      },
      responseEvent: {
        route: '/metrics/get:updateMetricState',
        callback: _onGetMetricState,
        onError: (error) => _onGetMetricStateError(error, metricId)
      }
    });
  });

  const unsubscribeToMetricEvents = useMemoizedFn(({ metricId }: { metricId: string }) => {
    busterSocket.off({
      route: '/metrics/get:updateMetricState',
      callback: _onUpdateMetric
    });
    busterSocket.off({
      route: '/metrics/update:updateMetricState',
      callback: _onUpdateMetric
    });
  });

  const onShareMetric = useMemoizedFn(
    async (
      payload: Pick<
        MetricUpdateMetric['payload'],
        | 'id'
        | 'publicly_accessible'
        | 'public_password'
        | 'user_permissions'
        | 'team_permissions'
        | 'public_expiry_date'
        | 'remove_users'
        | 'remove_teams'
      >
    ) => {
      //keep this seperate from _updateMetricToServer because we need to do some extra stuff
      return busterSocket.emitAndOnce({
        emitEvent: {
          route: '/metrics/update',
          payload
        },
        responseEvent: {
          route: '/metrics/update:updateMetricState',
          callback: _onUpdateMetric
        }
      });
    }
  );

  const {
    saveMetricToDashboard,
    saveMetricToCollection,
    removeMetricFromDashboard,
    removeMetricFromCollection
  } = useUpdateMetricAssosciations({
    metricsRef,
    setMetrics,
    getMetricMemoized
  });

  const {
    onVerifiedMetric,
    onUpdateMetric,
    onUpdateMetricChartConfig,
    onUpdateColumnLabelFormat,
    onUpdateColumnSetting,
    updateMetricToServer,
    onSaveMetricChanges
  } = useUpdateMetricConfig({
    getMetricId,
    setMetrics,
    startTransition,
    _onUpdateMetric,
    getMetricMemoized
  });

  return {
    resetMetric,
    deleteMetric,
    onVerifiedMetric,
    onShareMetric,
    onUpdateMetric,
    onInitializeMetric,
    subscribeToMetric,
    unsubscribeToMetricEvents,
    onUpdateMetricChartConfig,
    updateMetricToServer,
    onUpdateColumnLabelFormat,
    onUpdateColumnSetting,
    saveMetricToDashboard,
    removeMetricFromDashboard,
    removeMetricFromCollection,
    saveMetricToCollection,
    editingMetricTitle,
    setEditingMetricTitle,
    onSaveMetricChanges,
    getMetricMemoized,
    metrics: metricsRef.current
  };
};

const BusterMetrics = createContext<ReturnType<typeof useBusterMetrics>>(
  {} as ReturnType<typeof useBusterMetrics>
);

export const BusterMetricsProvider: React.FC<PropsWithChildren> = React.memo(({ children }) => {
  return (
    <BusterMetrics.Provider value={useBusterMetrics()}>
      <BusterMetricsListProvider>{children}</BusterMetricsListProvider>
    </BusterMetrics.Provider>
  );
});
BusterMetricsProvider.displayName = 'BusterMetricsProvider';

export const useBusterMetricsContextSelector = <T,>(
  selector: ContextSelector<ReturnType<typeof useBusterMetrics>, T>
) => {
  return useContextSelector(BusterMetrics, selector);
};

export const useBusterMetricIndividual = ({ metricId }: { metricId: string }) => {
  const editingMetricTitle = useBusterMetricsContextSelector((x) => x.editingMetricTitle);
  const setEditingMetricTitle = useBusterMetricsContextSelector((x) => x.setEditingMetricTitle);
  const subscribeToMetric = useBusterMetricsContextSelector((x) => x.subscribeToMetric);
  const fetchDataByMetricId = useBusterMetricDataContextSelector((x) => x.fetchDataByMetricId);
  const metric = useBusterMetricsContextSelector((x) => x.metrics[metricId]);
  const metricData = useBusterMetricDataContextSelector(({ getMetricData }) =>
    getMetricData(metricId)
  );

  useMount(() => {
    subscribeToMetric({ metricId });
    fetchDataByMetricId({ metricId });
  });

  return {
    metric: resolveEmptyMetric(metric, metricId),
    metricData,
    editingMetricTitle,
    setEditingMetricTitle
  };
};
