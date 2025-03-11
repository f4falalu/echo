import { useUpdateDatasource } from '@/api/buster_rest/datasource';

export const useDatasourceUpdate = () => {
  const { mutateAsync: onUpdateDataSource } = useUpdateDatasource();

  return {
    onUpdateDataSource
  };
};
