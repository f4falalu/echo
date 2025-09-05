import React from 'react';
import { MetricHeaderSecondaryWrapperDropdown } from '../MetricHeaderSecondaryWrapper';
import { useDashboardMetricCardThreeDotMenuItems } from './useDashboardMetricCardThreeDotMenuItems';

export const DashboardMetricItemThreeDotMenu = React.memo(
  ({
    metricId,
    metricVersionNumber,
    dashboardId,
  }: {
    metricId: string;
    metricVersionNumber: number | undefined;
    dashboardId: string;
  }) => {
    const threeDotMenuItems = useDashboardMetricCardThreeDotMenuItems({
      dashboardId,
      metricId,
      metricVersionNumber,
    });

    return <MetricHeaderSecondaryWrapperDropdown dropdownItems={threeDotMenuItems} />;
  }
);
