'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import type { BusterMetric } from '@/api/asset_interfaces/metric/interfaces';
import { Text, Title } from '@/components/ui/typography';
import { useMount } from '@/hooks/useMount';
import type { DraggableAttributes, DraggableSyntheticListeners } from '@dnd-kit/core';
import type { DropdownItems } from '../dropdown';
import { MetricCardThreeMenuContainer } from './MetricCardThreeMenuContainer';
import { DotsVertical } from '../icons';
import { Button } from '../buttons';

export const MetricTitle: React.FC<{
  name: BusterMetric['name'];
  timeFrame?: BusterMetric['time_frame'];
  description?: BusterMetric['description'];
  metricLink: string;
  isDragOverlay: boolean;
  readOnly?: boolean;
  threeDotMenuItems: DropdownItems;
}> = React.memo(
  ({
    readOnly = true,
    name,
    description,
    isDragOverlay,
    metricLink,
    timeFrame,
    threeDotMenuItems
  }) => {
    const router = useRouter();

    useMount(() => {
      if (metricLink) router.prefetch(metricLink);
    });

    return (
      <>
        <div className={'flex h-full cursor-pointer flex-col space-y-0.5 overflow-hidden'}>
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
          <MetricCardThreeMenuContainer dropdownItems={threeDotMenuItems}>
            <Button variant="ghost" className="bg-item-hover!" prefix={<DotsVertical />} />
          </MetricCardThreeMenuContainer>
        )}
      </>
    );
  }
);
MetricTitle.displayName = 'MetricTitle';
