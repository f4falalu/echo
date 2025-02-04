import React from 'react';
import { AppPopover } from '@/components';
import { ChartEncodes, IColumnLabelFormat } from '@/components/charts';
import { SelectAxisDropdownContent } from './SelectAxisColumnContent';
import { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { SelectAxisContainerId } from './config';

interface SelectAxisColumnPopoverProps {
  columnLabelFormat: IColumnLabelFormat;
  columnSetting: IBusterMetricChartConfig['columnSettings'][string];
  children: React.ReactNode;
  id: string;
  selectedChartType: IBusterMetricChartConfig['selectedChartType'];
  barGroupType: IBusterMetricChartConfig['barGroupType'];
  lineGroupType: IBusterMetricChartConfig['lineGroupType'];
  zoneId: SelectAxisContainerId;
  selectedAxis: ChartEncodes | null;
}

export const SelectAxisColumnPopover = React.memo(
  ({ children, ...props }: SelectAxisColumnPopoverProps) => {
    return (
      <AppPopover
        trigger="click"
        performant
        destroyTooltipOnHide
        placement="leftBottom"
        content={
          <SelectAxisDropdownContent {...props} className="w-full min-w-[315px] max-w-[315px]" />
        }>
        {children}
      </AppPopover>
    );
  }
);
SelectAxisColumnPopover.displayName = 'SelectAxisColumnPopover';
