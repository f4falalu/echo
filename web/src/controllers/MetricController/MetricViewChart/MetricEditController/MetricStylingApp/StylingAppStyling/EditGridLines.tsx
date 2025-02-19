import React from 'react';
import { LabelAndInput } from '../Common';
import { Switch } from 'antd';
import { IBusterMetricChartConfig } from '@/api/asset_interfaces';

export const EditGridLines: React.FC<{
  gridLines: IBusterMetricChartConfig['gridLines'];
  onUpdateChartConfig: (chartConfig: Partial<IBusterMetricChartConfig>) => void;
}> = React.memo(
  ({ gridLines, onUpdateChartConfig }) => {
    return (
      <LabelAndInput label={'Grid lines'}>
        <div className="flex justify-end">
          <Switch
            defaultChecked={gridLines}
            onChange={(v) => onUpdateChartConfig({ gridLines: v })}
          />
        </div>
      </LabelAndInput>
    );
  },
  (prev, next) => {
    return true;
  }
);
EditGridLines.displayName = 'EditGridLines';
