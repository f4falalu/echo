// Re-export split hooks to preserve existing imports

export {
  useAddDashboardToCollection,
  useRemoveDashboardFromCollection,
} from './mutations/useCollections';
export { useCreateDashboard, useDeleteDashboards } from './mutations/useCreateDelete';
export {
  useAddAndRemoveMetricsFromDashboard,
  useAddMetricsToDashboard,
  useRemoveMetricsFromDashboard,
} from './mutations/useMetrics';
export { useSaveDashboard } from './mutations/useSaveDashboard';
export {
  useShareDashboard,
  useUnshareDashboard,
  useUpdateDashboardShare,
} from './mutations/useSharing';
export { useUpdateDashboard } from './mutations/useUpdateDashboard';
export { useUpdateDashboardConfig } from './mutations/useUpdateDashboardConfig';
export {
  prefetchGetDashboardsList,
  useGetDashboard,
  useGetDashboardsList,
  usePrefetchGetDashboardClient,
} from './queries/useGetDashboard';
