'use client';

import { useGetReport, useUpdateReport } from '@/api/buster_rest/reports';
import { cn } from '@/lib/utils';
import React, { useEffect } from 'react';
import { ReportPageHeader } from './ReportPageHeader';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useDebounceFn } from '@/hooks/useDebounce';
import type { ReportElements } from '@buster/server-shared/reports';
//import DynamicReportEditor from '@/components/ui/report/DynamicReportEditor';
import { ReportEditor, type IReportEditor } from '@/components/ui/report/ReportEditor';
import {
  registerReportEditor,
  unregisterReportEditor
} from '@/components/ui/report/editorRegistry';
import { ReportEditorSkeleton } from '@/components/ui/report/ReportEditorSkeleton';

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

  const onReady = useMemoizedFn((editor: IReportEditor) => {
    registerReportEditor(reportId, editor);
  });

  useEffect(() => {
    return () => {
      unregisterReportEditor(reportId);
    };
  }, [reportId]);

  return (
    <div
      className={cn(
        'h-full space-y-1.5 overflow-y-auto pt-9 sm:px-[max(64px,calc(50%-350px))]',
        className
      )}>
      {report ? (
        <>
          <ReportPageHeader
            name={report?.name}
            updatedAt={report?.updated_at}
            onChangeName={onChangeName}
          />

          <ReportEditor
            value={content}
            placeholder="Start typing..."
            disabled={false}
            variant="default"
            useFixedToolbarKit={false}
            onValueChange={onChangeContent}
            readOnly={readOnly || !report}
            className="px-0!"
            onReady={onReady}
          />
        </>
      ) : (
        <ReportEditorSkeleton />
      )}
    </div>
  );
};
