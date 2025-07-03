import React, { useMemo } from 'react';
import type { BusterMetricChartConfig } from '@/api/asset_interfaces';
import type { IColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';
import { useMemoizedFn } from '@/hooks';
import { EditReplaceMissingData } from '../StylingAppVisualize/SelectAxis/SelectAxisColumnContent/EditReplaceMissingData';

export const EditReplaceMissingValuesWithGlobal: React.FC<{
  columnLabelFormats: BusterMetricChartConfig['columnLabelFormats'];
  onUpdateChartConfig: (config: Partial<BusterMetricChartConfig>) => void;
}> = React.memo(({ columnLabelFormats, onUpdateChartConfig }) => {
  const mostPermissiveMissingWith = useMemo(() => {
    return Object.values(columnLabelFormats).some(
      ({ replaceMissingDataWith }) => replaceMissingDataWith === null
    )
      ? null
      : (0 as const);
  }, [columnLabelFormats]);

  const onUpdateColumnLabel = useMemoizedFn((config: Partial<IColumnLabelFormat>) => {
    const newColumnLabelFormats: BusterMetricChartConfig['columnLabelFormats'] = Object.entries(
      columnLabelFormats
    ).reduce<BusterMetricChartConfig['columnLabelFormats']>((acc, [key, value]) => {
      acc[key] = { ...value, ...config };
      return acc;
    }, {});

    onUpdateChartConfig({ columnLabelFormats: newColumnLabelFormats });
  });

  return (
    <EditReplaceMissingValuesWithColumn
      replaceMissingDataWith={mostPermissiveMissingWith}
      onUpdateColumnLabel={onUpdateColumnLabel}
    />
  );
});
EditReplaceMissingValuesWithGlobal.displayName = 'EditReplaceMissingValuesWithGlobal';

const EditReplaceMissingValuesWithColumn: React.FC<{
  replaceMissingDataWith: Required<IColumnLabelFormat>['replaceMissingDataWith'];
  onUpdateColumnLabel: (config: Partial<IColumnLabelFormat>) => void;
}> = React.memo(({ replaceMissingDataWith, onUpdateColumnLabel }) => {
  return (
    <EditReplaceMissingData
      replaceMissingDataWith={replaceMissingDataWith}
      onUpdateColumnConfig={onUpdateColumnLabel}
    />
  );
});
EditReplaceMissingValuesWithColumn.displayName = 'EditReplaceMissingValuesWithColumn';
