'use client';

import React, { useMemo } from 'react';
import { AppContentHeader } from '@/components/ui/layout/AppContentHeader';
import { Breadcrumb, Button } from 'antd';
import Link from 'next/link';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useBusterDashboardContextSelector } from '@/context/Dashboards';
import { DashboardsListEmitPayload } from '@/api/buster_socket/dashboards';
import { AppMaterialIcons, AppSegmented } from '@/components/ui';
import { useMemoizedFn } from 'ahooks';

export const DashboardHeader: React.FC<{
  dashboardFilters: {
    shared_with_me?: boolean;
    only_my_dashboards?: boolean;
  };
  onSetDashboardListFilters: (v: {
    shared_with_me?: boolean;
    only_my_dashboards?: boolean;
  }) => void;
}> = ({ dashboardFilters, onSetDashboardListFilters }) => {
  const onCreateNewDashboard = useBusterDashboardContextSelector(
    (state) => state.onCreateNewDashboard
  );
  const isCreatingDashboard = useBusterDashboardContextSelector(
    (state) => state.isCreatingDashboard
  );
  const dashboardTitle = 'Dashboards';
  const showFilters = true;

  const breadcrumbItems = useMemo(
    () => [
      {
        title: (
          <Link
            suppressHydrationWarning
            href={createBusterRoute({ route: BusterRoutes.APP_DASHBOARDS })}>
            {dashboardTitle}
          </Link>
        )
      }
    ],
    [dashboardTitle]
  );

  const onClickNewDashboardButton = useMemoizedFn(async () => {
    await onCreateNewDashboard({ rerouteToDashboard: true });
  });

  return (
    <>
      <AppContentHeader className="items-center justify-between space-x-2">
        <div className="flex space-x-3">
          <Breadcrumb className="flex items-center" items={breadcrumbItems} />
          {showFilters && (
            <DashboardFilters
              activeFilters={dashboardFilters}
              onChangeFilter={onSetDashboardListFilters}
            />
          )}
        </div>

        <div className="flex items-center">
          <Button
            type="default"
            icon={<AppMaterialIcons icon="add" />}
            loading={isCreatingDashboard}
            onClick={onClickNewDashboardButton}>
            New Dashboard
          </Button>
        </div>
      </AppContentHeader>
    </>
  );
};

const DashboardFilters: React.FC<{
  onChangeFilter: (v: { shared_with_me?: boolean; only_my_dashboards?: boolean }) => void;
  activeFilters?: NonNullable<
    Omit<DashboardsListEmitPayload['payload'], 'page_token' | 'page_size'>
  >;
}> = ({ onChangeFilter, activeFilters }) => {
  const filters = [
    {
      label: 'All ',
      value: JSON.stringify({})
    },
    {
      label: 'My dashboards',
      value: JSON.stringify({
        only_my_dashboards: true
      })
    },
    {
      label: 'Shared with me',
      value: JSON.stringify({
        shared_with_me: true
      })
    }
  ];
  const selectedFilter =
    filters.find((filter) => {
      return JSON.stringify(activeFilters) === filter.value;
    }) || filters[0];

  return (
    <div className="flex items-center space-x-1">
      <AppSegmented
        options={filters}
        value={selectedFilter?.value}
        onChange={(v) => {
          const parsedValue = JSON.parse(v as string) as {
            shared_with_me?: boolean;
            only_my_dashboards?: boolean;
          };
          onChangeFilter(parsedValue);
        }}
      />
    </div>
  );
};
