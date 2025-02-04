import React, { PropsWithChildren, useRef, useState } from 'react';
import {
  createContext,
  ContextSelector,
  useContextSelector
} from '@fluentui/react-context-selector';
import { BusterMetricsListProvider } from './BusterMetricsListProvider';
import { defaultIBusterMetric } from './config';
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

export const useBusterMetrics = () => {
  const [isPending, startTransition] = useTransition();
  const { metricId: selectedMetricId } = useParams<{ metricId: string }>();
  const { openConfirmModal } = useBusterNotifications();
  const busterSocket = useBusterWebSocket();
  const userFavorites = useUserConfigContextSelector((state) => state.userFavorites);
  const forceGetFavoritesList = useUserConfigContextSelector((x) => x.forceGetFavoritesList);
  const removeItemFromIndividualDashboard = useDashboardContextSelector(
    (state) => state.removeItemFromIndividualDashboard
  );
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

  const saveMetricToDashboard = useMemoizedFn(
    async ({ metricId, dashboardIds }: { metricId: string; dashboardIds: string[] }) => {
      const lastId = last(dashboardIds);
      const prev = metricsRef.current;
      setMetrics({
        ...prev,
        [metricId]: {
          ...prev[metricId],
          dashboards: [
            ...prev[metricId].dashboards,
            ...dashboardIds.map((id) => {
              return { id, name: '' };
            })
          ]
        }
      });
      let promises: Promise<any>[] = [];
      dashboardIds.forEach((dashboardId) => {
        promises.push(
          busterSocket.emitAndOnce({
            emitEvent: {
              route: '/metrics/update',
              payload: {
                id: metricId,
                save_to_dashboard: dashboardId
              }
            },
            responseEvent: {
              route: '/metrics/update:updateMetricState',
              callback: (d) => d
            }
          })
        );
      });
      await Promise.all(promises);
      return lastId;
    }
  );

  const saveMetricToCollection = useMemoizedFn(
    async ({ metricId, collectionIds }: { metricId: string; collectionIds: string[] }) => {
      const collectionIsInFavorites = userFavorites.some((f) => {
        const searchId = f.collection_id || f.id;
        return collectionIds.includes(searchId);
      });
      const addToPromises: Promise<unknown>[] = [];
      collectionIds.forEach((collectionId) => {
        const promise = busterSocket.emitAndOnce({
          emitEvent: {
            route: '/metrics/update',
            payload: {
              id: metricId,
              add_to_collections: [collectionId]
            }
          },
          responseEvent: {
            route: '/metrics/update:updateMetricState',
            callback: (d) => d
          }
        });
        addToPromises.push(promise);
      });

      const prev = metricsRef.current;

      const hasPreviousMetric = prev[metricId];
      if (!hasPreviousMetric) return; //if the metric doesn't exist, don't save to collections

      setMetrics({
        ...prev,
        [metricId]: {
          ...prev[metricId],
          collections: [
            ...prev[metricId].collections,
            ...collectionIds.map((id) => {
              return { id, name: '' };
            })
          ]
        }
      });

      if (addToPromises.length) await Promise.all(addToPromises);
      if (collectionIsInFavorites) {
        await forceGetFavoritesList();
      }
    }
  );

  const removeMetricFromDashboard = useMemoizedFn(
    async ({
      metricId,
      dashboardId,
      useConfirmModal = true
    }: {
      metricId: string;
      dashboardId: string;
      useConfirmModal?: boolean;
    }) => {
      const prev = metricsRef.current;

      const onOk = async () => {
        if (prev[metricId]) {
          setMetrics({
            ...prev,
            [metricId]: {
              ...prev[metricId],
              dashboards: prev[metricId].dashboards.filter((d) => d.id !== dashboardId)
            }
          });
        }
        removeItemFromIndividualDashboard({
          dashboardId,
          metricId
        });
        return await busterSocket.emitAndOnce({
          emitEvent: {
            route: '/metrics/update',
            payload: {
              id: metricId,
              remove_from_dashboard: dashboardId
            }
          },
          responseEvent: {
            route: '/metrics/update:updateMetricState',
            callback: (d) => d
          }
        });
      };
      if (!useConfirmModal) return await onOk();
      return await openConfirmModal({
        title: 'Remove from dashboard',
        content: 'Are you sure you want to remove this metric from this dashboard?',
        onOk
      });
    }
  );

  const removeMetricFromCollection = useMemoizedFn(
    async ({
      metricId,
      collectionId,
      ignoreFavoriteUpdates
    }: {
      metricId: string;
      collectionId: string;
      ignoreFavoriteUpdates?: boolean;
    }) => {
      const currentMetric = _getMetric({ metricId });
      const collectionIsInFavorites = userFavorites.some((f) => {
        const searchId = f.collection_id || f.id;
        return currentMetric.collections.some((c) => c.id === searchId);
      });

      const prev = metricsRef.current;

      const hasPreviousMetric = prev[metricId];
      if (hasPreviousMetric) {
        setMetrics({
          ...prev,
          [metricId]: {
            ...prev[metricId],
            collections: prev[metricId].collections.filter((d) => d.id !== collectionId)
          }
        });
      }

      await busterSocket.emitAndOnce({
        emitEvent: {
          route: '/metrics/update',
          payload: {
            id: metricId,
            remove_from_collections: [collectionId]
          }
        },
        responseEvent: {
          route: '/metrics/update:updateMetricState',
          callback: (d) => d
        }
      });
      if (collectionIsInFavorites && ignoreFavoriteUpdates !== true) {
        await forceGetFavoritesList();
      }
    }
  );

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

  const _getMetric = useMemoizedFn(({ metricId }: { metricId?: string }): IBusterMetric => {
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

  const bulkUpdateMetrics = useMemoizedFn((newMetrics: Record<string, IBusterMetric>) => {
    metricsRef.current = {
      ...metricsRef.current,
      ...newMetrics
    };
  });

  const onUpdateMetric = useMemoizedFn(
    async (newMetricPartial: Partial<IBusterMetric>, saveToServer: boolean = true) => {
      const metricId = getMetricId(newMetricPartial.id);
      const currentMetric = _getMetric({ metricId })!;
      const newMetric: IBusterMetric = {
        ...currentMetric,
        ...newMetricPartial
      };

      setMetrics({
        [metricId]: newMetric
      });

      //This will trigger a rerender and push prepareMetricUpdateMetric off UI metric
      startTransition(() => {
        const isReadyOnly = currentMetric.permission === ShareRole.VIEWER;
        if (saveToServer && !isReadyOnly) {
          _prepareMetricAndSaveToServer(newMetric, currentMetric);
        }
      });
    }
  );

  const { run: _prepareMetricAndSaveToServer } = useDebounceFn(
    useMemoizedFn((newMetric: IBusterMetric, oldMetric: IBusterMetric) => {
      const changedValues = prepareMetricUpdateMetric(newMetric, oldMetric);
      if (changedValues) {
        _updateMetricMessageToServer(changedValues);
      }
    }),
    { wait: 700 }
  );

  const onUpdateMetricChartConfig = useMemoizedFn(
    ({
      metricId,
      chartConfig,
      ignoreUndoRedo
    }: {
      metricId?: string;
      chartConfig: Partial<IBusterMetricChartConfig>;
      ignoreUndoRedo?: boolean;
    }) => {
      const currentMetric = _getMetric({
        metricId
      });

      if (!ignoreUndoRedo) {
        // undoRedoParams.addToUndoStack({
        //   metricId: editMetric.id,
        //   messageId: editMessage.id,
        //   chartConfig: editMessage.chart_config
        // });
      }

      const newChartConfig: IBusterMetricChartConfig = {
        ...DEFAULT_CHART_CONFIG,
        ...currentMetric.chart_config,
        ...chartConfig
      };

      return onUpdateMetric({
        id: metricId,
        chart_config: newChartConfig
      });
    }
  );

  const onUpdateColumnLabelFormat = useMemoizedFn(
    ({
      columnId,
      columnLabelFormat,
      metricId
    }: {
      columnId: string;
      metricId: string;
      columnLabelFormat: Partial<IColumnLabelFormat>;
    }) => {
      const currentMetric = _getMetric({
        metricId
      });
      const existingColumnLabelFormats = currentMetric.chart_config.columnLabelFormats;
      const existingColumnLabelFormat = existingColumnLabelFormats[columnId];
      const newColumnLabelFormat = {
        ...existingColumnLabelFormat,
        ...columnLabelFormat
      };
      const columnLabelFormats = {
        ...existingColumnLabelFormats,
        [columnId]: newColumnLabelFormat
      };
      onUpdateMetricChartConfig({
        metricId,
        chartConfig: {
          columnLabelFormats
        }
      });
    }
  );

  const onUpdateColumnSetting = useMemoizedFn(
    ({
      columnId,
      columnSetting,
      metricId
    }: {
      columnId: string;
      columnSetting: Partial<ColumnSettings>;
      metricId: string;
    }) => {
      const currentMetric = _getMetric({
        metricId
      });
      const existingColumnSettings = currentMetric.chart_config.columnSettings;
      const existingColumnSetting = currentMetric.chart_config.columnSettings[columnId];
      const newColumnSetting: Required<ColumnSettings> = {
        ...existingColumnSetting,
        ...columnSetting
      };
      const newColumnSettings: Record<string, Required<ColumnSettings>> = {
        ...existingColumnSettings,
        [columnId]: newColumnSetting
      };
      onUpdateMetricChartConfig({
        metricId,
        chartConfig: {
          columnSettings: newColumnSettings
        }
      });
    }
  );

  const onSaveMetricChanges = useMemoizedFn(
    async ({
      metricId,
      ...params
    }: {
      metricId: string;
      save_draft: boolean;
      save_as_metric_state?: string;
    }) => {
      return busterSocket.emitAndOnce({
        emitEvent: {
          route: '/metrics/update',
          payload: {
            id: metricId,
            ...params
          }
        },
        responseEvent: {
          route: '/metrics/update:updateMetricState',
          callback: _onUpdateMetric
        }
      }) as Promise<[BusterMetric]>;
    }
  );

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

  const _onCheckUpdateMetricMessage = useMemoizedFn((metric: BusterMetric) => {
    // const newMessage = metric[0].messages.find((m) => m.id === messageId);
    // const currentMessage = _getMetricMessage({
    //   metricId: selectedMetricId,
    //   messageId: messageId
    // });

    // if (newMessage?.draft_session_id && !currentMessage?.draft_session_id) {
    //   onUpdateMetricMessage(
    //     {
    //       metricId: selectedMetricId,
    //       messageId: messageId,
    //       message: {
    //         draft_session_id: newMessage.draft_session_id
    //       }
    //     },
    //     false
    //   );
    // }
    return metric;
  });

  // EMITTERS

  const subscribeToMetric = useMemoizedFn(async ({ metricId }: { metricId: string }) => {
    const { password } = getAssetPassword(metricId);
    const foundMetric: undefined | IBusterMetric = metricsRef.current[metricId];

    if (foundMetric && (foundMetric.fetching || foundMetric.fetched)) {
      return foundMetric;
    }

    //TODO: remove this
    setTimeout(() => {
      _onGetMetricState({
        ...MOCK_METRIC,
        id: metricId
      });
    }, 500);

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

  const updateMetricMessageToServer = useMemoizedFn((payload: MetricUpdateMetric['payload']) => {
    return busterSocket.emitAndOnce({
      emitEvent: {
        route: '/metrics/update',
        payload
      },
      responseEvent: {
        route: '/metrics/update:updateMetricState',
        //   route: '/metrics/messages/update:updateMetricState',
        callback: _onCheckUpdateMetricMessage
      }
    });
  });

  const { run: _updateMetricMessageToServer } = useDebounceFn(updateMetricMessageToServer, {
    wait: 300
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

  const onVerifiedMetric = useMemoizedFn(
    async ({ metricId, status }: { metricId: string; status: VerificationStatus }) => {
      return await onUpdateMetric({
        id: metricId,
        status
      });
    }
  );

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
    updateMetricMessageToServer,
    onUpdateColumnLabelFormat,
    onUpdateColumnSetting,
    saveMetricToDashboard,
    removeMetricFromDashboard,
    removeMetricFromCollection,
    saveMetricToCollection,
    editingMetricTitle,
    setEditingMetricTitle,
    selectedMetricId,
    onSaveMetricChanges,
    getMetricNotLiveDataMethodOnly: _getMetric,
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
