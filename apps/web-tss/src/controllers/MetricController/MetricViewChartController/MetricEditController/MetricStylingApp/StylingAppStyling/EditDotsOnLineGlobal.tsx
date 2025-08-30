import { type ChartConfigProps, ENABLED_DOTS_ON_LINE } from '@buster/server-shared/metrics';
import React, { useMemo } from 'react';
import { Switch } from '@/components/ui/switch';
import { LabelAndInput } from '../Common';

export const EditDotsOnLineGlobal: React.FC<{
  columnSettings: ChartConfigProps['columnSettings'];
  onUpdateChartConfig: (config: Partial<ChartConfigProps>) => void;
}> = React.memo(({ columnSettings, onUpdateChartConfig }) => {
  const allDotsOnLine = useMemo(() => {
    return Object.values(columnSettings).some((column) => column.lineSymbolSize > 0);
  }, [columnSettings]);

  const onChangeAllSmooth = (value: boolean) => {
    onUpdateChartConfig({
      columnSettings: Object.keys(columnSettings).reduce<ChartConfigProps['columnSettings']>(
        (acc, curr) => {
          acc[curr] = { ...columnSettings[curr], lineSymbolSize: value ? ENABLED_DOTS_ON_LINE : 0 };
          return acc;
        },
        {}
      ),
    });
  };

  return (
    <LabelAndInput label="Dot on lines">
      <div className="flex w-full justify-end">
        <Switch checked={allDotsOnLine} onCheckedChange={onChangeAllSmooth} />
      </div>
    </LabelAndInput>
  );
});
EditDotsOnLineGlobal.displayName = 'EditDotsOnLineGlobal';
