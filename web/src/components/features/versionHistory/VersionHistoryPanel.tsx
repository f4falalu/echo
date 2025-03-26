import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { useGetMetric } from '@/api/buster_rest/metrics';
import React from 'react';
import last from 'lodash/last';
import { Button } from '@/components/ui/buttons';
import { Check3, Xmark } from '@/components/ui/icons';
import { Text } from '@/components/ui/typography';
import { useCloseVersionHistory } from '@/layouts/ChatLayout/FileContainer/FileContainerHeader/MetricContainerHeaderButtons/FileContainerVersionHistory';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/classMerge';
import Link from 'next/link';
import { useMemoizedFn } from '@/hooks';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';
import { formatDate, timeFromNow } from '@/lib';

export const VersionHistoryPanel = React.memo(
  ({ assetId, type }: { assetId: string; type: 'metric' | 'dashboard' }) => {
    const onChangeQueryParams = useAppLayoutContextSelector((x) => x.onChangeQueryParams);
    const { data: metricVersions, isFetched: isMetricFetched } = useGetMetric(
      { id: type === 'metric' ? assetId : undefined },
      (x) => ({ versions: x.versions, latestVersion: last(x.versions) })
    );
    const { data: dashboardVersions, isFetched: isDashboardFetched } = useGetDashboard(
      {
        id: type === 'dashboard' ? assetId : undefined
      },
      (x) => ({ versions: x.dashboard.versions, latestVersion: last(x.dashboard.versions) })
    );

    const listItems = type === 'metric' ? metricVersions?.versions : dashboardVersions?.versions;
    const selectedVersion =
      type === 'metric' ? metricVersions?.latestVersion : dashboardVersions?.latestVersion;

    const onClickVersionHistory = useMemoizedFn((versionNumber: number) => {
      onChangeQueryParams({ metric_version_number: versionNumber.toString() });
    });

    return (
      <div className="flex flex-col gap-y-2">
        <PanelHeader />

        <ScrollArea className="h-[calc(100vh-10rem)]">
          {listItems?.map((item) => (
            <ListItem
              key={item.version_number}
              {...item}
              selected={item.version_number === selectedVersion?.version_number}
              onClickVersionHistory={onClickVersionHistory}
            />
          ))}
        </ScrollArea>
      </div>
    );
  }
);

const ListItem = React.memo(
  ({
    version_number,
    updated_at,
    selected,
    onClickVersionHistory
  }: {
    version_number: number;
    updated_at: string;
    selected: boolean;
    onClickVersionHistory: (versionNumber: number) => void;
  }) => {
    return (
      <div
        onClick={() => onClickVersionHistory(version_number)}
        className={cn(
          'hover:bg-item-hover flex cursor-pointer items-center justify-between space-x-2 px-2.5 py-1.5',
          selected && 'bg-item-select hover:bg-item-select'
        )}>
        <div className="flex items-center gap-x-2">
          <Text>{`Version ${version_number}`}</Text>
          <Text variant={'secondary'}>{timeFromNow(updated_at)}</Text>
        </div>
        {selected && (
          <div className="text-icon-color flex items-center">
            <Check3 />
          </div>
        )}
      </div>
    );
  }
);
ListItem.displayName = 'ListItem';

const PanelHeader = React.memo(() => {
  const removeVersionHistoryQueryParams = useCloseVersionHistory();

  return (
    <div className="flex items-center justify-between px-4 py-2.5">
      <Text>Version History</Text>
      <Button variant="ghost" prefix={<Xmark />} onClick={removeVersionHistoryQueryParams} />
    </div>
  );
});
PanelHeader.displayName = 'PanelHeader';

VersionHistoryPanel.displayName = 'VersionHistoryPanel';
