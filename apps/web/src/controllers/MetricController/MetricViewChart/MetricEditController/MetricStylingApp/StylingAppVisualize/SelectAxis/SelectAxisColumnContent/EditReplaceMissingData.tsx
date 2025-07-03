import React, { useMemo } from 'react';
import type { ColumnLabelFormat } from '@buster/server-shared/metrics';
import { Select, type SelectItem } from '@/components/ui/select';
import { LabelAndInput } from '../../../Common';

export const MISSING_VALUES_OPTIONS: SelectItem[] = [
  { label: 'Zero', value: '0' },
  { label: 'Do not replace', value: '🧸✂️' }
];

export const EditReplaceMissingData: React.FC<{
  replaceMissingDataWith: ColumnLabelFormat['replaceMissingDataWith'];
  onUpdateColumnConfig: (columnLabelFormat: Partial<ColumnLabelFormat>) => void;
}> = React.memo(({ replaceMissingDataWith, onUpdateColumnConfig }) => {
  const selectedValue = useMemo(() => {
    if (replaceMissingDataWith === null) return '🧸✂️';
    return 0;
  }, [replaceMissingDataWith]);

  return (
    <LabelAndInput label="Missing values">
      <Select
        items={MISSING_VALUES_OPTIONS}
        value={selectedValue || '0'}
        onChange={(v) => {
          let value: ColumnLabelFormat['replaceMissingDataWith'];
          if (v === '🧸✂️') value = null;
          else value = 0;
          onUpdateColumnConfig({ replaceMissingDataWith: value });
        }}
      />
    </LabelAndInput>
  );
});

EditReplaceMissingData.displayName = 'EditReplaceMissingData';
