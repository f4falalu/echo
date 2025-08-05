'use client';

import {
  prefetchGetReportsListClient,
  useGetReport,
  useGetReportsList,
  useUpdateReport
} from '@/api/buster_rest/reports';
import { cn } from '@/lib/utils';
import React from 'react';
import { ReportPageHeader } from './ReportPageHeader';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useDebounceFn } from '@/hooks/useDebounce';

export const ReportPageController: React.FC<{
  reportId: string;
  readOnly?: boolean;
  className?: string;
}> = ({ reportId, readOnly = false, className = '' }) => {
  const { data: report } = useGetReport({ reportId, versionNumber: undefined });

  const { mutate: updateReport } = useUpdateReport();

  const onChangeName = useMemoizedFn((name: string) => {
    updateReport({ reportId, name });
  });

  const { run: debouncedUpdateReport } = useDebounceFn(updateReport, { wait: 300 });

  return (
    <div className={cn('space-y-1.5 pt-9 pb-6 sm:px-[max(64px,calc(50%-350px))]', className)}>
      <ReportPageHeader
        name={report?.name}
        updatedAt={report?.updated_at}
        onChangeName={onChangeName}
      />
    </div>
  );
};
