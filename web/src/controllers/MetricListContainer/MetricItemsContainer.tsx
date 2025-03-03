import { ShareAssetType, VerificationStatus, BusterMetricListItem } from '@/api/asset_interfaces';
import { makeHumanReadble, formatDate } from '@/utils';
import React, { memo, useMemo, useRef, useState } from 'react';
import { StatusBadgeIndicator, getShareStatus } from '@/components/features/lists';
import { BusterUserAvatar, Text } from '@/components/ui';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useMemoizedFn } from 'ahooks';
import { BusterListColumn, BusterListRow } from '@/components/ui/list';
import { MetricSelectedOptionPopup } from './MetricItemsSelectedPopup';
import { BusterList, ListEmptyStateWithButton } from '@/components/ui/list';
import { FavoriteStar } from '@/components/features/lists';
import { useCreateListByDate } from '@/components/ui/list/useCreateListByDate';

export const MetricItemsContainer: React.FC<{
  metrics: BusterMetricListItem[];
  className?: string;
  openNewMetricModal: () => void;
  type: 'logs' | 'metrics';
  loading: boolean;
}> = ({ type, metrics = [], className = '', loading, openNewMetricModal }) => {
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const renderedDates = useRef<Record<string, string>>({});
  const renderedOwners = useRef<Record<string, React.ReactNode>>({});
  const tableContainerRef = useRef<HTMLDivElement>(null);

  const onSelectChange = useMemoizedFn((selectedRowKeys: string[]) => {
    setSelectedRowKeys(selectedRowKeys);
  });
  const hasSelected = selectedRowKeys.length > 0;

  const logsRecord = useCreateListByDate({ data: metrics });

  const metricsByDate: BusterListRow[] = useMemo(() => {
    return Object.entries(logsRecord).flatMap(([key, metrics]) => {
      const records = metrics.map((metric) => ({
        id: metric.id,
        data: metric,
        link: createBusterRoute({
          route: BusterRoutes.APP_METRIC_ID,
          metricId: metric.id
        })
      }));
      const hasRecords = records.length > 0;
      if (!hasRecords) {
        return [];
      }
      return [
        {
          id: key,
          data: {},
          rowSection: {
            title: makeHumanReadble(key),
            secondaryTitle: String(records.length)
          }
        },
        ...records
      ];
    });
  }, [logsRecord]);

  const columns: BusterListColumn[] = useMemo(
    () => [
      {
        dataIndex: 'title',
        title: 'Title',
        render: (title, record) => (
          <TitleCell title={title} status={record?.status} metricId={record?.id} />
        )
      },
      {
        dataIndex: 'last_edited',
        title: 'Last updated',
        width: 132,
        render: (v) => {
          if (renderedDates.current[v]) {
            return renderedDates.current[v];
          }
          const date = formatDate({ date: v, format: 'lll' });
          renderedDates.current[v] = date;
          return date;
        }
      },
      { dataIndex: 'dataset_name', title: 'Dataset', width: 115 },
      {
        dataIndex: 'is_shared',
        title: 'Sharing',
        width: 65,
        render: (v) => getShareStatus({ is_shared: v })
      },
      {
        dataIndex: 'created_by_name',
        title: 'Owner',
        width: 45,
        render: (name, record) => {
          if (renderedOwners.current[name]) {
            return renderedOwners.current[name];
          }
          const avatarCell = (
            <OwnerCell name={name} image={record?.created_by_avatar || undefined} />
          );
          renderedOwners.current[name] = avatarCell;
          return avatarCell;
        }
      }
    ],
    []
  );

  return (
    <div
      ref={tableContainerRef}
      className={`${className} relative flex h-full flex-col items-center`}>
      <BusterList
        rows={metricsByDate}
        columns={columns}
        onSelectChange={onSelectChange}
        selectedRowKeys={selectedRowKeys}
        emptyState={
          <EmptyState loading={loading} type={type} openNewMetricModal={openNewMetricModal} />
        }
      />

      <MetricSelectedOptionPopup
        selectedRowKeys={selectedRowKeys}
        onSelectChange={onSelectChange}
        hasSelected={hasSelected}
      />
    </div>
  );
};

const EmptyState: React.FC<{
  loading: boolean;
  type: 'logs' | 'metrics';
  openNewMetricModal: () => void;
}> = React.memo(({ loading, type, openNewMetricModal }) => {
  if (loading) {
    return <></>;
  }

  return <MetricsEmptyState openNewMetricModal={openNewMetricModal} type={type} />;
});
EmptyState.displayName = 'EmptyState';

const MetricsEmptyState: React.FC<{
  openNewMetricModal: () => void;
  type: 'logs' | 'metrics';
}> = ({ openNewMetricModal, type }) => {
  if (type === 'logs') {
    return (
      <ListEmptyStateWithButton
        title="You don’t have any logs yet."
        description="You don’t have any logs. As soon as you do, they will start to appear here."
        buttonText="New chat"
        onClick={openNewMetricModal}
      />
    );
  }

  return (
    <ListEmptyStateWithButton
      title="You don’t have any metrics yet."
      description="You don’t have any metrics. As soon as you do, they will start to  appear here."
      buttonText="New chat"
      onClick={openNewMetricModal}
    />
  );
};

const TitleCell = React.memo<{ title: string; status: VerificationStatus; metricId: string }>(
  ({ title, status, metricId }) => {
    const onFavoriteDivClick = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>) => {
      e.stopPropagation();
    });

    return (
      <div className="flex w-full items-center space-x-2">
        <div className="flex items-center justify-center">
          <StatusBadgeIndicator status={status} />
        </div>
        <Text ellipsis={true}>{title}</Text>
        <div className="flex items-center" onClick={onFavoriteDivClick}>
          <FavoriteStar
            id={metricId}
            type={ShareAssetType.METRIC}
            iconStyle="tertiary"
            title={title}
            className="opacity-0 group-hover:opacity-100"
          />
        </div>
      </div>
    );
  }
);
TitleCell.displayName = 'TitleCell';

const OwnerCell = memo<{ name: string; image: string | null | undefined }>(({ name, image }) => (
  <div className="flex pl-0">
    <BusterUserAvatar image={image || undefined} name={name} size={18} />
  </div>
));
OwnerCell.displayName = 'OwnerCell';
