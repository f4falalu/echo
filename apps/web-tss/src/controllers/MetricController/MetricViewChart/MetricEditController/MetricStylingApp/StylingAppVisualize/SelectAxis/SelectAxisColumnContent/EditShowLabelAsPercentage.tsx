import type { ColumnSettings } from '@buster/server-shared/metrics';
import React from 'react';
import { Switch } from '@/components/ui/switch';
import { LabelAndInput } from '../../../Common/LabelAndInput';

export const EditShowBarLabelAsPercentage: React.FC<{
  onUpdateColumnSettingConfig: (columnSettings: Partial<ColumnSettings>) => void;
  showDataLabelsAsPercentage: ColumnSettings['showDataLabelsAsPercentage'];
}> = React.memo(({ onUpdateColumnSettingConfig, showDataLabelsAsPercentage }) => {
  const onChange = (v: boolean) => {
    onUpdateColumnSettingConfig({ showDataLabelsAsPercentage: v });
  };

  return (
    <LabelAndInput label="Show label as %">
      <div className="flex justify-end">
        <Switch checked={showDataLabelsAsPercentage} onCheckedChange={onChange} />
      </div>
    </LabelAndInput>
  );
});
EditShowBarLabelAsPercentage.displayName = 'EditShowLabelAsPercentage';
