import { useParams, useSearch } from '@tanstack/react-router';
import { useMemo } from 'react';

const stableReportParams = (params?: { reportId?: string }) => ({
  reportId: params?.reportId || '',
});
const stableReportSearch = (search?: { report_version_number?: number }) => ({
  report_version_number: search?.report_version_number,
});

export const useGetReportParams = () => {
  const { reportId } = useParams({
    strict: false,
    select: stableReportParams,
  });
  const { report_version_number } = useSearch({
    strict: false,
    select: stableReportSearch,
  });

  return useMemo(
    () => ({
      reportId,
      reportVersionNumber: report_version_number,
    }),
    [reportId, report_version_number]
  );
};
