import React from 'react';
import type { ChartConfigProps } from '@buster/server-shared/metrics';
import { Switch } from '@/components/ui/switch';
import { LabelAndInput } from '../Common';

export const EditPieShowInnerLabel = React.memo(
  ({
    pieShowInnerLabel,
    onUpdateChartConfig
  }: {
    pieShowInnerLabel: ChartConfigProps['pieShowInnerLabel'];
    onUpdateChartConfig: (config: Partial<ChartConfigProps>) => void;
  }) => {
    return (
      <LabelAndInput label="Show inner label">
        <div className="flex w-full items-center justify-end space-x-2.5">
          <Switch
            checked={pieShowInnerLabel}
            onCheckedChange={(value) => onUpdateChartConfig({ pieShowInnerLabel: value })}
          />
        </div>
      </LabelAndInput>
    );
  }
);
EditPieShowInnerLabel.displayName = 'EditPieShowInnerLabel';
