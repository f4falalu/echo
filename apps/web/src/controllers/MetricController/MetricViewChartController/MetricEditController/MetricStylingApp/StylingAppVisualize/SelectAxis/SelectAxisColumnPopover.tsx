import type {
  ChartConfigProps,
  ChartEncodes,
  ColumnLabelFormat,
} from '@buster/server-shared/metrics';
import React from 'react';
import { Popover } from '@/components/ui/popover/Popover';
import type { SelectAxisContainerId } from './config';
import { SelectAxisDropdownContent } from './SelectAxisColumnContent';

export interface SelectAxisColumnPopoverProps {
  columnLabelFormat: ColumnLabelFormat;
  columnSetting: ChartConfigProps['columnSettings'][string];
  children: React.ReactNode;
  id: string;
  selectedChartType: ChartConfigProps['selectedChartType'];
  barGroupType: ChartConfigProps['barGroupType'];
  lineGroupType: ChartConfigProps['lineGroupType'];
  zoneId: SelectAxisContainerId;
  rowCount: number;
  metricId: string;
}

export const SelectAxisColumnPopover = React.memo(
  ({ children, ...props }: SelectAxisColumnPopoverProps) => {
    return (
      <Popover
        side="left"
        align="end"
        size={'none'}
        content={
          <SelectAxisDropdownContent {...props} className="w-full max-w-[315px] min-w-[315px]" />
        }
      >
        {children}
      </Popover>
    );
  }
);
SelectAxisColumnPopover.displayName = 'SelectAxisColumnPopover';
