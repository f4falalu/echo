'use client';

import { useGetReport, useUpdateReport } from '@/api/buster_rest/reports';
import { cn } from '@/lib/utils';
import React from 'react';
import { ReportPageHeader } from './ReportPageHeader';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useDebounceFn } from '@/hooks/useDebounce';
import type { ReportElements } from '@buster/server-shared/reports';
//import DynamicReportEditor from '@/components/ui/report/DynamicReportEditor';
import { ReportEditor } from '@/components/ui/report/ReportEditor';

export const ReportPageController: React.FC<{
  reportId: string;
  readOnly?: boolean;
  className?: string;
}> = ({ reportId, readOnly = false, className = '' }) => {
  const { data: report } = useGetReport({ reportId, versionNumber: undefined });
  // const editor = useRef<AppReportRef>(null);

  const content: ReportElements = report?.content || [];

  const { mutate: updateReport } = useUpdateReport();

  const onChangeName = useMemoizedFn((name: string) => {
    if (!report) {
      console.warn('Report not yet fetched');
      return;
    }
    updateReport({ reportId, name });
  });

  const { run: debouncedUpdateReport } = useDebounceFn(updateReport, { wait: 650 });

  const onChangeContent = useMemoizedFn((content: ReportElements) => {
    if (!report) {
      console.warn('Report not yet fetched');
      return;
    }
    debouncedUpdateReport({ reportId, content });
  });

  return (
    <div className={cn('space-y-1.5 pt-9 sm:px-[max(64px,calc(50%-350px))]', className)}>
      <ReportPageHeader
        name={report?.name}
        updatedAt={report?.updated_at}
        onChangeName={onChangeName}
      />

      <ReportEditor
        //   ref={editor}
        value={content}
        onValueChange={onChangeContent}
        readOnly={readOnly || !report}
        className="px-0!"
      />
    </div>
  );
};
