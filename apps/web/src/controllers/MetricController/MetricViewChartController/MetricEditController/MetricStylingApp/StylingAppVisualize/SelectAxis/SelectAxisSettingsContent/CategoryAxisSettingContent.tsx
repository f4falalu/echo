import type { ChartConfigProps } from '@buster/server-shared/metrics';
import React from 'react';
import { useUpdateMetricChart } from '@/context/Metrics/useUpdateMetricChart';
import { useMemoizedFn } from '@/hooks/useMemoizedFn';
import {
  useAxisContextBarGroupType,
  useAxisContextBarShowTotalAtTop,
  useAxisContextCategoryAxisTitle,
  useAxisContextLineGroupType,
  useAxisContextMetricId,
  useAxisContextSelectedChartType,
} from '../useSelectAxisContext';
import { EditGrouping } from './EditGrouping';
import { EditAxisTitle } from './EditShowAxisTitle';

export const CategoryAxisSettingContent: React.FC = React.memo(() => {
  const selectedChartType = useAxisContextSelectedChartType();
  const lineGroupType = useAxisContextLineGroupType();
  const barGroupType = useAxisContextBarGroupType();
  const categoryAxisTitle = useAxisContextCategoryAxisTitle();
  const barShowTotalAtTop = useAxisContextBarShowTotalAtTop();
  const metricId = useAxisContextMetricId();

  const { onUpdateMetricChartConfig: contextOnUpdateMetricChartConfig } = useUpdateMetricChart({
    metricId,
  });

  const onChangeCategoryAxisTitle = useMemoizedFn((value: string | null) => {
    contextOnUpdateMetricChartConfig({ chartConfig: { categoryAxisTitle: value } });
  });

  const onUpdateChartConfig = useMemoizedFn((chartConfig: Partial<ChartConfigProps>) => {
    contextOnUpdateMetricChartConfig({ chartConfig });
  });

  return (
    <>
      <EditAxisTitle
        label="Title"
        axisTitle={categoryAxisTitle}
        onChangeTitle={onChangeCategoryAxisTitle}
        formattedColumnTitle={'Column ID'}
      />

      <EditGrouping
        selectedChartType={selectedChartType}
        barGroupType={barGroupType}
        lineGroupType={lineGroupType}
        onUpdateChartConfig={onUpdateChartConfig}
        barShowTotalAtTop={barShowTotalAtTop}
      />
    </>
  );
});
CategoryAxisSettingContent.displayName = 'CategoryAxisSettingContent';
