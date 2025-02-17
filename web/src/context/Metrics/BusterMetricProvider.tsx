import { BusterMetricsIndividualProvider } from './BusterMetricsIndividualProvider';
import React, { PropsWithChildren } from 'react';

export const BusterMetricsProvider: React.FC<PropsWithChildren> = React.memo(({ children }) => {
  return <BusterMetricsIndividualProvider>{children}</BusterMetricsIndividualProvider>;
});
BusterMetricsProvider.displayName = 'BusterMetricProvider';
