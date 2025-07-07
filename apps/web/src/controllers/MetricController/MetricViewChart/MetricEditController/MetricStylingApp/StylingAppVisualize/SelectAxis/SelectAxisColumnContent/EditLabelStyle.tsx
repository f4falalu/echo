import React, { useMemo } from 'react';
import type { ColumnLabelFormat } from '@buster/server-shared/metrics';
import { AppSegmented, type SegmentedItem } from '@/components/ui/segmented';
import { useMemoizedFn } from '@/hooks';
import { isDateColumnType, isNumericColumnType } from '@/lib';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import { ColumnTypeIcon } from '../config';

export const EditLabelStyle: React.FC<{
  onUpdateColumnConfig: (columnLabelFormat: Partial<ColumnLabelFormat>) => void;
  style: ColumnLabelFormat['style'];
  columnType: ColumnLabelFormat['columnType'];
  convertNumberTo: ColumnLabelFormat['convertNumberTo'];
}> = React.memo(({ onUpdateColumnConfig, style, convertNumberTo, columnType }) => {
  const enabledOptions: ColumnLabelFormat['style'][] = useMemo(() => {
    if (isNumericColumnType(columnType))
      return ['number', 'percent', 'currency', convertNumberTo ? 'date' : undefined].filter(
        Boolean
      ) as ColumnLabelFormat['style'][];
    if (isDateColumnType(columnType)) return ['date'];
    return [] as ColumnLabelFormat['style'][];
  }, [columnType]);

  const options = useMemo(() => {
    const filteredOptions = enabledOptions.map((option) => ColumnTypeIcon[option]);
    return filteredOptions.map((option) => ({
      value: option.value,
      tooltip: option.tooltip,
      icon: option.icon
    }));
  }, [enabledOptions]);

  const onChange = useMemoizedFn((value: SegmentedItem<string>) => {
    onUpdateColumnConfig({
      style: value.value as ColumnLabelFormat['style']
    });
  });

  if (enabledOptions.length === 0) return null;

  return (
    <LabelAndInput label="Style" dataTestId="edit-label-style-input">
      <div className="flex items-center justify-end">
        <AppSegmented options={options} value={style} type="button" onChange={onChange} />
      </div>
    </LabelAndInput>
  );
});
EditLabelStyle.displayName = 'EditLabelStyle';
