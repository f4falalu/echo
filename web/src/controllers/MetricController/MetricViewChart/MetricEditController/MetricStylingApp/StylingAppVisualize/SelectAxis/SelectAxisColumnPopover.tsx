import React from 'react';
import { AppPopover } from '@/components/ui';
import { ChartEncodes, IColumnLabelFormat } from '@/components/ui/charts';
import { SelectAxisDropdownContent } from './SelectAxisColumnContent';
import { ColumnMetaData, IBusterMetricChartConfig } from '@/api/asset_interfaces';
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
  rowCount: number;
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
          <SelectAxisDropdownContent {...props} className="w-full max-w-[315px] min-w-[315px]" />
        }>
        {children}
      </AppPopover>
    );
  }
);
SelectAxisColumnPopover.displayName = 'SelectAxisColumnPopover';
