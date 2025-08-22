'use client';

import { useGetReport, useUpdateReport } from '@/api/buster_rest/reports';
import { cn } from '@/lib/utils';
import React from 'react';
import { ReportPageHeader } from './ReportPageHeader';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import DynamicReportEditor from '@/components/ui/report/DynamicReportEditor';
import { type IReportEditor } from '@/components/ui/report/ReportEditor';
import { ReportEditorSkeleton } from '@/components/ui/report/ReportEditorSkeleton';
import { useChatIndividualContextSelector } from '@/layouts/ChatLayout/ChatContext';
import { useTrackAndUpdateReportChanges } from '@/api/buster-electric/reports/hooks';
import { ShimmerText } from '@/components/ui/typography/ShimmerText';
import { GeneratingContent } from './GeneratingContent';
import { useHotkeys } from 'react-hotkeys-hook';

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
    const messageId = useChatIndividualContextSelector((x) => x.currentMessageId);

    const content = report?.content || '';
    const showGeneratingContent = messageId && isStreamingMessage;
    const commonClassName = 'sm:px-[max(64px,calc(50%-350px))]';

    const { mutate: updateReport } = useUpdateReport();

    const canUpdate = () => {
      if (isStreamingMessage || !report || readOnly) {
        console.warn('Cannot update report');
        return false;
      }
      return true;
    };

    const onChangeName = useMemoizedFn((name: string) => {
      if (!canUpdate()) {
        return;
      }
      updateReport({ reportId, name });
    });

    const onChangeContent = useMemoizedFn((content: string) => {
      if (!canUpdate()) {
        return;
      }
      updateReport({ reportId, content });
    });

    useTrackAndUpdateReportChanges({ reportId, subscribe: isStreamingMessage });

    return (
      <div
        id="report-page-controller"
        className={cn('relative h-full space-y-1.5 overflow-hidden', className)}>
        {report ? (
          <DynamicReportEditor
            value={content}
            placeholder="Start typing..."
            className={commonClassName}
            containerClassName="pt-9"
            variant="default"
            useFixedToolbarKit={false}
            onValueChange={onChangeContent}
            readOnly={readOnly || !report}
            mode={mode}
            onReady={onReadyProp}
            isStreaming={isStreamingMessage}
            preEditorChildren={
              <ReportPageHeader
                name={report?.name}
                updatedAt={report?.updated_at}
                onChangeName={onChangeName}
                className={commonClassName}
                isStreaming={isStreamingMessage}
              />
            }
            postEditorChildren={
              showGeneratingContent ? (
                <GeneratingContent messageId={messageId} className={commonClassName} />
              ) : null
            }></DynamicReportEditor>
        ) : (
          <ReportEditorSkeleton />
        )}
      </div>
    );
  }
);

ReportPageController.displayName = 'ReportPageController';
