import React from 'react';
import type { ColumnLabelFormat } from '@buster/server-shared/metrics';
import { InputNumber } from '@/components/ui/inputs';
import { LabelAndInput } from '../../../Common/LabelAndInput';

export const EditMultiplyBy: React.FC<{
  multiplier: ColumnLabelFormat['multiplier'];
  onUpdateColumnConfig: (columnLabelFormat: Partial<ColumnLabelFormat>) => void;
}> = React.memo(({ multiplier, onUpdateColumnConfig }) => {
  return (
    <LabelAndInput label="Multiply By" dataTestId="edit-multiply-by-input">
      <InputNumber
        placeholder="1"
        className="w-full!"
        min={0}
        value={multiplier}
        onChange={(value) =>
          onUpdateColumnConfig({
            multiplier: value ?? 1
          })
        }
      />
    </LabelAndInput>
  );
});
EditMultiplyBy.displayName = 'EditMultiplyBy';
