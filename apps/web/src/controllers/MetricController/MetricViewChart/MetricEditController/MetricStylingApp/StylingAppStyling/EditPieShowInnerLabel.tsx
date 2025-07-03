import React from 'react';
import type { BusterMetricChartConfig } from '@/api/asset_interfaces';
import { Switch } from '@/components/ui/switch';
import { LabelAndInput } from '../Common';

export const EditPieShowInnerLabel = React.memo(
  ({
    pieShowInnerLabel,
    onUpdateChartConfig
  }: {
    pieShowInnerLabel: BusterMetricChartConfig['pieShowInnerLabel'];
    onUpdateChartConfig: (config: Partial<BusterMetricChartConfig>) => void;
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
