import React from 'react';
import { LabelAndInput } from '../Common';
import { IBusterMetricChartConfig } from '@/api/asset_interfaces';
import { Switch } from 'antd';
import { AppTooltip } from '@/components/ui';

export const EditPieShowInnerLabel = React.memo(
  ({
    pieShowInnerLabel,
    onUpdateChartConfig
  }: {
    pieShowInnerLabel: IBusterMetricChartConfig['pieShowInnerLabel'];
    onUpdateChartConfig: (config: Partial<IBusterMetricChartConfig>) => void;
  }) => {
    return (
      <LabelAndInput label="Show inner label">
        <div className="flex w-full items-center justify-end space-x-2.5">
          <AppTooltip mouseEnterDelay={0.25}>
            <Switch
              defaultChecked={pieShowInnerLabel}
              onChange={(value) => onUpdateChartConfig({ pieShowInnerLabel: value })}
            />
          </AppTooltip>
        </div>
      </LabelAndInput>
    );
  }
);
EditPieShowInnerLabel.displayName = 'EditPieShowInnerLabel';
