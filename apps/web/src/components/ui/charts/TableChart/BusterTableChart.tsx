import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import { cn } from '@/lib/classMerge';
import { formatLabel } from '@/lib/columnFormatter';
import { type ChartConfigProps, DEFAULT_CHART_CONFIG } from '@buster/server-shared/metrics';
import isEmpty from 'lodash/isEmpty';
import React, { useCallback } from 'react';
import { AppDataGrid } from '../../table/AppDataGrid';
import type { BusterChartPropsBase } from '../BusterChart.types';
import type { BusterTableChartConfig } from './interfaces';

export interface BusterTableChartProps extends BusterTableChartConfig, BusterChartPropsBase {}

const DEFAULT_COLUMN_ORDER: string[] = [];
const DEFAULT_COLUMN_WIDTHS: Record<string, number> = {};

const BusterTableChartBase: React.FC<BusterTableChartProps> = ({
  className = '',
  onMounted,
  data,
  tableColumnOrder,
  columnLabelFormats = DEFAULT_CHART_CONFIG.columnLabelFormats,
  tableColumnWidths = DEFAULT_CHART_CONFIG.tableColumnWidths,
  readOnly = false,
  onInitialAnimationEnd
  //TODO
  // tableHeaderBackgroundColor,
  //  tableHeaderFontColor,
  //  tableColumnFontColor,
}) => {
  // const { onUpdateMetricChartConfig, onInitializeTableColumnWidths } = useUpdateMetricChart();

  const onChangeConfig = useMemoizedFn((config: Partial<ChartConfigProps>) => {
    if (readOnly) return;
    // onUpdateMetricChartConfig({ chartConfig: config });
    alert('TODO - FIX THIS BEFORE A PR');

    if (
      (tableColumnWidths === null || isEmpty(tableColumnWidths)) &&
      !isEmpty(config.tableColumnWidths)
    ) {
      alert('TODO - FIX THIS BEFORE A PR');
      //  onInitializeTableColumnWidths(config.tableColumnWidths);
    }
  });

  const onUpdateTableColumnOrder = useMemoizedFn((columns: string[]) => {
    const config: Partial<ChartConfigProps> = {
      tableColumnOrder: columns
    };

    onChangeConfig(config);
  });

  const onUpdateTableColumnSize = useMemoizedFn((columns: { key: string; size: number }[]) => {
    if (readOnly) return;
    const config: Partial<ChartConfigProps> = {
      tableColumnWidths: columns.reduce<Record<string, number>>((acc, { key, size }) => {
        acc[key] = Number(size.toFixed(1));
        return acc;
      }, {})
    };
    onChangeConfig(config);
  });

  //THIS MUST BE A USE CALLBACK
  const onFormatHeader = useCallback(
    (value: string | number | null | Date | boolean, columnName: string) => {
      return formatLabel(value, columnLabelFormats[columnName], true);
    },
    [columnLabelFormats]
  );
  //THIS MUST BE A USE CALLBACK
  const onFormatCell = useCallback(
    (value: string | number | null | Date | boolean, columnName: string) => {
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
      columnOrder={tableColumnOrder || DEFAULT_COLUMN_ORDER}
      columnWidths={tableColumnWidths || DEFAULT_COLUMN_WIDTHS}
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
