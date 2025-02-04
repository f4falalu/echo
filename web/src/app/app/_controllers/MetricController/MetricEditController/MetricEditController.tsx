import React from 'react';
import { MetricEditControllerHeader } from './MetricEditControllerHeader';

export const MetricEditController: React.FC = React.memo(() => {
  return (
    <div className="flex w-full min-w-[250px] flex-col">
      <MetricEditControllerHeader />
    </div>
  );
});

MetricEditController.displayName = 'MetricEditController';
