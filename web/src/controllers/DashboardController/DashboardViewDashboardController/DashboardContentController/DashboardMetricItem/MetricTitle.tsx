import type { BusterMetric } from '@/api/asset_interfaces';
import { Title, Text } from '@/components/ui/typography';
import { DotsVertical, Trash } from '@/components/ui/icons';
import { SortableItemContext } from '@/components/ui/grid/_BusterSortableItemDragContainer';
import { useMemoizedFn } from '@/hooks';
import { Dropdown, DropdownItems } from '@/components/ui/dropdown';
import { Button } from '@/components/ui/buttons';
import Link from 'next/link';
import React, { useContext, useMemo, useState } from 'react';
import { useRemoveMetricsFromDashboard } from '@/api/buster_rest/dashboards';
import { cn } from '@/lib/utils';

export const MetricTitle: React.FC<{
  title: BusterMetric['title'];
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
    title,
    description,
    isDragOverlay,
    metricLink,
    timeFrame
  }) => {
    const { attributes, listeners, isDragging } = useContext(SortableItemContext);

    const useEllipsis = !isDragOverlay && !isDragging;

    const titleConfig = useMemo(() => {
      return {
        ellipsis: {
          tooltip: {
            title: useEllipsis ? title : ''
          }
        }
      };
    }, [title, useEllipsis]);

    return (
      <Link className="flex px-4" href={metricLink} prefetch>
        <div
          {...attributes}
          {...listeners}
          className={'flex cursor-pointer flex-col space-y-0.5 overflow-hidden'}>
          <div className="flex w-full justify-between space-x-0.5 overflow-hidden">
            <Title
              {...titleConfig}
              as="h4"
              truncate
              className="text-md! whitespace-nowrap"
              style={{ fontSize: '14px' }}>
              {`${title}`}
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

        {isDragOverlay || readOnly ? (
          <></>
        ) : (
          <ThreeDotMenu className="" dashboardId={dashboardId} metricId={metricId} />
        )}
      </Link>
    );
  }
);
MetricTitle.displayName = 'MetricTitle';

const ThreeDotPlaceholder: React.FC<{
  className?: string;
}> = React.memo(({ className }) => {
  return (
    <div className={`relative h-[24px] w-[24px] ${className}`}>
      <Button variant="link" prefix={<DotsVertical />} />
    </div>
  );
});
ThreeDotPlaceholder.displayName = 'ThreeDotPlaceholder';

const ThreeDotMenu: React.FC<{
  className?: string;
  dashboardId: string;
  metricId: string;
}> = React.memo(({ dashboardId, metricId, className }) => {
  const { mutateAsync: removeMetricFromDashboard } = useRemoveMetricsFromDashboard();
  const [isOpen, setIsOpen] = useState(false);

  const dropdownItems: DropdownItems = useMemo(
    () => [
      {
        value: 'delete',
        label: 'Delete',
        icon: <Trash />,
        onClick: async () => {
          try {
            await removeMetricFromDashboard({
              dashboardId,
              metricIds: [metricId]
            });
          } catch (error) {
            //
          }
        }
      }
    ],
    [dashboardId, metricId]
  );

  const onClick = useMemoizedFn((e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.preventDefault();
  });

  return (
    <div
      onClick={onClick}
      className={cn(`hidden w-8.5 rounded group-hover:block`, className, isOpen && 'block')}>
      <div className="absolute right-1.5">
        <Dropdown items={dropdownItems} side="bottom" onOpenChange={setIsOpen}>
          <Button variant="ghost" className="bg-item-hover!" prefix={<DotsVertical />} />
        </Dropdown>
      </div>
    </div>
  );
});
ThreeDotMenu.displayName = 'ThreeDotMenu';
