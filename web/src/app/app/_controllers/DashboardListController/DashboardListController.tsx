'use client';

import React, { useState } from 'react';
import { DashboardHeader } from './DashboardHeader';
import { DashboardListContent } from './DashboardListContent';
import { useBusterDashboardListByFilter } from '@/context/Dashboards';

export const DashboardListController: React.FC = () => {
  const [dashboardListFilters, setDashboardListFilters] = useState<{
    shared_with_me?: boolean;
    only_my_dashboards?: boolean;
  }>({});
  const { list, fetched } = useBusterDashboardListByFilter(dashboardListFilters);

  return (
    <>
      <DashboardHeader
        dashboardFilters={dashboardListFilters}
        onSetDashboardListFilters={setDashboardListFilters}
      />

      <DashboardListContent loading={!fetched} dashboardsList={list} />
    </>
  );
};
