import { useGetDashboard } from '@/api/buster_rest/dashboards';
import { useGetMetric } from '@/api/buster_rest/metrics';
import React, { useMemo, useRef } from 'react';
import { Button } from '@/components/ui/buttons';
import { Xmark } from '@/components/ui/icons';
import { Check3 } from '@/components/ui/icons/NucleoIconFilled';
import { Text } from '@/components/ui/typography';
import { useCloseVersionHistory } from '@/layouts/ChatLayout/FileContainer/FileContainerHeader/FileContainerHeaderVersionHistory';
import { cn } from '@/lib/classMerge';
import { timeFromNow, timeout } from '@/lib';
import { AppPageLayout } from '@/components/ui/layouts';
import { useSearchParams } from 'next/navigation';
import last from 'lodash/last';
import { useListVersionHistories } from './useListVersionHistories';
import { useMount } from '@/hooks';

export const VersionHistoryPanel = React.memo(
  ({ assetId, type }: { assetId: string; type: 'metric' | 'dashboard' }) => {
    const { listItems, selectedVersion, onClickVersionHistory } = useListVersionHistories({
      assetId,
      type
    });
    const bodyRef = useRef<HTMLDivElement>(null);

    useMount(async () => {
      if (bodyRef.current) {
        await timeout(200);
        const selectedNode = bodyRef.current.querySelector('.selected-version');
        if (selectedNode) {
          selectedNode.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });

    return (
      <AppPageLayout
        header={useMemo(
          () => (
            <PanelHeader />
          ),
          []
        )}
        scrollable
        headerBorderVariant="ghost"
        headerClassName="border-l">
        <div ref={bodyRef} className="mx-1.5 mb-1.5 flex flex-col">
          {listItems?.map((item) => (
            <ListItem
              key={item.version_number}
              {...item}
              selected={item.version_number === selectedVersion}
              onClickVersionHistory={onClickVersionHistory}
            />
          ))}
        </div>
      </AppPageLayout>
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
          'hover:bg-item-hover flex cursor-pointer items-center justify-between space-x-2 rounded px-2.5 py-1.5',
          selected && 'bg-item-select hover:bg-item-select selected-version'
        )}>
        <div className="flex flex-col justify-center space-y-0.5">
          <Text>{`Version ${version_number}`}</Text>
          <Text size={'xs'} variant={'secondary'}>
            {timeFromNow(updated_at, false)}
          </Text>
        </div>
        {selected && (
          <div className="text-icon-color animate-in fade-in-0 flex items-center duration-200">
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
    <div className="flex w-full items-center justify-between">
      <Text>Version History</Text>
      <Button variant="ghost" prefix={<Xmark />} onClick={removeVersionHistoryQueryParams} />
    </div>
  );
});
PanelHeader.displayName = 'PanelHeader';

VersionHistoryPanel.displayName = 'VersionHistoryPanel';

const useListDashboardVersions = ({
  assetId,
  type
}: {
  assetId: string;
  type: 'metric' | 'dashboard';
}) => {
  const selectedVersionParam = useSearchParams().get('dashboard_version_number');
  const { data: dashboardVersions } = useGetDashboard(
    {
      id: type === 'dashboard' ? assetId : undefined,
      version_number: null
    },
    (x) => x.dashboard.versions
  );

  const selectedVersion = useMemo(() => {
    if (selectedVersionParam) return parseInt(selectedVersionParam);
    return last(dashboardVersions)?.version_number;
  }, [dashboardVersions, selectedVersionParam]);

  return useMemo(() => {
    return {
      dashboardVersions,
      selectedVersion
    };
  }, [dashboardVersions, selectedVersion]);
};

const useListMetricVersions = ({
  assetId,
  type
}: {
  assetId: string;
  type: 'metric' | 'dashboard';
}) => {
  const selectedVersionParam = useSearchParams().get('metric_version_number');
  const { data: metricVersions } = useGetMetric(
    {
      id: type === 'metric' ? assetId : undefined,
      version_number: null
    },
    (x) => x.versions
  );

  const selectedVersion = useMemo(() => {
    if (selectedVersionParam) return parseInt(selectedVersionParam);
    return last(metricVersions)?.version_number;
  }, [metricVersions, selectedVersionParam]);

  return useMemo(() => {
    return {
      metricVersions,
      selectedVersion
    };
  }, [metricVersions, selectedVersion]);
};
