'use client';

import React, { useState } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardListContent } from './DashboardListContent';
import { AppContent } from '@/components/layout';
import { useBusterDashboardListByFilter } from '@/context/Dashboards';

export const DashboardListContainer: React.FC = () => {
  const [dashboardListFilters, setDashboardListFilters] = useState<{
    shared_with_me?: boolean;
    only_my_dashboards?: boolean;
  }>({});
  const { list, fetched } = useBusterDashboardListByFilter(dashboardListFilters);

  return (
    <div className={`flex h-full flex-col`}>
      <DashboardHeader
        dashboardFilters={dashboardListFilters}
        onSetDashboardListFilters={setDashboardListFilters}
      />
      <AppContent>
        <DashboardListContent loading={!fetched} dashboardsList={list} />
      </AppContent>
    </div>
  );
};
