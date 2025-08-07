import { useGetMetric, useGetMetricData } from '@/api/buster_rest/metrics';
import { MetricCard } from '@/components/ui/metric';
import { useInViewport } from '@/hooks/useInViewport';
import { useChatLayoutContextSelector } from '@/layouts/ChatLayout';
import { assetParamsToRoute } from '@/lib/assets/assetParamsToRoute';
import React, { useMemo, useRef } from 'react';
import { useMetricContentThreeDotMenuItems } from './useMetricContentThreeDotMenuItems';
import { cn } from '@/lib/classMerge';

export const MetricContent = React.memo(
  ({
    metricId,
    metricVersionNumber,
    readOnly = false
  }: {
    metricId: string;
    metricVersionNumber: number | undefined;
    readOnly?: boolean;
  }) => {
    const chatId = useChatLayoutContextSelector((x) => x.chatId);
    const reportId = useChatLayoutContextSelector((x) => x.reportId) || '';
    const reportVersionNumber = useChatLayoutContextSelector((x) => x.reportVersionNumber);
    const ref = useRef<HTMLDivElement>(null);

    const [inViewport] = useInViewport(ref, {
      threshold: 0.33
    });
    const renderChart = inViewport;

    const {
      data: metric,
      isFetching: isFetchingMetric,
      error: metricError
    } = useGetMetric({
      id: metricId,
      versionNumber: metricVersionNumber
    });
    const {
      data: metricData,
      isFetching: isFetchingMetricData,
      error: metricDataError
    } = useGetMetricData({
      id: metricId,
      versionNumber: metricVersionNumber
    });

    const link = useMemo(() => {
      return assetParamsToRoute({
        type: 'metric',
        chatId,
        assetId: metricId,
        reportId,
        metricId,
        versionNumber: metricVersionNumber || undefined
      });
    }, [chatId, reportId, metricId, metricVersionNumber]);

    const threeDotMenuItems = useMetricContentThreeDotMenuItems({
      metricId,
      metricVersionNumber,
      reportId,
      reportVersionNumber,
      chatId
    });

    const error: string | undefined =
      metric?.error || metricDataError?.message || metricError?.message || undefined;

    return (
      <MetricCard
        metricLink={link}
        animate
        metricId={metricId}
        readOnly={readOnly}
        isDragOverlay={false}
        metric={metric}
        metricData={metricData}
        renderChart={renderChart}
        loading={isFetchingMetric}
        error={error}
        threeDotMenuItems={threeDotMenuItems}
        className={cn('bg-transparent')}
      />
    );
  }
);

MetricContent.displayName = 'MetricContent';
