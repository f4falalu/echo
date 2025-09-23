import React from 'react';
import { MetricStylingApp } from './MetricStylingApp';

export const MetricEditController: React.FC<{
  metricId: string;
}> = React.memo(({ metricId }) => {
  return (
    <div className="flex h-full w-full min-w-[260px] flex-col overflow-hidden">
      <MetricStylingApp metricId={metricId} />
    </div>
  );
});

MetricEditController.displayName = 'MetricEditController';

export default MetricEditController;
