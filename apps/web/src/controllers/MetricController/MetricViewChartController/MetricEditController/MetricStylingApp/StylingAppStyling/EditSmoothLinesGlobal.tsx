import type { ChartConfigProps } from '@buster/server-shared/metrics';
import React, { useMemo } from 'react';
import { Switch } from '@/components/ui/switch';
import { LabelAndInput } from '../Common';

export const EditSmoothLinesGlobal: React.FC<{
  columnSettings: ChartConfigProps['columnSettings'];
  onUpdateChartConfig: (config: Partial<ChartConfigProps>) => void;
}> = React.memo(({ columnSettings, onUpdateChartConfig }) => {
  const allSmooth = useMemo(() => {
    return Object.values(columnSettings).every((column) => column.lineType === 'smooth');
  }, [columnSettings]);

  const onChangeAllSmooth = (value: boolean) => {
    onUpdateChartConfig({
      columnSettings: Object.keys(columnSettings).reduce<ChartConfigProps['columnSettings']>(
        (acc, curr) => {
          acc[curr] = { ...columnSettings[curr], lineType: value ? 'smooth' : 'normal' };
          return acc;
        },
        {}
      ),
    });
  };

  return (
    <LabelAndInput label="Smooth lines">
      <div className="flex w-full justify-end">
        <Switch checked={allSmooth} onCheckedChange={onChangeAllSmooth} />
      </div>
    </LabelAndInput>
  );
});
EditSmoothLinesGlobal.displayName = 'EditSmoothLinesGlobal';
