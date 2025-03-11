import { Popover } from '@/components/ui/tooltip/Popover';
import React from 'react';
import { BusterChartLegendItem, BusterChartLegendProps } from './interfaces';
import { LegendItem } from './LegendItem';
import { cn } from '@/lib/classMerge';
import { LegendItemDot } from './LegendDot';
import { ChartType } from '@/api/asset_interfaces/metric/charts';

export const OverflowButton: React.FC<{
  legendItems: BusterChartLegendItem[];
  onFocusClick?: BusterChartLegendProps['onFocusItem'];
  onClickItem?: BusterChartLegendProps['onClickItem'];
  onHoverItem?: BusterChartLegendProps['onHoverItem'];
}> = React.memo(({ legendItems, onFocusClick, onClickItem, onHoverItem }) => {
  return (
    <Popover
      align="end"
      side="right"
      className="max-h-[420px] max-w-[265px]! min-w-[200px] overflow-x-hidden overflow-y-auto px-0 py-1"
      content={
        <div className="flex flex-col space-y-1 p-0.5">
          {legendItems.map((item) => {
            return (
              <LegendItem
                key={item.id + item.serieName}
                item={item}
                onClickItem={onClickItem}
                onFocusItem={onFocusClick}
                onHoverItem={onHoverItem}
              />
            );
          })}
        </div>
      }>
      <div
        className={cn(
          'flex h-[24px] cursor-pointer items-center space-x-1.5 rounded-sm px-2 py-1',
          'hover:bg-item-hover'
        )}>
        <LegendItemDot type={ChartType.Bar} color={undefined} inactive={true} />
        <span className="text-sm text-nowrap select-none">Next {legendItems.length}</span>
      </div>
    </Popover>
  );
});
OverflowButton.displayName = 'OverflowButton';
