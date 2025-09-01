import React, { useCallback, useContext } from 'react';
import type { BusterMetricData } from '@/api/asset_interfaces/metric';
import { useGetMetricData } from '@/api/buster_rest/metrics';
import { MetricChartCard } from '@/components/features/metrics/MetricChartCard';
import { SortableItemContext } from '@/components/ui/grid/SortableItemContext';
import { DashboardMetricItemThreeDotMenu } from './DashboardMetricItemThreeDotMenu';

interface DashboardMetricItemBaseProps {
  metricId: string;
  metricVersionNumber: number | undefined;
  dashboardId: string;
  numberOfMetrics: number;
  className?: string;
  isDragOverlay?: boolean;
}

export const DashboardMetricItem: React.FC<DashboardMetricItemBaseProps> = React.memo(
  ({ dashboardId, metricVersionNumber, metricId, isDragOverlay = false, numberOfMetrics }) => {
    const { data: dataLength = 0 } = useGetMetricData(
      { id: metricId, versionNumber: metricVersionNumber },
      { select: useCallback((data: BusterMetricData) => data.data?.length || 0, []) }
    );
    const animate = !isDragOverlay && dataLength < 125 && numberOfMetrics <= 30;

    const { attributes, listeners } = useContext(SortableItemContext);

    return (
      <MetricChartCard
        attributes={attributes}
        listeners={listeners}
        readOnly
        metricId={metricId}
        versionNumber={metricVersionNumber}
        animate={animate}
        useHeaderLink
        headerSecondaryContent={
          !isDragOverlay && (
            <DashboardMetricItemThreeDotMenu
              metricId={metricId}
              metricVersionNumber={metricVersionNumber}
              dashboardId={dashboardId}
            />
          )
        }
      />
    );
  }
);
