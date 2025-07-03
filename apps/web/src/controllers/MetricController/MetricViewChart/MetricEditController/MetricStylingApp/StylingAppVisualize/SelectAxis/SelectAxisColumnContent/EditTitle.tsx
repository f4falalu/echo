import React from 'react';
import type { ColumnLabelFormat } from '@/api/asset_interfaces/metric/charts';
import { Input } from '@/components/ui/inputs';
import { LabelAndInput } from '../../../Common/LabelAndInput';

export const EditTitle: React.FC<{
  displayName: ColumnLabelFormat['displayName'];
  formattedTitle: string;
  onUpdateColumnConfig: (columnLabelFormat: Partial<ColumnLabelFormat>) => void;
}> = React.memo(({ displayName, formattedTitle, onUpdateColumnConfig }) => {
  return (
    <LabelAndInput label="Title">
      <Input
        className="w-full"
        placeholder={formattedTitle}
        value={displayName || ''}
        onChange={(e) => {
          onUpdateColumnConfig({
            displayName: e.target.value
          });
        }}
      />
    </LabelAndInput>
  );
});
EditTitle.displayName = 'EditTitle';
