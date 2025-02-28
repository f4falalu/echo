'use client';

import React, { useMemo, useState } from 'react';
import { AppContentPage } from '@/components/ui/layouts/AppContentPage';
import { useBusterDashboardContextSelector } from '@/context/Dashboards';
import { Avatar } from '@/components/ui/avatar';
import { formatDate } from '@/lib';
import { BusterList, BusterListColumn, BusterListRow } from '@/components/ui/list';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { getShareStatus } from '@/components/features/lists';
import { ListEmptyStateWithButton } from '@/components/ui/list';
import { useMemoizedFn } from 'ahooks';
import { DashboardSelectedOptionPopup } from './DashboardSelectedPopup';
import type { BusterDashboardListItem } from '@/api/asset_interfaces';

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
    width: 120,
    render: (data) => formatDate({ date: data, format: 'lll' })
  },
  {
    dataIndex: 'created_at',
    title: 'Created at',
    width: 120,
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
}> = ({ loading, dashboardsList, className = '' }) => {
  const onCreateNewDashboard = useBusterDashboardContextSelector(
    (state) => state.onCreateNewDashboard
  );
  const isCreatingDashboard = useBusterDashboardContextSelector(
    (state) => state.isCreatingDashboard
  );
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
    await onCreateNewDashboard({ rerouteToDashboard: true });
  });

  return (
    <AppContentPage>
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
    </AppContentPage>
  );
};
