import React, { PropsWithChildren } from 'react';
import { BusterDashboardListProvider } from './DashboardListProvider';
import { BusterDashboardIndividualProvider } from './DashboardIndividualProvider';

export const BusterDashboardProvider: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <BusterDashboardListProvider>
        <BusterDashboardIndividualProvider>{children}</BusterDashboardIndividualProvider>
      </BusterDashboardListProvider>
    </>
  );
};
