'use client';

import { useGetReport, useUpdateReport } from '@/api/buster_rest/reports';
import { cn } from '@/lib/utils';
import React from 'react';
import { ReportPageHeader } from './ReportPageHeader';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { useDebounceFn } from '@/hooks/useDebounce';
import type { ReportElementsWithIds } from '@buster/server-shared/reports';
import DynamicReportEditor from '@/components/ui/report/DynamicReportEditor';
import { type IReportEditor } from '@/components/ui/report/ReportEditor';
import { ReportEditorSkeleton } from '@/components/ui/report/ReportEditorSkeleton';
import { useChatIndividualContextSelector } from '@/layouts/ChatLayout/ChatContext';
import { useTrackAndUpdateReportChanges } from '@/api/buster-electric/reports/hooks';

export const ReportPageController: React.FC<{
  reportId: string;
  readOnly?: boolean;
  className?: string;
  onReady?: (editor: IReportEditor) => void;
  mode?: 'default' | 'export';
}> = React.memo(
  ({ reportId, readOnly = false, className = '', onReady: onReadyProp, mode = 'default' }) => {
    const { data: report } = useGetReport({ reportId, versionNumber: undefined });
    const isStreamingMessage = useChatIndividualContextSelector((x) => x.isStreamingMessage);

    const content: ReportElementsWithIds = report?.content || [];

    const { mutate: updateReport } = useUpdateReport();

    const onChangeName = useMemoizedFn((name: string) => {
      if (!report) {
        console.warn('Report not yet fetched');
        return;
      }
      updateReport({ reportId, name });
    });

    const { run: debouncedUpdateReport } = useDebounceFn(updateReport, { wait: 650 });

    const onChangeContent = useMemoizedFn((content: ReportElementsWithIds) => {
      if (!report) {
        console.warn('Report not yet fetched');
        return;
      }
      debouncedUpdateReport({ reportId, content });
    });

    const commonClassName = 'sm:px-[max(64px,calc(50%-350px))]';

    useTrackAndUpdateReportChanges({ reportId, subscribe: isStreamingMessage });

    return (
      <div className={cn('h-full space-y-1.5 overflow-y-auto pt-9', className)}>
        <div
          className={cn(
            'absolute right-5 bottom-5 h-15 w-15 animate-bounce rounded-full',
            isStreamingMessage ? 'bg-purple-400' : 'bg-green-400'
          )}
        />
        {report ? (
          <>
            <ReportPageHeader
              name={report?.name}
              updatedAt={report?.updated_at}
              onChangeName={onChangeName}
              className={commonClassName}
              isStreaming={isStreamingMessage}
            />

            <DynamicReportEditor
              value={content}
              placeholder="Start typing..."
              disabled={false}
              className={commonClassName}
              variant="default"
              useFixedToolbarKit={false}
              onValueChange={onChangeContent}
              readOnly={readOnly || !report}
              mode={mode}
              onReady={onReadyProp}
              isStreaming={isStreamingMessage}
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
