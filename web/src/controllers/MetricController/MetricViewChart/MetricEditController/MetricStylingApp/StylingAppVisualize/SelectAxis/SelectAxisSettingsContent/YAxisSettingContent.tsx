import React, { useMemo } from 'react';
import { useSelectAxisContextSelector } from '../useSelectAxisContext';
import { SelectAxisContainerId } from '../config';
import { EditShowAxisTitle } from './EditShowAxisTitle';
import type { ColumnLabelFormat } from '@/components/charts/interfaces';
import { formatLabel } from '@/utils';
import { useMemoizedFn } from 'ahooks';
import { useBusterMetricsIndividualContextSelector } from '@/context/Metrics';
import { EditShowAxisLabel } from './EditShowAxisLabel';
import { EditAxisScale } from './EditAxisScale';
import { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { AXIS_TITLE_SEPARATOR } from '@/components/charts/commonHelpers';

export const YAxisSettingContent: React.FC<{
  zoneId: SelectAxisContainerId;
}> = React.memo(({}) => {
  const onUpdateMetricChartConfig = useBusterMetricsIndividualContextSelector(
    ({ onUpdateMetricChartConfig }) => onUpdateMetricChartConfig
  );
  const yAxisAxisTitle = useSelectAxisContextSelector((x) => x.yAxisAxisTitle);
  const selectedAxis = useSelectAxisContextSelector((x) => x.selectedAxis);
  const columnLabelFormats = useSelectAxisContextSelector((x) => x.columnLabelFormats);
  const yAxisShowAxisLabel = useSelectAxisContextSelector((x) => x.yAxisShowAxisLabel);
  const yAxisScaleType = useSelectAxisContextSelector((x) => x.yAxisScaleType);
  const yAxisShowAxisTitle = useSelectAxisContextSelector((x) => x.yAxisShowAxisTitle);

  const yAxis: string[] = useMemo(() => {
    return selectedAxis?.y || [];
  }, [selectedAxis]);

  const assosciatedColumnLabelFormats: ColumnLabelFormat[] = useMemo(() => {
    return yAxis.map((x) => columnLabelFormats[x]) || [];
  }, [columnLabelFormats, yAxis]);

  const formattedColumnTitle: string = useMemo(() => {
    return yAxis
      .map((columnId) => {
        return formatLabel(columnId, columnLabelFormats[columnId], true);
      })
      .join(AXIS_TITLE_SEPARATOR);
  }, [yAxisAxisTitle, yAxis, assosciatedColumnLabelFormats]);

  const onChangeAxisTitle = useMemoizedFn((value: string | null) => {
    onUpdateMetricChartConfig({
      chartConfig: {
        yAxisAxisTitle: value
      }
    });
  });

  const onChangeShowAxisLabel = useMemoizedFn((value: boolean) => {
    onUpdateMetricChartConfig({
      chartConfig: {
        yAxisShowAxisLabel: value
      }
    });
  });

  const onChangeAxisScale = useMemoizedFn(
    (yAxisScaleType: IBusterMetricChartConfig['yAxisScaleType']) => {
      onUpdateMetricChartConfig({
        chartConfig: {
          yAxisScaleType
        }
      });
    }
  );

  const onChangeShowAxisTitle = useMemoizedFn((value: boolean) => {
    onUpdateMetricChartConfig({
      chartConfig: {
        yAxisShowAxisTitle: value
      }
    });
  });

  return (
    <>
      <EditShowAxisTitle
        axisTitle={yAxisAxisTitle}
        formattedColumnTitle={formattedColumnTitle}
        onChangeAxisTitle={onChangeAxisTitle}
        showAxisTitle={yAxisShowAxisTitle}
        onChangeShowAxisTitle={onChangeShowAxisTitle}
      />

      <EditShowAxisLabel
        showAxisLabel={yAxisShowAxisLabel}
        onChangeShowAxisLabel={onChangeShowAxisLabel}
      />

      <EditAxisScale scaleType={yAxisScaleType} onChangeAxisScale={onChangeAxisScale} />
    </>
  );
});
YAxisSettingContent.displayName = 'YAxisSettingContent';
