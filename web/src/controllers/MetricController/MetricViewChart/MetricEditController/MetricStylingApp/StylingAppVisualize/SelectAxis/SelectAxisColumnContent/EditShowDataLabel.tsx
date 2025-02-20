import type { ColumnSettings } from '@/components/ui/charts';
import React from 'react';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import { Switch } from 'antd';
import { WarningIcon } from '../../../Common/WarningIcon';

export const EditShowDataLabel: React.FC<{
  showDataLabels: Required<ColumnSettings>['showDataLabels'];
  rowCount: number;
  onUpdateColumnSettingConfig: (columnSettings: Partial<ColumnSettings>) => void;
}> = React.memo(
  ({ showDataLabels, rowCount, onUpdateColumnSettingConfig }) => {
    return (
      <LabelAndInput label="Show data labels">
        <div className="flex justify-end space-x-2">
          <WarningIcon rowCount={rowCount} />
          <Switch
            defaultChecked={showDataLabels}
            onChange={(v) => {
              onUpdateColumnSettingConfig({ showDataLabels: v });
            }}
          />
        </div>
      </LabelAndInput>
    );
  },
  () => {
    return true;
  }
);
EditShowDataLabel.displayName = 'EditShowDataLabel';
