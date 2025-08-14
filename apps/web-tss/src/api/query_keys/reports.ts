import type {
  GetReportIndividualResponse,
  GetReportsListRequest,
  GetReportsListResponse,
} from '@buster/server-shared/reports';
import { queryOptions } from '@tanstack/react-query';

const reportsGetList = (filters?: GetReportsListRequest) =>
  queryOptions<GetReportsListResponse>({
    queryKey: ['reports', 'list', filters || { page: 1, page_size: 5000 }] as const,
    staleTime: 10 * 1000, // 10 seconds
    initialData: { data: [], pagination: { page: 1, page_size: 5000, total: 0, total_pages: 0 } },
    initialDataUpdatedAt: 0,
  });

const reportsGetReport = (reportId: string, versionNumber?: number | 'LATEST') =>
  queryOptions<GetReportIndividualResponse>({
    queryKey: ['reports', 'get', reportId, versionNumber || 'LATEST'] as const,
    staleTime: 60 * 1000, // 60 seconds
  });

export const reportsQueryKeys = {
  reportsGetList,
  reportsGetReport,
};
