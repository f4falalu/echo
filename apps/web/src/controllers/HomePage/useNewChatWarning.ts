import { useMemo } from 'react';
import { useListDatasources } from '@/api/buster_rest/data_source';
import { useGetDatasets } from '@/api/buster_rest/datasets';
import { useGetUserRole, useIsUserAdmin } from '@/api/buster_rest/users/useGetUserInfo';

export const useNewChatWarning = () => {
  const { data: datasets, isFetched: isDatasetsFetched } = useGetDatasets();
  const { data: datasources, isFetched: isDatasourcesFetched } = useListDatasources();
  const isAdmin = useIsUserAdmin();
  const userRole = useGetUserRole();

  const showWarning = useMemo(() => {
    if (!isDatasetsFetched || !isDatasourcesFetched) return false;
    if (datasets?.length === 0) return true;
    if (datasources?.length === 0) return true;
    return false;
  }, [datasets, datasources, isDatasetsFetched, isDatasourcesFetched]);

  return {
    showWarning,
    hasDatasets: datasets?.length > 0,
    hasDatasources: datasources?.length > 0,
    isFetched: isDatasetsFetched && isDatasourcesFetched,
    isAdmin,
    userRole,
  };
};
