import React, { useCallback } from 'react';
import type { BusterTableChartConfig } from './interfaces';
import { formatLabel } from '@/lib/columnFormatter';
import isEqual from 'lodash/isEqual';
import {
  type IBusterMetricChartConfig,
  type BusterChartPropsBase,
  DEFAULT_CHART_CONFIG
} from '@/api/asset_interfaces/metric';
import { useMemoizedFn } from '@/hooks';
import { useChartWrapperContextSelector } from '../chartHooks/useChartWrapperProvider';
import AppDataGrid from '@/components/ui/table/AppDataGrid/AppDataGrid';
import './TableChart.css';
import { cn } from '@/lib/classMerge';

export interface BusterTableChartProps extends BusterTableChartConfig, BusterChartPropsBase {}

const BusterTableChartBase: React.FC<
  BusterTableChartProps & {
    onChangeConfig?: (config: Partial<IBusterMetricChartConfig>) => void;
  }
> = ({
  className = '',
  onMounted,
  data,
  tableColumnOrder,
  columnLabelFormats = DEFAULT_CHART_CONFIG.columnLabelFormats,
  tableColumnWidths = DEFAULT_CHART_CONFIG.tableColumnWidths,
  readOnly = false,
  onInitialAnimationEnd,
  onChangeConfig,
  //TODO
  tableHeaderBackgroundColor,
  tableHeaderFontColor,
  animate,
  tableColumnFontColor
}) => {
  const containerWidth = useChartWrapperContextSelector(({ width }) => width);

  //THIS MUST BE A USE CALLBACK
  const onFormatHeader = useCallback(
    (value: any, columnName: string) => {
      return formatLabel(value, columnLabelFormats[columnName], true);
    },
    [columnLabelFormats]
  );
  //THIS MUST BE A USE CALLBACK
  const onFormatCell = useCallback(
    (value: any, columnName: string) => {
      return formatLabel(value, columnLabelFormats[columnName], false);
    },
    [columnLabelFormats]
  );

  const onUpdateTableColumnOrder = useMemoizedFn((columns: string[]) => {
    if (readOnly) return;
    const config: Partial<IBusterMetricChartConfig> = {
      tableColumnOrder: columns
    };

    onChangeConfig?.(config);
  });

  const onUpdateTableColumnSize = useMemoizedFn((columns: { key: string; size: number }[]) => {
    if (readOnly) return;
    const config: Partial<IBusterMetricChartConfig> = {
      tableColumnWidths: columns.reduce<Record<string, number>>((acc, { key, size }) => {
        acc[key] = size;
        return acc;
      }, {})
    };
    onChangeConfig?.(config);
  });

  const onReady = useMemoizedFn(() => {
    onMounted?.(); //I decided to remove this because it was causing a double render
    requestAnimationFrame(() => {
      onInitialAnimationEnd?.();
    });
  });

  return (
    <AppDataGrid
      className={cn('buster-table-chart', className)}
      key={data.length}
      rows={data}
      initialWidth={containerWidth}
      columnOrder={tableColumnOrder || undefined}
      columnWidths={tableColumnWidths || undefined}
      draggable={!readOnly}
      resizable={!readOnly}
      onReady={onReady}
      headerFormat={onFormatHeader}
      cellFormat={onFormatCell}
      onReorderColumns={onUpdateTableColumnOrder}
      onResizeColumns={onUpdateTableColumnSize}
    />
  );
};

export const BusterTableChart = React.memo(BusterTableChartBase, (prev, next) => {
  return (
    isEqual(prev.data, next.data) &&
    isEqual(JSON.stringify(prev.columnLabelFormats), JSON.stringify(next.columnLabelFormats)) &&
    isEqual(prev.tableColumnOrder, next.tableColumnOrder)
  );
});

export default BusterTableChart;
