import React, { useMemo } from 'react';
import { Card, CardHeader } from '@/components/ui/card/CardBase';
import { MetricTitle } from './MetricTitle';
import type { BusterMetric, BusterMetricData } from '@/api/asset_interfaces/metric';
import { BusterChartDynamic } from '@/components/ui/charts/BusterChartDynamic';
import { cn } from '@/lib/utils';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import type { DropdownItems } from '../dropdown';
import Link from 'next/link';

export const MetricCard = React.memo(
  React.forwardRef<
    HTMLDivElement,
    {
      className?: string;
      metricId: string;
      metricLink: string;
      isDragOverlay: boolean;
      readOnly: boolean;
      metricData: BusterMetricData | undefined;
      metric:
        | Pick<BusterMetric, 'name' | 'time_frame' | 'chart_config' | 'description'>
        | undefined;
      renderChart: boolean;
      loading: boolean;
      error: string | undefined;
      animate: boolean;
      onInitialAnimationEnd?: () => void;
      attributes?: DraggableAttributes;
      listeners?: DraggableSyntheticListeners;
      threeDotMenuItems: DropdownItems;
    }
  >(
    (
      {
        className = '',
        metricId,
        metricLink,
        readOnly,
        metricData,
        metric,
        isDragOverlay,
        renderChart = true,
        loading = false,
        animate = true,
        error,
        attributes,
        listeners,
        threeDotMenuItems,
        onInitialAnimationEnd
      },
      ref
    ) => {
      const isTable = metric?.chart_config?.selectedChartType === 'table';
      const chartOptions = metric?.chart_config;
      const data = metricData?.data || null;
      const hideChart = isDragOverlay && data && data.length > 50;

      return (
        <Card
          ref={ref}
          className={cn('metric-item flex h-full w-full flex-col overflow-auto', className)}>
          <Link className="swag flex" href={metricLink} prefetch {...attributes} {...listeners}>
            <CardHeader
              size="small"
              data-testid={`metric-item-${metricId}`}
              className="hover:bg-item-hover group relative min-h-13! w-full justify-center overflow-hidden border-b px-4 py-2">
              <MetricTitle
                name={metric?.name || ''}
                timeFrame={metric?.time_frame}
                metricLink={metricLink}
                isDragOverlay={false}
                readOnly={readOnly}
                description={metric?.description}
                threeDotMenuItems={threeDotMenuItems}
              />
            </CardHeader>
          </Link>

          <div
            className={cn(
              'h-full w-full overflow-hidden bg-transparent',
              isTable ? '' : 'p-3',
              isDragOverlay ? 'pointer-events-none' : 'pointer-events-auto'
            )}>
            {renderChart &&
              chartOptions &&
              (!hideChart ? (
                <BusterChartDynamic
                  data={data}
                  loading={loading}
                  error={error}
                  onInitialAnimationEnd={onInitialAnimationEnd}
                  animate={!isDragOverlay && animate}
                  animateLegend={false}
                  columnMetadata={metricData?.data_metadata?.column_metadata}
                  readOnly={true}
                  {...chartOptions}
                />
              ) : (
                <div className="bg-gray-light/10 h-full w-full rounded" />
              ))}
          </div>
        </Card>
      );
    }
  )
);
