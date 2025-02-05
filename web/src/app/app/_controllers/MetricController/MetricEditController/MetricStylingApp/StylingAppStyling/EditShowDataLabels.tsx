import React from 'react';
import { LabelAndInput } from '../Common';
import { Switch } from 'antd';
import { AppPopover } from '@/components/tooltip';
import { AppMaterialIcons } from '@/components/icons';
import { WarningIcon } from '../Common/WarningIcon';

export const EditShowDataLabels: React.FC<{
  showDataLabels: boolean;
  rowCount: number;
  onUpdateColumnSettingConfig: (v: boolean) => void;
}> = React.memo(
  ({ showDataLabels, rowCount, onUpdateColumnSettingConfig }) => {
    return (
      <LabelAndInput label={'Data labels'}>
        <div className="flex justify-end space-x-2">
          <WarningIcon rowCount={rowCount} />
          <Switch
            defaultChecked={showDataLabels}
            onChange={(v) => onUpdateColumnSettingConfig(v)}
          />
        </div>
      </LabelAndInput>
    );
  },
  () => {
    return true;
  }
);
EditShowDataLabels.displayName = 'EditShowDataLabels';
