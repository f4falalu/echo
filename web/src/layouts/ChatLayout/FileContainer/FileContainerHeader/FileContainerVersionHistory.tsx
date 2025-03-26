'use client';

import { Button } from '@/components/ui/buttons';
import { ArrowLeft, History } from '@/components/ui/icons';
import React, { useMemo, useTransition } from 'react';
import { useChatLayoutContextSelector } from '../../ChatLayoutContext';
import { useGetMetric } from '@/api/buster_rest/metrics';
import last from 'lodash/last';
import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { useMemoizedFn } from '@/hooks';
import { timeout } from '@/lib';

export const FileContainerVersionHistory = React.memo(() => {
  return (
    <div className="flex w-full items-center justify-between gap-x-1.5">
      <ExitVersionHistoryButton />
      <DisplayVersionHistory />
    </div>
  );
});

FileContainerVersionHistory.displayName = 'FileContainerVersionHistory';

const DisplayVersionHistory = React.memo(() => {
  const selectedFile = useChatLayoutContextSelector((x) => x.selectedFile);
  const type = selectedFile?.type;

  const { data: metric } = useGetMetric(
    { id: type === 'metric' ? selectedFile?.id : undefined },
    (x) => ({ version_number: x.version_number, latestVersion: last(x.versions) })
  );
  const { data: dashboard } = useGetDashboard(
    {
      id: type === 'dashboard' ? selectedFile?.id : undefined
    },
    (x) => ({
      version_number: x.dashboard.version_number,
      latestVersion: last(x.dashboard.versions)
    })
  );

  const versionInfo = useMemo(() => {
    if (!metric?.version_number && !dashboard?.version_number) return null;
    if (type === 'metric') {
      return {
        isCurrent: metric?.version_number === metric?.latestVersion?.version_number,
        versionNumber: metric?.version_number
      };
    }
    if (type === 'dashboard') {
      return {
        isCurrent: dashboard?.version_number === dashboard?.latestVersion?.version_number,
        versionNumber: dashboard?.version_number
      };
    }
    return null;
  }, [type, metric, dashboard]);

  if (!versionInfo) return null;

  return (
    <div className="flex space-x-1.5">
      <Button variant="ghost" prefix={<History />}>{`Version ${versionInfo.versionNumber}`}</Button>
      <Button variant="black" disabled={!versionInfo.isCurrent}>
        Current version
      </Button>
    </div>
  );
});
DisplayVersionHistory.displayName = 'DisplayVersionHistory';

const ExitVersionHistoryButton = React.memo(() => {
  const [isPending, startTransition] = useTransition();
  const onChangeQueryParams = useAppLayoutContextSelector((x) => x.onChangeQueryParams);
  const closeSecondaryView = useChatLayoutContextSelector((x) => x.closeSecondaryView);

  const removeVersionHistoryQueryParams = useMemoizedFn(async () => {
    closeSecondaryView();
    await timeout(250);
    startTransition(() => {
      onChangeQueryParams({ metric_version_number: null, dashboard_version_number: null });
    });
  });

  return (
    <Button variant="link" prefix={<ArrowLeft />} onClick={removeVersionHistoryQueryParams}>
      Exit version history
    </Button>
  );
});
ExitVersionHistoryButton.displayName = 'ExitVersionHistoryButton';
