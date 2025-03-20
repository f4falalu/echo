'use client';

import React, { useMemo, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { formatDate } from '@/lib';
import {
  BusterList,
  BusterListColumn,
  BusterListRow,
  ListEmptyStateWithButton
} from '@/components/ui/list';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useMemoizedFn } from '@/hooks';
import { DashboardSelectedOptionPopup } from './DashboardSelectedPopup';
import type { BusterDashboardListItem } from '@/api/asset_interfaces';
import { getShareStatus } from '@/components/features/metrics/StatusBadgeIndicator/helpers';
import { useCreateDashboard } from '@/api/buster_rest/dashboards';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';

const columns: BusterListColumn[] = [
  {
    dataIndex: 'name',
    title: 'Title',
    render: (data) => {
      if (data) return data;
      return 'New Dashboard';
    }
  },
  {
    dataIndex: 'last_edited',
    title: 'Last edited',
    width: 140,
    render: (data) => formatDate({ date: data, format: 'lll' })
  },
  {
    dataIndex: 'created_at',
    title: 'Created at',
    width: 140,
    render: (data) => formatDate({ date: data, format: 'lll' })
  },
  {
    dataIndex: 'sharing',
    title: 'Sharing',
    width: 65,
    render: (_, data) => getShareStatus(data)
  },
  {
    dataIndex: 'owner',
    title: 'Owner',
    width: 55,
    render: (_, data) => {
      return <Avatar image={data?.avatar_url} name={data?.name} size={18} />;
    }
  }
];

export const DashboardListContent: React.FC<{
  loading: boolean;
  dashboardsList: BusterDashboardListItem[];
  className?: string;
}> = React.memo(({ loading, dashboardsList, className = '' }) => {
  const { mutateAsync: createDashboard, isPending: isCreatingDashboard } = useCreateDashboard();
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const [selectedDashboardIds, setSelectedDashboardIds] = useState<string[]>([]);

  const rows: BusterListRow[] = useMemo(() => {
    return dashboardsList.map((dashboard) => {
      return {
        id: dashboard.id,
        data: dashboard,
        link: createBusterRoute({
          route: BusterRoutes.APP_DASHBOARD_ID,
          dashboardId: dashboard.id
        })
      };
    });
  }, [dashboardsList]);

  const onClickEmptyState = useMemoizedFn(async () => {
    const res = await createDashboard({});
    if (res?.dashboard?.id) {
      onChangePage({
        route: BusterRoutes.APP_DASHBOARD_ID,
        dashboardId: res.dashboard.id
      });
    }
  });

  return (
    <div className={`${className} relative flex h-full flex-col items-center`}>
      <BusterList
        rows={rows}
        columns={columns}
        selectedRowKeys={selectedDashboardIds}
        onSelectChange={setSelectedDashboardIds}
        emptyState={
          !loading ? (
            <ListEmptyStateWithButton
              title={`You don’t have any dashboards yet.`}
              buttonText="New dashboard"
              description={`You don’t have any dashboards. As soon as you do, they will start to  appear here.`}
              onClick={onClickEmptyState}
              loading={isCreatingDashboard}
            />
          ) : (
            <></>
          )
        }
      />

      <DashboardSelectedOptionPopup
        selectedRowKeys={selectedDashboardIds}
        onSelectChange={setSelectedDashboardIds}
        hasSelected={selectedDashboardIds.length > 0}
      />
    </div>
  );
});

DashboardListContent.displayName = 'DashboardListContent';
