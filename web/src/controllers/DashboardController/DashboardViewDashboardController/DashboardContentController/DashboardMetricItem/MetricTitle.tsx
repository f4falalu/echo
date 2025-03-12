import type { BusterMetric } from '@/api/asset_interfaces';
import { Title, Text } from '@/components/ui/typography';
import { DotsVertical, Trash } from '@/components/ui/icons';
import { SortableItemContext } from '@/components/ui/grid/_BusterSortableItemDragContainer';
import { useBusterMetricsContextSelector } from '@/context/Metrics';
import { useMemoizedFn } from '@/hooks';
import { Dropdown, DropdownItems } from '@/components/ui/dropdown';
import { Button } from '@/components/ui/buttons';
import Link from 'next/link';
import React, { useContext, useMemo } from 'react';
import { useRemoveMetricFromDashboard } from '@/api/buster_rest/metrics';

export const MetricTitle: React.FC<{
  title: BusterMetric['title'];
  timeFrame?: BusterMetric['time_frame'];
  description?: BusterMetric['description'];
  metricLink: string;
  isDragOverlay: boolean;
  metricId: string;
  dashboardId: string;
  allowEdit?: boolean;
}> = React.memo(
  ({
    metricId,
    allowEdit = true,
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
      <Link href={metricLink}>
        <div
          {...attributes}
          {...listeners}
          className={'group flex cursor-pointer flex-col space-y-0.5 px-4'}>
          <div className="flex w-full justify-between space-x-0.5">
            <Title
              {...titleConfig}
              as="h4"
              className="text-md! max-w-[calc(100%_-_22px)] whitespace-nowrap"
              style={{ fontSize: '14px' }}>
              {`${title}`}
            </Title>

            {isDragOverlay || !allowEdit ? (
              <></>
            ) : (
              <ThreeDotMenu
                className="absolute top-[5px] right-[12px] opacity-0 transition group-hover:opacity-100"
                dashboardId={dashboardId}
                metricId={metricId}
              />
            )}
          </div>

          <div className="flex w-full items-center overflow-hidden">
            <Text
              className={`flex w-full pr-2 text-nowrap ${
                timeFrame || description ? 'visible' : 'hidden'
              }`}
              size="sm"
              variant="secondary"
              truncate={true}>
              {timeFrame || '_'}

              {description && timeFrame && ' • '}

              {description}
            </Text>
          </div>
        </div>
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
  const { mutateAsync: removeMetricFromDashboard } = useRemoveMetricFromDashboard();

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
              metricId
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
    <div onClick={onClick} className={`w-[24px] ${className}`}>
      <Dropdown items={dropdownItems}>
        <Button variant="ghost" prefix={<DotsVertical />} />
      </Dropdown>
    </div>
  );
});
ThreeDotMenu.displayName = 'ThreeDotMenu';
