import type {
  ChartConfigProps,
  ChartEncodes,
  ColumnLabelFormat,
} from '@buster/server-shared/metrics';
import type { DraggableAttributes } from '@dnd-kit/core';
import type { SyntheticListenerMap } from '@dnd-kit/core/dist/hooks/utilities';
import React from 'react';
import { Button } from '@/components/ui/buttons';
import { DotsVertical } from '@/components/ui/icons';
import type { SelectAxisContainerId } from './config';
import { SelectAxisColumnPopover } from './SelectAxisColumnPopover';
import { SelectAxisItemDragContainer } from './SelectAxisDragContainer';
import { SelectAxisItemLabel } from './SelectAxisItemLabel';
import {
  useAxisContextBarGroupType,
  useAxisContextColumnLabelFormat,
  useAxisContextColumnSetting,
  useAxisContextLineGroupType,
  useAxisContextMetricId,
  useAxisContextRowCount,
  useAxisContextSelectedAxis,
  useAxisContextSelectedChartType,
} from './useSelectAxisContext';

export const SelectAxisItemAvailableContainer = React.memo(
  React.forwardRef<
    HTMLDivElement,
    {
      id: string;
      zoneId: SelectAxisContainerId;
      style?: React.CSSProperties;
      className?: string;
      isDragging?: boolean;
      listeners?: SyntheticListenerMap;
      attributes?: DraggableAttributes;
    }
  >(({ id, zoneId, ...props }, ref) => {
    const { isDragging } = props;
    const columnLabelFormat = useAxisContextColumnLabelFormat(id);
    const columnSetting = useAxisContextColumnSetting(id);
    const selectedChartType = useAxisContextSelectedChartType();
    const barGroupType = useAxisContextBarGroupType();
    const lineGroupType = useAxisContextLineGroupType();
    const selectedAxis = useAxisContextSelectedAxis();
    const rowCount = useAxisContextRowCount();
    const metricId = useAxisContextMetricId();

    return (
      <SelectAxisItemDragContainer {...props} ref={ref}>
        <div className="flex w-full items-center justify-between space-x-2 overflow-hidden pr-1">
          <SelectAxisItemLabel id={id} columnLabelFormat={columnLabelFormat} />
          <ThreeDotMenu
            isDragging={isDragging}
            columnLabelFormat={columnLabelFormat}
            columnSetting={columnSetting}
            selectedChartType={selectedChartType}
            barGroupType={barGroupType}
            lineGroupType={lineGroupType}
            id={id}
            zoneId={zoneId}
            selectedAxis={selectedAxis}
            rowCount={rowCount}
            metricId={metricId}
          />
        </div>
      </SelectAxisItemDragContainer>
    );
  })
);

const ThreeDotMenu: React.FC<{
  isDragging?: boolean;
  columnLabelFormat: ColumnLabelFormat;
  columnSetting: ChartConfigProps['columnSettings'][string];
  selectedChartType: ChartConfigProps['selectedChartType'];
  barGroupType: ChartConfigProps['barGroupType'];
  lineGroupType: ChartConfigProps['lineGroupType'];
  zoneId: SelectAxisContainerId;
  selectedAxis: ChartEncodes | null;
  id: string;
  rowCount: number;
  metricId: string;
}> = (props) => {
  const onClickButton = (
    e: React.MouseEvent<HTMLButtonElement> | React.MouseEvent<HTMLDivElement>
  ) => {
    e.stopPropagation();
    e.preventDefault();
  };

  const ButtonNode = <Button variant="ghost" prefix={<DotsVertical />} />;
  const { isDragging } = props;

  if (isDragging) {
    return ButtonNode;
  }

  return (
    <div onClick={onClickButton} className="flex">
      <SelectAxisColumnPopover {...props}>{ButtonNode}</SelectAxisColumnPopover>
    </div>
  );
};

SelectAxisItemAvailableContainer.displayName = 'SelectAxisItemAvailableContainer';
