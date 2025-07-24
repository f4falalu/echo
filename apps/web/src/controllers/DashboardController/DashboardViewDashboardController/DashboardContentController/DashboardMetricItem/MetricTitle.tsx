'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useContext } from 'react';
import type { BusterMetric } from '@/api/asset_interfaces';
import { SortableItemContext } from '@/components/ui/grid/_BusterSortableItemDragContainer';
import { Text, Title } from '@/components/ui/typography';
import { useMount } from '@/hooks/useMount';
import { MetricItemCardThreeDotMenu } from './MetricItemCardThreeDotMenu';

export const MetricTitle: React.FC<{
  name: BusterMetric['name'];
  timeFrame?: BusterMetric['time_frame'];
  description?: BusterMetric['description'];
  metricLink: string;
  isDragOverlay: boolean;
  metricId: string;
  dashboardId: string;
  readOnly?: boolean;
}> = React.memo(
  ({
    metricId,
    readOnly = true,
    dashboardId,
    name,
    description,
    isDragOverlay,
    metricLink,
    timeFrame
  }) => {
    const router = useRouter();
    const { attributes, listeners } = useContext(SortableItemContext);

    useMount(() => {
      if (metricLink) router.prefetch(metricLink);
    });

    return (
      <Link className="flex" href={metricLink} prefetch {...attributes} {...listeners}>
        <div className={'flex cursor-pointer flex-col space-y-0.5 overflow-hidden'}>
          <div className="flex w-full justify-between space-x-0.5 overflow-hidden">
            <Title
              as="h4"
              truncate
              className="text-md! whitespace-nowrap"
              style={{ fontSize: '14px' }}>
              {`${name}`}
            </Title>
          </div>

          <div className="flex w-full items-center overflow-hidden">
            <Text
              className={`w-full ${timeFrame || description ? 'visible' : 'hidden'}`}
              size="sm"
              variant="secondary"
              truncate={true}>
              {timeFrame || '_'}

              {description && timeFrame && ' • '}

              {description}
            </Text>
          </div>
        </div>

        {isDragOverlay || readOnly ? null : (
          <MetricItemCardThreeDotMenu dashboardId={dashboardId} metricId={metricId} />
        )}
      </Link>
    );
  }
);
MetricTitle.displayName = 'MetricTitle';
