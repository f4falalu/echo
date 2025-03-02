'use client';

import React, { useState } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardListContent } from './DashboardListContent';
import { useBusterDashboardListByFilter } from '@/context/Dashboards';
import { AppPageLayout } from '@/components/ui/layouts';

export const DashboardListController: React.FC = () => {
  const [dashboardListFilters, setDashboardListFilters] = useState<{
    shared_with_me?: boolean;
    only_my_dashboards?: boolean;
  }>({});
  const { list, isFetchedDashboardsList } = useBusterDashboardListByFilter(dashboardListFilters);

  return (
    <AppPageLayout
      header={
        <DashboardHeader
          dashboardFilters={dashboardListFilters}
          onSetDashboardListFilters={setDashboardListFilters}
        />
      }>
      <DashboardListContent loading={!isFetchedDashboardsList} dashboardsList={list || []} />
    </AppPageLayout>
  );
};
