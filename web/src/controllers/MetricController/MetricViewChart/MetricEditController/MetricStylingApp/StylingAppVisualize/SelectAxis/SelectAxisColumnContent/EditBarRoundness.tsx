import React, { useState } from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import { InputNumber } from '@/components/ui/inputs';
import { Slider } from '@/components/ui/slider';
import { ColumnSettings } from '@/api/asset_interfaces/metric/charts';
import { useMemoizedFn } from '@/hooks';

const BAR_ROUNDNESS_MIN = 0;
const BAR_ROUNDNESS_MAX = 50;

export const EditBarRoundness: React.FC<{
  barRoundness: Required<ColumnSettings>['barRoundness'];
  onUpdateColumnSettingConfig: (columnSettings: Partial<ColumnSettings>) => void;
}> = React.memo(
  ({ barRoundness, onUpdateColumnSettingConfig }) => {
    const [value, setValue] = useState<number>(barRoundness);

    const onUpdateBarRoundness = useMemoizedFn((v: number | null) => {
      onUpdateColumnSettingConfig({
        barRoundness: v as Required<ColumnSettings>['barRoundness']
      });
      setValue(v || 0);
    });

    const onUpdateBarRoundnessSlider = useMemoizedFn((v: [number]) => {
      if (v) onUpdateBarRoundness(v?.[0]);
    });

    return (
      <LabelAndInput label="Bar roundness">
        <div className="flex items-center space-x-3">
          <InputNumber
            className="max-w-[40px]"
            min={BAR_ROUNDNESS_MIN}
            max={BAR_ROUNDNESS_MAX}
            value={value}
            onChange={onUpdateBarRoundness}
          />
          <Slider
            className="w-full"
            min={BAR_ROUNDNESS_MIN}
            max={BAR_ROUNDNESS_MAX}
            defaultValue={[value]}
            onValueChange={onUpdateBarRoundnessSlider}
          />
        </div>
      </LabelAndInput>
    );
  },
  () => {
    return true;
  }
);
EditBarRoundness.displayName = 'EditBarRoundness';
