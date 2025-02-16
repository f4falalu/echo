import { useMemoizedFn } from 'ahooks';
import last from 'lodash/last';
import { MutableRefObject } from 'react';
import { IBusterMetric } from '../interfaces';
import { useBusterWebSocket } from '../../BusterWebSocket';
import { useUserConfigContextSelector } from '../../Users';
import { useBusterNotifications } from '../../BusterNotifications';
import { useBusterDashboardContextSelector } from '../../Dashboards';

export const useUpdateMetricAssosciations = ({
  getMetricMemoized
}: {
  getMetricMemoized: ({ metricId }: { metricId?: string }) => IBusterMetric;
}) => {
  const busterSocket = useBusterWebSocket();
  const userFavorites = useUserConfigContextSelector((state) => state.userFavorites);
  const refreshFavoritesList = useUserConfigContextSelector((x) => x.refreshFavoritesList);
  const removeItemFromIndividualDashboard = useBusterDashboardContextSelector(
    (state) => state.removeItemFromIndividualDashboard
  );

  const { openConfirmModal } = useBusterNotifications();

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
        await refreshFavoritesList();
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
      const currentMetric = getMetricMemoized({ metricId });
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
        await refreshFavoritesList();
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

  return {
    saveMetricToDashboard,
    saveMetricToCollection,
    removeMetricFromDashboard,
    removeMetricFromCollection,
    deleteMetric
  };
};
