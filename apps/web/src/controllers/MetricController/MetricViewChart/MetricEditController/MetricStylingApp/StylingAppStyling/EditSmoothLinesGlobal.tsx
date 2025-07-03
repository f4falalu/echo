import React, { useMemo } from 'react';
import type { BusterMetricChartConfig } from '@/api/asset_interfaces';
import { Switch } from '@/components/ui/switch';
import { useMemoizedFn } from '@/hooks';
import { LabelAndInput } from '../Common';

export const EditSmoothLinesGlobal: React.FC<{
  columnSettings: BusterMetricChartConfig['columnSettings'];
  onUpdateChartConfig: (config: Partial<BusterMetricChartConfig>) => void;
}> = React.memo(({ columnSettings, onUpdateChartConfig }) => {
  const allSmooth = useMemo(() => {
    return Object.values(columnSettings).every((column) => column.lineType === 'smooth');
  }, [columnSettings]);

  const onChangeAllSmooth = useMemoizedFn((value: boolean) => {
    onUpdateChartConfig({
      columnSettings: Object.keys(columnSettings).reduce<BusterMetricChartConfig['columnSettings']>(
        (acc, curr) => {
          acc[curr] = { ...columnSettings[curr], lineType: value ? 'smooth' : 'normal' };
          return acc;
        },
        {}
      )
    });
  });

  return (
    <LabelAndInput label="Smooth lines">
      <div className="flex w-full justify-end">
        <Switch checked={allSmooth} onCheckedChange={onChangeAllSmooth} />
      </div>
    </LabelAndInput>
  );
});
EditSmoothLinesGlobal.displayName = 'EditSmoothLinesGlobal';
