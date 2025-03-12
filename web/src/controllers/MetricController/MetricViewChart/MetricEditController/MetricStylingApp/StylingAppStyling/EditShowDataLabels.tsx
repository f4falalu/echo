import React from 'react';
import { LabelAndInput } from '../Common';
import { Switch } from '@/components/ui/switch';
import { WarningIcon } from '../Common/WarningIcon';

export const EditShowDataLabels: React.FC<{
  showDataLabels: boolean;
  rowCount: number;
  onUpdateColumnSettingConfig: (v: boolean) => void;
}> = React.memo(({ showDataLabels, rowCount, onUpdateColumnSettingConfig }) => {
  return (
    <LabelAndInput label={'Data labels'}>
      <div className="flex justify-end gap-x-2">
        <WarningIcon rowCount={rowCount} />
        <Switch defaultChecked={showDataLabels} onCheckedChange={onUpdateColumnSettingConfig} />
      </div>
    </LabelAndInput>
  );
});
EditShowDataLabels.displayName = 'EditShowDataLabels';
