'use client';

import { useGetReport, useUpdateReport } from '@/api/buster_rest/reports';
import { cn } from '@/lib/utils';
import React, { useRef } from 'react';
import { ReportPageHeader } from './ReportPageHeader';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useDebounceFn } from '@/hooks/useDebounce';
import type { ReportElements } from '@buster/server-shared/reports';
import DynamicReportEditor from '@/components/ui/report/DynamicReportEditor';
import type { AppReportRef, IReportEditor } from '@/components/ui/report/ReportEditor';

export const ReportPageController: React.FC<{
  reportId: string;
  readOnly?: boolean;
  className?: string;
}> = ({ reportId, readOnly = false, className = '' }) => {
  const { data: report } = useGetReport({ reportId, versionNumber: undefined });
  const editor = useRef<AppReportRef>(null);

  const content: ReportElements = report?.content || [];

  const { mutate: updateReport } = useUpdateReport();

  const onChangeName = useMemoizedFn((name: string) => {
    updateReport({ reportId, name });
  });

  const { run: debouncedUpdateReport } = useDebounceFn(updateReport, { wait: 300 });

  const onChangeContent = useMemoizedFn((content: ReportElements) => {
    debouncedUpdateReport({ reportId, content });
  });

  return (
    <div className={cn('space-y-1.5 pt-9 pb-[15vh] sm:px-[max(64px,calc(50%-350px))]', className)}>
      <ReportPageHeader
        name={report?.name}
        updatedAt={report?.updated_at}
        onChangeName={onChangeName}
      />

      <DynamicReportEditor
        ref={editor}
        value={content}
        onValueChange={onChangeContent}
        readOnly={readOnly}
        className="p-0"
      />
    </div>
  );
};
