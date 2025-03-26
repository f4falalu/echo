'use client';

import { Button } from '@/components/ui/buttons';
import { ArrowLeft, History } from '@/components/ui/icons';
import React from 'react';
import { useChatLayoutContextSelector } from '../../../ChatLayoutContext';
import last from 'lodash/last';
import first from 'lodash/first';
import { useCloseVersionHistory } from './useCloseVersionHistory';
import { useListVersionHistories } from '@/components/features/versionHistory';
import { useMemoizedFn } from '@/hooks';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useSaveMetric } from '@/api/buster_rest/metrics';
import { useUpdateDashboard } from '@/api/buster_rest/dashboards';

export const FileContainerHeaderVersionHistory = React.memo(() => {
  const removeVersionHistoryQueryParams = useCloseVersionHistory();

  return (
    <div className="flex w-full items-center justify-between gap-x-1.5">
      <ExitVersionHistoryButton removeVersionHistoryQueryParams={removeVersionHistoryQueryParams} />
      <DisplayVersionHistory removeVersionHistoryQueryParams={removeVersionHistoryQueryParams} />
    </div>
  );
});

FileContainerHeaderVersionHistory.displayName = 'FileContainerHeaderVersionHistory';

const DisplayVersionHistory = React.memo(
  ({ removeVersionHistoryQueryParams }: { removeVersionHistoryQueryParams: () => void }) => {
    const { openSuccessMessage } = useBusterNotifications();
    const selectedFile = useChatLayoutContextSelector((x) => x.selectedFile);
    const { listItems, selectedVersion } = useListVersionHistories({
      assetId: selectedFile?.id || '',
      type: selectedFile?.type as 'metric' | 'dashboard'
    });

    const { mutateAsync: saveMetric, isPending: isSavingMetric } = useSaveMetric({
      updateOnSave: true
    });
    const { mutateAsync: saveDashboard, isPending: isSavingDashboard } = useUpdateDashboard();

    const isSaving = isSavingMetric || isSavingDashboard;

    const currentVersion = first(listItems)?.version_number;
    const isSelectedVersionCurrent = selectedVersion === currentVersion;

    const onMakeCurrentVersion = useMemoizedFn(async () => {
      const params = {
        id: selectedFile?.id || '',
        update_version: true,
        restore_to_version: selectedVersion
      };

      if (selectedFile?.type === 'metric') {
        await saveMetric(params);
      }
      if (selectedFile?.type === 'dashboard') {
        await saveDashboard(params);
      }
      removeVersionHistoryQueryParams();
      openSuccessMessage('Successfully made current version');
    });

    return (
      <div className="flex space-x-1.5">
        <Button variant="ghost" prefix={<History />}>{`Version ${selectedVersion || 0}`}</Button>
        <Button
          variant="black"
          disabled={isSelectedVersionCurrent || !currentVersion}
          onClick={onMakeCurrentVersion}
          loading={isSaving}>
          Current version
        </Button>
      </div>
    );
  }
);
DisplayVersionHistory.displayName = 'DisplayVersionHistory';

const ExitVersionHistoryButton = React.memo(
  ({ removeVersionHistoryQueryParams }: { removeVersionHistoryQueryParams: () => void }) => {
    return (
      <Button variant="link" prefix={<ArrowLeft />} onClick={removeVersionHistoryQueryParams}>
        Exit version history
      </Button>
    );
  }
);
ExitVersionHistoryButton.displayName = 'ExitVersionHistoryButton';
