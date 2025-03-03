import React, { PropsWithChildren } from 'react';
import { BusterDashboardIndividualProvider } from './DashboardIndividualProvider';

export const BusterDashboardProvider: React.FC<PropsWithChildren> = ({ children }) => {
  return (
    <>
      <BusterDashboardIndividualProvider>{children}</BusterDashboardIndividualProvider>
    </>
  );
};
