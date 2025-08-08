'use client';

import { useGetReport, useUpdateReport } from '@/api/buster_rest/reports';
import { cn } from '@/lib/utils';
import React from 'react';
import { ReportPageHeader } from './ReportPageHeader';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useDebounceFn } from '@/hooks/useDebounce';
import type { ReportElements } from '@buster/server-shared/reports';
//import DynamicReportEditor from '@/components/ui/report/DynamicReportEditor';
import { ReportEditor, type IReportEditor } from '@/components/ui/report/ReportEditor';
import { ReportEditorSkeleton } from '@/components/ui/report/ReportEditorSkeleton';

export const ReportPageController: React.FC<{
  reportId: string;
  readOnly?: boolean;
  className?: string;
  onReady?: (editor: IReportEditor) => void;
  mode?: 'default' | 'export';
}> = React.memo(
  ({ reportId, readOnly = false, className = '', onReady: onReadyProp, mode = 'default' }) => {
    const { data: report } = useGetReport({ reportId, versionNumber: undefined });

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
              mode={mode}
              onReady={onReadyProp}
            />
          </>
        ) : (
          <ReportEditorSkeleton />
        )}
      </div>
    );
  }
);

ReportPageController.displayName = 'ReportPageController';
