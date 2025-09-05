import React, { useRef } from 'react';
import { MetricChartCard } from '@/components/features/metrics/MetricChartCard';
import { ReportMetricThreeDotMenu } from '@/components/features/metrics/ReportMetricItem';
import { useInViewport } from '@/hooks/useInViewport';

export const MetricContent = React.memo(
  ({
    metricId,
    metricVersionNumber,
    isExportMode = false,
    readOnly = false,
  }: {
    metricId: string;
    metricVersionNumber: number | undefined;
    readOnly?: boolean;
    isExportMode?: boolean;
    className?: string;
  }) => {
    const ref = useRef<HTMLDivElement>(null);
    const hasBeenInViewport = useRef(false);

    const [inViewport] = useInViewport(ref, {
      threshold: 0.25,
    });
    if (inViewport && !hasBeenInViewport.current) {
      hasBeenInViewport.current = true;
    }
    const renderChart = inViewport || isExportMode || hasBeenInViewport.current;

    return (
      <MetricChartCard
        ref={ref}
        metricId={metricId}
        useHeaderLink={!readOnly}
        versionNumber={metricVersionNumber}
        readOnly
        renderChartContent={renderChart}
        animate={!isExportMode}
        headerSecondaryContent={
          !readOnly && (
            <ReportMetricThreeDotMenu
              metricId={metricId}
              metricVersionNumber={metricVersionNumber}
            />
          )
        }
      />
    );
  }
);

MetricContent.displayName = 'MetricContent';
