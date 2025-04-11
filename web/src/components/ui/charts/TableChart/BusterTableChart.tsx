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
import { AppDataGrid } from '@/components/ui/table/AppDataGrid';
import './TableChart.css';
import { cn } from '@/lib/classMerge';
import { useUpdateMetricChart } from '@/context/Metrics';

export interface BusterTableChartProps extends BusterTableChartConfig, BusterChartPropsBase {}

const BusterTableChartBase: React.FC<BusterTableChartProps> = ({
  className = '',
  onMounted,
  data,
  tableColumnOrder,
  columnLabelFormats = DEFAULT_CHART_CONFIG.columnLabelFormats,
  tableColumnWidths = DEFAULT_CHART_CONFIG.tableColumnWidths,
  readOnly = false,
  onInitialAnimationEnd,
  //TODO
  tableHeaderBackgroundColor,
  tableHeaderFontColor,
  tableColumnFontColor
}) => {
  const { onUpdateMetricChartConfig, onSaveMetricToServer } = useUpdateMetricChart();

  const onChangeConfig = useMemoizedFn((config: Partial<IBusterMetricChartConfig>) => {
    if (readOnly) return;
    onUpdateMetricChartConfig({ chartConfig: config });

    if (tableColumnWidths === null) {
      //if the tableColumnWidths is null, we need to save the metric to the server just to initialize the tableColumnWidths
      setTimeout(() => onSaveMetricToServer(), 0);
    }
  });

  const onUpdateTableColumnOrder = useMemoizedFn((columns: string[]) => {
    if (readOnly) return;
    const config: Partial<IBusterMetricChartConfig> = {
      tableColumnOrder: columns
    };

    onChangeConfig(config);
  });

  const onUpdateTableColumnSize = useMemoizedFn((columns: { key: string; size: number }[]) => {
    if (readOnly) return;
    const config: Partial<IBusterMetricChartConfig> = {
      tableColumnWidths: columns.reduce<Record<string, number>>((acc, { key, size }) => {
        acc[key] = Number(size.toFixed(1));
        return acc;
      }, {})
    };
    onChangeConfig(config);
  });

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

  const onReady = useMemoizedFn(() => {
    onMounted?.();
    requestAnimationFrame(() => {
      onInitialAnimationEnd?.();
    });
  });

  return (
    <AppDataGrid
      className={cn('buster-table-chart', className)}
      key={data.length}
      rows={data}
      columnOrder={tableColumnOrder || undefined}
      columnWidths={tableColumnWidths || undefined}
      sortable={!readOnly}
      resizable={!readOnly}
      draggable={!readOnly}
      onReady={onReady}
      headerFormat={onFormatHeader}
      cellFormat={onFormatCell}
      onReorderColumns={onUpdateTableColumnOrder}
      onResizeColumns={onUpdateTableColumnSize}
    />
  );
};

export const BusterTableChart = React.memo(BusterTableChartBase);

export default BusterTableChart;
