import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import {
  dashboardsGetList,
  dashboardsGetDashboard,
  dashboardsCreateDashboard,
  dashboardsUpdateDashboard,
  dashboardsDeleteDashboard,
  shareDashboard,
  updateDashboardShare,
  unshareDashboard
} from './requests';
import { dashboardQueryKeys } from '@/api/query_keys/dashboard';
import {
  BusterDashboard,
  BusterDashboardResponse,
  MAX_NUMBER_OF_ITEMS_ON_DASHBOARD
} from '@/api/asset_interfaces/dashboard';
import { useMemo } from 'react';
import { useMemoizedFn } from '@/hooks';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { create } from 'mutative';
import { upgradeMetricToIMetric } from '@/lib/metrics';
import { queryKeys } from '@/api/query_keys';
import { prefetchGetMetricDataClient } from '../metrics/queryRequests';
import { useBusterAssetsContextSelector } from '@/context/Assets/BusterAssetsProvider';
import {
  useAddAssetToCollection,
  useRemoveAssetFromCollection
} from '../collections/queryRequests';
import { collectionQueryKeys } from '@/api/query_keys/collection';
import { addMetricToDashboardConfig, removeMetricFromDashboardConfig } from './helpers';
import { addAndRemoveMetricsToDashboard } from './helpers/addAndRemoveMetricsToDashboard';
import { useParams, useSearchParams } from 'next/navigation';
import { RustApiError } from '../errors';
import { useOriginalDashboardStore } from '@/context/Dashboards';

export const useGetDashboardsList = (
  params: Omit<Parameters<typeof dashboardsGetList>[0], 'page_token' | 'page_size'>
) => {
  const filters = useMemo(() => {
    return {
      ...params,
      page_token: 0,
      page_size: 3000
    };
  }, [params]);

  return useQuery({
    ...dashboardQueryKeys.dashboardGetList(params),
    queryFn: () => dashboardsGetList(filters)
  });
};

const useGetDashboardAndInitializeMetrics = (prefetchData: boolean = true) => {
  const queryClient = useQueryClient();
  const setOriginalDashboards = useOriginalDashboardStore((x) => x.setOriginalDashboard);
  const getAssetPassword = useBusterAssetsContextSelector((state) => state.getAssetPassword);

  const initializeMetrics = useMemoizedFn((metrics: BusterDashboardResponse['metrics']) => {
    for (const metric of Object.values(metrics)) {
      const prevMetric = queryClient.getQueryData(
        queryKeys.metricsGetMetric(metric.id, metric.version_number).queryKey
      );
      const upgradedMetric = upgradeMetricToIMetric(metric, prevMetric);
      queryClient.setQueryData(
        queryKeys.metricsGetMetric(metric.id, metric.version_number).queryKey,
        upgradedMetric
      );
      if (prefetchData) {
        prefetchGetMetricDataClient(
          { id: metric.id, version_number: metric.version_number },
          queryClient
        );
      }
    }
  });

  return useMemoizedFn(async (id: string, version_number?: number) => {
    const { password } = getAssetPassword?.(id) || {};

    return dashboardsGetDashboard({ id: id!, password, version_number }).then((data) => {
      initializeMetrics(data.metrics);

      setOriginalDashboards(data.dashboard);

      if (!version_number && data.dashboard.version_number) {
        queryClient.setQueryData(
          dashboardQueryKeys.dashboardGetDashboard(id, data.dashboard.version_number).queryKey,
          data
        );
      }

      return data;
    });
  });
};

const useGetDashboardVersionNumber = (props?: {
  versionNumber?: number | null; //if null it will not use a params from the query params
}) => {
  const { versionNumber: versionNumberProp } = props || {};
  const { versionNumber: versionNumberPathParam, metricId: metricIdPathParam } = useParams() as {
    versionNumber: string | undefined;
    metricId: string | undefined;
  };
  const versionNumberQueryParam = useSearchParams().get('dashboard_version_number');
  const versionNumberFromParams = metricIdPathParam
    ? versionNumberQueryParam || versionNumberPathParam
    : undefined;

  const versionNumber = useMemo(() => {
    if (versionNumberProp === null) return undefined;
    return (
      versionNumberProp ??
      (versionNumberFromParams ? parseInt(versionNumberFromParams!) : undefined)
    );
  }, [versionNumberProp, versionNumberFromParams]);

  return versionNumber;
};

export const useGetDashboard = <TData = BusterDashboardResponse>(
  {
    id,
    versionNumber: versionNumberProp
  }: { id: string | undefined; versionNumber?: number | null },
  params?: Omit<
    UseQueryOptions<BusterDashboardResponse, RustApiError, TData>,
    'queryKey' | 'queryFn'
  >
) => {
  const queryFn = useGetDashboardAndInitializeMetrics();
  const versionNumber = useGetDashboardVersionNumber({ versionNumber: versionNumberProp });

  return useQuery({
    ...dashboardQueryKeys.dashboardGetDashboard(id!, versionNumber),
    queryFn: () => queryFn(id!, versionNumber),
    enabled: !!id, //it is false because we fetch the dashboard server side
    select: params?.select,
    ...params
  });
};

export const useCreateDashboard = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: dashboardsCreateDashboard,
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: dashboardQueryKeys.dashboardGetList({}).queryKey
        });
      }, 350);
    }
  });
};

export const useSaveDashboard = (params?: { updateOnSave?: boolean }) => {
  const updateOnSave = params?.updateOnSave || false;
  const queryClient = useQueryClient();
  const setOriginalDashboard = useOriginalDashboardStore((x) => x.setOriginalDashboard);
  const versionNumber = useGetDashboardVersionNumber();

  return useMutation({
    mutationFn: dashboardsUpdateDashboard,
    onMutate: ({ id, update_version, restore_to_version }) => {
      const isRestoringVersion = restore_to_version !== undefined;
      const isUpdatingVersion = update_version === true;

      //
    },
    onSuccess: (data, variables) => {
      if (updateOnSave && data) {
        queryClient.setQueryData(
          dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, data.dashboard.version_number)
            .queryKey,
          data
        );
        //We need to update BOTH the versioned and the non-versioned metric for version updates to keep the latest up to date
        if (variables.update_version) {
          queryClient.setQueryData(
            dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, undefined).queryKey,
            data
          );
        }
        console.log('setting original dashboard', data.dashboard);
        setOriginalDashboard(data.dashboard);
      }
    }
  });
};

export const useUpdateDashboard = (params?: {
  updateOnSave?: boolean;
  updateVersion?: boolean;
  saveToServer?: boolean;
}) => {
  const { updateOnSave = false, updateVersion = false, saveToServer = false } = params || {};
  const queryClient = useQueryClient();
  const { mutateAsync: saveDashboard } = useSaveDashboard({ updateOnSave });
  const getOriginalDashboard = useOriginalDashboardStore((x) => x.getOriginalDashboard);
  const versionNumber = useGetDashboardVersionNumber();

  const mutationFn = useMemoizedFn(
    async (variables: Parameters<typeof dashboardsUpdateDashboard>[0]) => {
      if (saveToServer) {
        return await saveDashboard({
          ...variables,
          update_version: updateVersion
        });
      }

      const newDashboard = create(getOriginalDashboard(variables.id), (draft) => {
        Object.assign(draft!, variables);
      });

      return newDashboard;
    }
  );

  return useMutation({
    mutationFn,
    onMutate: (variables) => {
      const queryKey = dashboardQueryKeys.dashboardGetDashboard(
        variables.id,
        versionNumber
      ).queryKey;

      queryClient.setQueryData(queryKey, (previousData) => {
        const newDashboardState: BusterDashboardResponse = create(previousData!, (draft) => {
          draft.dashboard = create(draft.dashboard, (draft) => {
            Object.assign(draft, variables);
          });
        });
        console.log('newDashboardState', newDashboardState.dashboard.config.rows?.[0]);
        return newDashboardState!;
      });
    }
  });
};

export const useUpdateDashboardConfig = () => {
  const { mutateAsync } = useUpdateDashboard({
    saveToServer: false,
    updateVersion: false
  });
  const queryClient = useQueryClient();
  const versionNumber = useGetDashboardVersionNumber();

  const method = useMemoizedFn(
    async ({
      dashboardId,
      ...newDashboard
    }: Partial<BusterDashboard['config']> & {
      dashboardId: string;
    }) => {
      const options = dashboardQueryKeys.dashboardGetDashboard(dashboardId, versionNumber);
      const previousDashboard = queryClient.getQueryData(options.queryKey);
      const previousConfig = previousDashboard?.dashboard?.config;
      if (previousConfig) {
        console.log('previousConfig', previousConfig.rows?.[0]);
        const newConfig = create(previousConfig!, (draft) => {
          Object.assign(draft, newDashboard);
        });
        console.log('newConfig', newConfig.rows?.[0]);
        return mutateAsync({
          id: dashboardId,
          config: newConfig
        });
      }
    }
  );

  return useMutation({
    mutationFn: method
  });
};

export const useDeleteDashboards = () => {
  const queryClient = useQueryClient();
  const { openConfirmModal } = useBusterNotifications();

  const onDeleteDashboard = useMemoizedFn(
    async ({
      dashboardId,
      ignoreConfirm
    }: {
      dashboardId: string | string[];
      ignoreConfirm?: boolean;
    }) => {
      const onMutate = () => {
        const queryKey = dashboardQueryKeys.dashboardGetList({}).queryKey;
        queryClient.setQueryData(queryKey, (v) => {
          const ids = typeof dashboardId === 'string' ? [dashboardId] : dashboardId;
          return v?.filter((t) => !ids.includes(t.id)) || [];
        });
      };

      const method = async () => {
        const ids = typeof dashboardId === 'string' ? [dashboardId] : dashboardId;
        onMutate();
        await dashboardsDeleteDashboard({ ids });
      };
      if (ignoreConfirm) {
        return method();
      }
      return await openConfirmModal({
        title: 'Delete Dashboard',
        content: 'Are you sure you want to delete this dashboard?',
        primaryButtonProps: {
          text: 'Delete'
        },
        onOk: method
      });
    }
  );

  return useMutation({
    mutationFn: onDeleteDashboard,
    onSuccess: (_, { dashboardId }) => {
      queryClient.invalidateQueries({
        queryKey: dashboardQueryKeys.dashboardGetList({}).queryKey
      });
    }
  });
};

export const useAddDashboardToCollection = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: addAssetToCollection } = useAddAssetToCollection();
  const mutationFn = useMemoizedFn(
    async (variables: { dashboardIds: string[]; collectionIds: string[] }) => {
      const { dashboardIds, collectionIds } = variables;
      return await Promise.all(
        collectionIds.map((collectionId) =>
          addAssetToCollection({
            id: collectionId,
            assets: dashboardIds.map((dashboardId) => ({ id: dashboardId, type: 'dashboard' }))
          })
        )
      );
    }
  );
  return useMutation({
    mutationFn,
    onSuccess: (_, { collectionIds }) => {
      queryClient.invalidateQueries({
        queryKey: collectionIds.map(
          (id) => collectionQueryKeys.collectionsGetCollection(id).queryKey
        )
      });
    }
  });
};

export const useRemoveDashboardFromCollection = () => {
  const queryClient = useQueryClient();
  const { mutateAsync: removeAssetFromCollection } = useRemoveAssetFromCollection();

  const mutationFn = useMemoizedFn(
    async (variables: { dashboardIds: string[]; collectionIds: string[] }) => {
      const { dashboardIds, collectionIds } = variables;

      return await Promise.all(
        collectionIds.map((collectionId) =>
          removeAssetFromCollection({
            id: collectionId,
            assets: dashboardIds.map((dashboardId) => ({ id: dashboardId, type: 'dashboard' }))
          })
        )
      );
    }
  );
  return useMutation({
    mutationFn,
    onSuccess: (_, { collectionIds }) => {
      queryClient.invalidateQueries({
        queryKey: collectionIds.map(
          (id) => collectionQueryKeys.collectionsGetCollection(id).queryKey
        )
      });
    }
  });
};

export const useShareDashboard = () => {
  const queryClient = useQueryClient();
  const versionNumber = useGetDashboardVersionNumber();
  return useMutation({
    mutationFn: shareDashboard,
    onMutate: (variables) => {
      const queryKey = dashboardQueryKeys.dashboardGetDashboard(
        variables.id,
        versionNumber
      ).queryKey;
      queryClient.setQueryData(queryKey, (previousData) => {
        return create(previousData!, (draft) => {
          draft.individual_permissions = [
            ...variables.params,
            ...(draft.individual_permissions || [])
          ];
        });
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, versionNumber).queryKey,
        data
      );
    }
  });
};

export const useUnshareDashboard = () => {
  const queryClient = useQueryClient();
  const versionNumber = useGetDashboardVersionNumber();
  return useMutation({
    mutationFn: unshareDashboard,
    onMutate: (variables) => {
      const queryKey = dashboardQueryKeys.dashboardGetDashboard(
        variables.id,
        versionNumber
      ).queryKey;
      queryClient.setQueryData(queryKey, (previousData) => {
        return create(previousData!, (draft) => {
          draft.individual_permissions =
            draft.individual_permissions?.filter((t) => !variables.data.includes(t.email)) || [];
        });
      });
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, versionNumber).queryKey,
        data
      );
    }
  });
};

export const useUpdateDashboardShare = () => {
  const queryClient = useQueryClient();
  const versionNumber = useGetDashboardVersionNumber();
  return useMutation({
    mutationFn: updateDashboardShare,
    onMutate: ({ id, params }) => {
      const queryKey = dashboardQueryKeys.dashboardGetDashboard(id, versionNumber).queryKey;
      queryClient.setQueryData(queryKey, (previousData) => {
        return create(previousData!, (draft) => {
          draft.individual_permissions =
            draft.individual_permissions?.map((t) => {
              const found = params.users?.find((v) => v.email === t.email);
              if (found) return found;
              return t;
            }) || [];

          if (params.publicly_accessible !== undefined) {
            draft.publicly_accessible = params.publicly_accessible;
          }
          if (params.public_password !== undefined) {
            draft.public_password = params.public_password;
          }
          if (params.public_expiry_date !== undefined) {
            draft.public_expiry_date = params.public_expiry_date;
          }
        });
      });
    }
  });
};

const useEnsureDashboardConfig = (prefetchData: boolean = true) => {
  const queryClient = useQueryClient();
  const versionNumber = useGetDashboardVersionNumber();
  const prefetchDashboard = useGetDashboardAndInitializeMetrics(prefetchData);
  const { openErrorMessage } = useBusterNotifications();

  const method = useMemoizedFn(async (dashboardId: string) => {
    const options = dashboardQueryKeys.dashboardGetDashboard(dashboardId, versionNumber);
    let dashboardResponse = queryClient.getQueryData(options.queryKey);
    if (!dashboardResponse) {
      const res = await prefetchDashboard(dashboardId).catch((e) => {
        openErrorMessage('Failed to save metrics to dashboard. Dashboard not found');
        return null;
      });
      if (res) {
        queryClient.setQueryData(options.queryKey, res);
        dashboardResponse = res;
      }
    }

    return dashboardResponse;
  });

  return method;
};

export const useAddAndRemoveMetricsFromDashboard = () => {
  const queryClient = useQueryClient();
  const versionNumber = useGetDashboardVersionNumber();
  const { openErrorMessage } = useBusterNotifications();
  const ensureDashboardConfig = useEnsureDashboardConfig(false);

  const addAndRemoveMetrics = useMemoizedFn(
    async ({ metricIds, dashboardId }: { metricIds: string[]; dashboardId: string }) => {
      const dashboardResponse = await ensureDashboardConfig(dashboardId);

      const numberOfItemsOnDashboard: number =
        dashboardResponse?.dashboard.config.rows?.reduce(
          (acc, row) => acc + (row.items?.length || 0),
          0
        ) || 0;

      if (numberOfItemsOnDashboard > MAX_NUMBER_OF_ITEMS_ON_DASHBOARD) {
        openErrorMessage(
          `Dashboard is full, please remove some metrics before adding more. You can only have ${MAX_NUMBER_OF_ITEMS_ON_DASHBOARD} metrics on a dashboard`
        );
        return;
      }

      if (dashboardResponse) {
        const newConfig = addAndRemoveMetricsToDashboard(
          metricIds,
          dashboardResponse.dashboard.config
        );
        return dashboardsUpdateDashboard({
          id: dashboardId,
          config: newConfig
        });
      }

      openErrorMessage('Failed to save metrics to dashboard');
    }
  );

  return useMutation({
    mutationFn: addAndRemoveMetrics,
    onSuccess: (data, variables) => {
      if (data) {
        queryClient.setQueryData(
          dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, data.dashboard.version_number)
            .queryKey,
          data
        );
      }
    }
  });
};

export const useAddMetricsToDashboard = () => {
  const queryClient = useQueryClient();
  const { openErrorMessage } = useBusterNotifications();
  const ensureDashboardConfig = useEnsureDashboardConfig(false);

  const addMetricToDashboard = useMemoizedFn(
    async ({ metricIds, dashboardId }: { metricIds: string[]; dashboardId: string }) => {
      const dashboardResponse = await ensureDashboardConfig(dashboardId);

      if (dashboardResponse) {
        const newConfig = addMetricToDashboardConfig(metricIds, dashboardResponse.dashboard.config);
        return dashboardsUpdateDashboard({
          id: dashboardId,
          config: newConfig
        });
      }

      openErrorMessage('Failed to save metrics to dashboard');
    }
  );

  return useMutation({
    mutationFn: addMetricToDashboard,
    onSuccess: (data, variables) => {
      if (data) {
        queryClient.setQueryData(
          dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, data.dashboard.version_number)
            .queryKey,
          data
        );
      }
    }
  });
};

export const useRemoveMetricsFromDashboard = () => {
  const { openConfirmModal, openErrorMessage } = useBusterNotifications();
  const queryClient = useQueryClient();
  const ensureDashboardConfig = useEnsureDashboardConfig(false);

  const removeMetricFromDashboard = useMemoizedFn(
    async ({
      metricIds,
      dashboardId,
      useConfirmModal = true
    }: {
      metricIds: string[];
      dashboardId: string;
      useConfirmModal?: boolean;
    }) => {
      const method = async () => {
        const dashboardResponse = await ensureDashboardConfig(dashboardId);

        if (dashboardResponse) {
          const options = dashboardQueryKeys.dashboardGetDashboard(
            dashboardResponse.dashboard.id,
            dashboardResponse.dashboard.version_number
          );
          const newConfig = removeMetricFromDashboardConfig(
            metricIds,
            dashboardResponse.dashboard.config
          );
          queryClient.setQueryData(options.queryKey, (currentDashboard) => {
            return create(currentDashboard!, (draft) => {
              draft.dashboard.config = newConfig;
            });
          });
        }

        if (dashboardResponse) {
          const newConfig = removeMetricFromDashboardConfig(
            metricIds,
            dashboardResponse.dashboard.config
          );
          return await dashboardsUpdateDashboard({
            id: dashboardId,
            config: newConfig
          });
        }

        openErrorMessage('Failed to remove metrics from dashboard');
      };

      if (!useConfirmModal) return await method();

      return await openConfirmModal({
        title: 'Remove from dashboard',
        content:
          metricIds.length > 1
            ? 'Are you sure you want to remove these metrics from the dashboard?'
            : 'Are you sure you want to remove this metric from the dashboard?',
        onOk: method
      });
    }
  );

  return useMutation({
    mutationFn: removeMetricFromDashboard,
    onSuccess: (data) => {
      if (data) {
        queryClient.setQueryData(
          dashboardQueryKeys.dashboardGetDashboard(data.dashboard.id, data.dashboard.version_number)
            .queryKey,
          data
        );
      }
    }
  });
};
