import React from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import { Switch } from '@/components/ui/switch';
import { LabelAndInput } from '../Common';

export const EditGridLines: React.FC<{
  gridLines: ChartConfigProps['gridLines'];
  onUpdateChartConfig: (chartConfig: Partial<ChartConfigProps>) => void;
}> = React.memo(({ gridLines, onUpdateChartConfig }) => {
  return (
    <LabelAndInput label={'Grid lines'}>
      <div className="flex justify-end">
        <Switch
          checked={gridLines}
          onCheckedChange={(v) => onUpdateChartConfig({ gridLines: v })}
        />
      </div>
    </LabelAndInput>
  );
});
EditGridLines.displayName = 'EditGridLines';
