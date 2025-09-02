import React, { useRef } from 'react';
import { MetricChartCard } from '@/components/features/metrics/MetricChartCard';
import { useInViewport } from '@/hooks/useInViewport';
import { useGetChatId } from '../../../../../context/Chats/useGetChatId';
import { useGetReportParams } from '../../../../../context/Reports/useGetReportParams';
import { useMetricContentThreeDotMenuItems } from './useMetricContentThreeDotMenuItems';

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
    const chatId = useGetChatId();
    const { reportId, reportVersionNumber } = useGetReportParams();
    const ref = useRef<HTMLDivElement>(null);
    const hasBeenInViewport = useRef(false);

    const [inViewport] = useInViewport(ref, {
      threshold: 0.25,
    });
    if (inViewport && !hasBeenInViewport.current) {
      hasBeenInViewport.current = true;
    }
    const renderChart = inViewport || isExportMode || hasBeenInViewport.current;

    const threeDotMenuItems = useMetricContentThreeDotMenuItems({
      metricId,
      metricVersionNumber,
      reportId,
      reportVersionNumber,
      chatId,
    });

    return (
      <MetricChartCard
        metricId={metricId}
        useHeaderLink={!readOnly}
        versionNumber={metricVersionNumber}
        readOnly
        headerSecondaryContent={!readOnly && <div>TODO: Three dot menu</div>}
      />
    );
  }
);

MetricContent.displayName = 'MetricContent';
