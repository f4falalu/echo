import React, { useMemo } from 'react';
import type { BusterMetricChartConfig } from '@/api/asset_interfaces';
import { Input } from '@/components/ui/inputs';
import { Select, type SelectItem } from '@/components/ui/select';
import { LabelAndInput } from '../Common';

export const EditPieInnerLabel = React.memo(
  ({
    pieInnerLabelAggregate,
    pieInnerLabelTitle,
    onUpdateChartConfig
  }: {
    pieInnerLabelAggregate: BusterMetricChartConfig['pieInnerLabelAggregate'];
    pieInnerLabelTitle: BusterMetricChartConfig['pieInnerLabelTitle'];
    onUpdateChartConfig: (config: Partial<BusterMetricChartConfig>) => void;
  }) => {
    return (
      <>
        <EditPieInnerLabelAggregate
          pieInnerLabelAggregate={pieInnerLabelAggregate}
          onUpdateChartConfig={onUpdateChartConfig}
        />

        <EditPieInnerLabelTitle
          pieInnerLabelTitle={pieInnerLabelTitle}
          onUpdateChartConfig={onUpdateChartConfig}
        />
      </>
    );
  }
);
EditPieInnerLabel.displayName = 'EditPieInnerLabel';

const options: SelectItem<BusterMetricChartConfig['pieInnerLabelAggregate']>[] = [
  { label: 'Sum', value: 'sum' },
  { label: 'Average', value: 'average' },
  { label: 'Median', value: 'median' },
  { label: 'Max', value: 'max' },
  { label: 'Min', value: 'min' },
  { label: 'Count', value: 'count' }
];

const EditPieInnerLabelAggregate: React.FC<{
  pieInnerLabelAggregate: BusterMetricChartConfig['pieInnerLabelAggregate'];
  onUpdateChartConfig: (config: Partial<BusterMetricChartConfig>) => void;
}> = ({ pieInnerLabelAggregate, onUpdateChartConfig }) => {
  const selectedOption = useMemo(() => {
    return options.find((option) => option.value === pieInnerLabelAggregate) || options[0];
  }, [pieInnerLabelAggregate]);

  return (
    <LabelAndInput label="Aggregation">
      <Select
        items={options}
        value={selectedOption.value}
        onChange={(value) => {
          const label = options.find((option) => option.value === value)?.label;
          onUpdateChartConfig({
            pieInnerLabelAggregate: value as BusterMetricChartConfig['pieInnerLabelAggregate'],
            pieInnerLabelTitle: label as string
          });
        }}
      />
    </LabelAndInput>
  );
};

const EditPieInnerLabelTitle: React.FC<{
  pieInnerLabelTitle: BusterMetricChartConfig['pieInnerLabelTitle'];
  onUpdateChartConfig: (config: Partial<BusterMetricChartConfig>) => void;
}> = ({ pieInnerLabelTitle, onUpdateChartConfig }) => {
  return (
    <LabelAndInput label="Title">
      <Input
        value={pieInnerLabelTitle || ''}
        onChange={(e) => onUpdateChartConfig({ pieInnerLabelTitle: e.target.value })}
      />
    </LabelAndInput>
  );
};
