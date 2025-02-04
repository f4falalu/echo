import React, { useMemo } from 'react';
import { LabelAndInput } from '../Common';
import { Select, Switch } from 'antd';
import { type IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { useMemoizedFn } from 'ahooks';

const options: { label: string; value: IBusterMetricChartConfig['pieLabelPosition'] }[] = [
  { label: 'Outside', value: 'outside' },
  { label: 'Inside', value: 'inside' }
];

export const EditPieLabelLocation = React.memo(
  ({
    pieLabelPosition,
    onUpdateChartConfig
  }: {
    pieLabelPosition: IBusterMetricChartConfig['pieLabelPosition'];
    onUpdateChartConfig: (config: Partial<IBusterMetricChartConfig>) => void;
  }) => {
    const selectedLabelPosition = useMemo(() => {
      return options.find((option) => option.value === pieLabelPosition)?.value || 'outside';
    }, [pieLabelPosition]);
    const hideLabel = pieLabelPosition === 'none';

    const onChangeSelect = useMemoizedFn((value: IBusterMetricChartConfig['pieLabelPosition']) => {
      onUpdateChartConfig({ pieLabelPosition: value });
    });

    const onChangeSwitch = useMemoizedFn((value: boolean) => {
      onUpdateChartConfig({
        pieLabelPosition: value ? 'inside' : 'none'
      });
    });

    return (
      <>
        <LabelAndInput label="Show label">
          <div className="flex w-full justify-end">
            <Switch checked={!hideLabel} onChange={onChangeSwitch} />
          </div>
        </LabelAndInput>
        {!hideLabel && (
          <LabelAndInput label="Label location">
            <div className="flex w-full justify-end">
              <Select
                className="w-full"
                options={options}
                defaultValue={selectedLabelPosition}
                onChange={onChangeSelect}
              />
            </div>
          </LabelAndInput>
        )}
      </>
    );
  }
);
EditPieLabelLocation.displayName = 'EditPieLabelLocation';
