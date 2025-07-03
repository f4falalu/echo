import React, { useMemo } from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import type { ColumnLabelFormat } from '@buster/server-shared/metrics';
import { useMemoizedFn } from '@/hooks';
import { EditReplaceMissingData } from '../StylingAppVisualize/SelectAxis/SelectAxisColumnContent/EditReplaceMissingData';

export const EditReplaceMissingValuesWithGlobal: React.FC<{
  columnLabelFormats: ChartConfigProps['columnLabelFormats'];
  onUpdateChartConfig: (config: Partial<ChartConfigProps>) => void;
}> = React.memo(({ columnLabelFormats, onUpdateChartConfig }) => {
  const mostPermissiveMissingWith = useMemo(() => {
    return Object.values(columnLabelFormats).some(
      ({ replaceMissingDataWith }) => replaceMissingDataWith === null
    )
      ? null
      : (0 as const);
  }, [columnLabelFormats]);

  const onUpdateColumnLabel = useMemoizedFn((config: Partial<ColumnLabelFormat>) => {
    const newColumnLabelFormats: ChartConfigProps['columnLabelFormats'] = Object.entries(
      columnLabelFormats
    ).reduce<ChartConfigProps['columnLabelFormats']>((acc, [key, value]) => {
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
  replaceMissingDataWith: Required<ColumnLabelFormat>['replaceMissingDataWith'];
  onUpdateColumnLabel: (config: Partial<ColumnLabelFormat>) => void;
}> = React.memo(({ replaceMissingDataWith, onUpdateColumnLabel }) => {
  return (
    <EditReplaceMissingData
      replaceMissingDataWith={replaceMissingDataWith}
      onUpdateColumnConfig={onUpdateColumnLabel}
    />
  );
});
EditReplaceMissingValuesWithColumn.displayName = 'EditReplaceMissingValuesWithColumn';
