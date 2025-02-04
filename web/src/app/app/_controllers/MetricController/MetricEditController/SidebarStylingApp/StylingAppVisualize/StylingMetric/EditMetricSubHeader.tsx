import React from 'react';
import { LabelAndInput } from '../../Common';
import type { ColumnMetaData, IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { useMemoizedFn } from 'ahooks';
import { DerivedTitleInput } from './EditDerivedHeader';

export const EditMetricSubHeader: React.FC<{
  metricSubHeader: IBusterMetricChartConfig['metricSubHeader'];
  columnLabelFormats: IBusterMetricChartConfig['columnLabelFormats'];
  metricColumnId: IBusterMetricChartConfig['metricColumnId'];
  columnMetadata: ColumnMetaData[];
  onUpdateChartConfig: (chartConfig: Partial<IBusterMetricChartConfig>) => void;
}> = React.memo(
  ({
    metricSubHeader,
    columnMetadata,
    columnLabelFormats,
    metricColumnId,
    onUpdateChartConfig
  }) => {
    const columnLabelFormat = columnLabelFormats[metricColumnId];

    const onUpdateMetricHeader = useMemoizedFn(
      (newMetricSubHeader: IBusterMetricChartConfig['metricSubHeader']) => {
        onUpdateChartConfig({ metricSubHeader: newMetricSubHeader });
      }
    );

    return (
      <LabelAndInput label={'Sub-header'}>
        <DerivedTitleInput
          type="subHeader"
          header={metricSubHeader}
          columnLabelFormat={columnLabelFormat}
          metricColumnId={metricColumnId}
          columnMetadata={columnMetadata}
          columnLabelFormats={columnLabelFormats}
          onUpdateHeaderConfig={onUpdateMetricHeader}
        />
      </LabelAndInput>
    );
  }
);
EditMetricSubHeader.displayName = 'EditMetricSubHeader';
