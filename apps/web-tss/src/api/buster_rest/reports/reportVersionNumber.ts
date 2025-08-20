import type { GetReportResponse } from '@buster/server-shared/reports';
import { useQuery } from '@tanstack/react-query';
import { useSearch } from '@tanstack/react-router';
import { useMemo } from 'react';
import { reportsQueryKeys } from '@/api/query_keys/reports';

const stableVersionDataSelector = (data: GetReportResponse) => data.version_number;
const stableVersionSearchSelector = (state: { report_version_number?: number | undefined }) =>
  state.report_version_number;

export const useGetReportVersionNumber = (
  reportId: string,
  versionNumber: number | 'LATEST' = 'LATEST'
) => {
  const { data: latestVersionNumber } = useQuery({
    ...reportsQueryKeys.reportsGetReport(reportId, versionNumber),
    enabled: false,
    select: stableVersionDataSelector,
  });

  const paramVersionNumber = useSearch({
    from: '/app/_app/_asset/reports/$reportId/',
    shouldThrow: false,
    select: stableVersionSearchSelector,
  });

  const selectedVersionNumber = versionNumber ?? paramVersionNumber ?? 'LATEST';

  return useMemo(
    () => ({ paramVersionNumber, selectedVersionNumber, latestVersionNumber }),
    [paramVersionNumber, selectedVersionNumber, latestVersionNumber]
  );
};
