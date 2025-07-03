import React, { useMemo } from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import { Input } from '@/components/ui/inputs';
import { Select, type SelectItem } from '@/components/ui/select';
import { LabelAndInput } from '../Common';

export const EditPieInnerLabel = React.memo(
  ({
    pieInnerLabelAggregate,
    pieInnerLabelTitle,
    onUpdateChartConfig
  }: {
    pieInnerLabelAggregate: ChartConfigProps['pieInnerLabelAggregate'];
    pieInnerLabelTitle: ChartConfigProps['pieInnerLabelTitle'];
    onUpdateChartConfig: (config: Partial<ChartConfigProps>) => void;
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

const options: SelectItem<ChartConfigProps['pieInnerLabelAggregate']>[] = [
  { label: 'Sum', value: 'sum' },
  { label: 'Average', value: 'average' },
  { label: 'Median', value: 'median' },
  { label: 'Max', value: 'max' },
  { label: 'Min', value: 'min' },
  { label: 'Count', value: 'count' }
];

const EditPieInnerLabelAggregate: React.FC<{
  pieInnerLabelAggregate: ChartConfigProps['pieInnerLabelAggregate'];
  onUpdateChartConfig: (config: Partial<ChartConfigProps>) => void;
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
            pieInnerLabelAggregate: value as ChartConfigProps['pieInnerLabelAggregate'],
            pieInnerLabelTitle: label as string
          });
        }}
      />
    </LabelAndInput>
  );
};

const EditPieInnerLabelTitle: React.FC<{
  pieInnerLabelTitle: ChartConfigProps['pieInnerLabelTitle'];
  onUpdateChartConfig: (config: Partial<ChartConfigProps>) => void;
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
