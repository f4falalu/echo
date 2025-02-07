import { BusterMetricsListProvider } from './BusterMetricsListProvider';
import { BusterMetricsIndividualProvider } from './BusterMetricsIndividualProvider';
import React, { PropsWithChildren } from 'react';

export const BusterMetricsProvider: React.FC<PropsWithChildren> = React.memo(({ children }) => {
  return (
    <BusterMetricsIndividualProvider>
      <BusterMetricsListProvider>{children}</BusterMetricsListProvider>
    </BusterMetricsIndividualProvider>
  );
});
BusterMetricsProvider.displayName = 'BusterMetricProvider';
