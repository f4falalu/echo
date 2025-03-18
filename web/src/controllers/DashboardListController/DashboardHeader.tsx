'use client';

import React from 'react';
import { Text } from '@/components/ui/typography';
import { Button } from '@/components/ui/buttons';
import { BusterRoutes } from '@/routes';

import { AppSegmented, SegmentedItem } from '@/components/ui/segmented';
import { useMemoizedFn } from '@/hooks';
import { Plus } from '@/components/ui/icons';
import type { DashboardsListRequest } from '@/api/request_interfaces/dashboards';
import { useCreateDashboard } from '@/api/buster_rest/dashboards';
import { useAppLayoutContextSelector } from '@/context/BusterAppLayout';

export const DashboardHeader: React.FC<{
  dashboardFilters: {
    shared_with_me?: boolean;
    only_my_dashboards?: boolean;
  };
  onSetDashboardListFilters: (v: {
    shared_with_me?: boolean;
    only_my_dashboards?: boolean;
  }) => void;
}> = React.memo(({ dashboardFilters, onSetDashboardListFilters }) => {
  const { mutateAsync: createDashboard, isPending: isCreatingDashboard } = useCreateDashboard();
  const onChangePage = useAppLayoutContextSelector((x) => x.onChangePage);
  const showFilters = true;

  const onClickNewDashboardButton = useMemoizedFn(async () => {
    const res = await createDashboard({});
    if (res?.dashboard?.id) {
      onChangePage({
        route: BusterRoutes.APP_DASHBOARD_ID,
        dashboardId: res.dashboard.id
      });
    }
  });

  return (
    <>
      <div className="flex items-center space-x-3">
        <Text>{'Dashboards'}</Text>
        {showFilters && (
          <DashboardFilters
            activeFilters={dashboardFilters}
            onChangeFilter={onSetDashboardListFilters}
          />
        )}
      </div>

      <div className="flex items-center">
        <Button prefix={<Plus />} loading={isCreatingDashboard} onClick={onClickNewDashboardButton}>
          New Dashboard
        </Button>
      </div>
    </>
  );
});

DashboardHeader.displayName = 'DashboardHeader';

const filters: SegmentedItem<string>[] = [
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

const DashboardFilters: React.FC<{
  onChangeFilter: (v: { shared_with_me?: boolean; only_my_dashboards?: boolean }) => void;
  activeFilters?: NonNullable<Omit<DashboardsListRequest, 'page_token' | 'page_size'>>;
}> = ({ onChangeFilter, activeFilters }) => {
  const selectedFilter =
    filters.find((filter) => {
      return JSON.stringify(activeFilters) === filter.value;
    }) || filters[0];

  return (
    <div className="flex items-center space-x-1">
      <AppSegmented
        options={filters}
        value={selectedFilter?.value}
        type="button"
        onChange={(v) => {
          const parsedValue = JSON.parse(v.value) as {
            shared_with_me?: boolean;
            only_my_dashboards?: boolean;
          };
          onChangeFilter(parsedValue);
        }}
      />
    </div>
  );
};
