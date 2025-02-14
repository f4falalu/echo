import { queryOptions } from '@tanstack/react-query';
import type { DataSourceListItem } from './interfaces';

export const datasourceGetList = () =>
  queryOptions<DataSourceListItem[]>({
    queryKey: ['datasources', 'list'] as const,
    staleTime: 30 * 1000 // 30 seconds
  });

export const datasourceQueryKeys = {
  '/datasources/list:getDatasourcesList': datasourceGetList
};
