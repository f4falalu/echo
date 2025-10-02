import type { ColumnLabelFormat } from '@buster/server-shared/metrics';
import first from 'lodash/last';
import React, { useMemo } from 'react';
import { CircleInfo } from '@/components/ui/icons';
import { Select, type SelectItem } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { formatDate, getNow } from '@/lib/date';
import { LabelAndInput } from '../../../Common/LabelAndInput';
import { WarningIcon } from '../../../Common/WarningIcon';
import {
  getDefaultDateOptions,
  getDefaultDayOfWeekOptions,
  getDefaultMonthOptions,
  getDefaultQuarterOptions,
  NO_FORMATTING_ITEM,
} from './dateConfig';

export const EditDateFormat: React.FC<{
  dateFormat: ColumnLabelFormat['dateFormat'];
  convertNumberTo: ColumnLabelFormat['convertNumberTo'];
  isUTC: ColumnLabelFormat['isUTC'];
  columnType: ColumnLabelFormat['columnType'];
  onUpdateColumnConfig: (columnLabelFormat: Partial<ColumnLabelFormat>) => void;
}> = React.memo(({ dateFormat, columnType, convertNumberTo, onUpdateColumnConfig, isUTC }) => {
  const now = useMemo(() => getNow().toDate(), []);

  const useAlternateFormats = useMemo(() => {
    return columnType === 'number' && convertNumberTo;
  }, [columnType, convertNumberTo]);

  const defaultOptions = useMemo(() => {
    if (useAlternateFormats === 'day_of_week') return getDefaultDayOfWeekOptions(now);
    if (useAlternateFormats === 'month_of_year') return getDefaultMonthOptions(now);
    if (useAlternateFormats === 'quarter') return getDefaultQuarterOptions(now);
    return getDefaultDateOptions(now);
  }, [useAlternateFormats]);

  const selectOptions: SelectItem[] = useMemo(() => {
    const dateFormatIsInDefaultOptions = defaultOptions.some(({ value }) => value === dateFormat);
    if (!dateFormat || dateFormatIsInDefaultOptions || useAlternateFormats) return defaultOptions;
    return [
      ...defaultOptions,
      {
        label: formatDate({
          date: now,
          format: dateFormat,
        }),
        value: dateFormat,
      },
    ].filter(({ value }) => value);
  }, [dateFormat, defaultOptions, useAlternateFormats]);

  const selectedOption = useMemo(() => {
    if (dateFormat === '') return NO_FORMATTING_ITEM;
    return selectOptions.find((option) => option.value === dateFormat) || first(selectOptions);
  }, [dateFormat, selectOptions]);

  const onChange = (value: ColumnLabelFormat['dateFormat']) => {
    if (value === NO_FORMATTING_ITEM.value) {
      onUpdateColumnConfig({
        dateFormat: '',
      });
    } else {
      onUpdateColumnConfig({
        dateFormat: value,
      });
    }
  };

  const onUpdateUTC = (value: boolean) => {
    onUpdateColumnConfig({
      isUTC: value,
    });
  };

  return (
    <>
      <LabelAndInput label="Date format">
        <Select
          key={convertNumberTo}
          className="w-full!"
          items={selectOptions}
          value={selectedOption?.value}
          onChange={onChange}
        />
      </LabelAndInput>
      <LabelAndInput label="UTC Offset">
        <div className="flex w-full justify-end gap-x-2">
          <WarningIcon
            showWarning={true}
            className="max-w-[300px]"
            icon={<CircleInfo />}
            warningText="When UTC Offset is enabled, dates are displayed with timezone information. Use this when data is stored in different timezones or when timezone context matters. Buster tries the correct timezone and UTC Offset for each date. Note: When data is truncated (e.g., DATE_TRUNC to day/month/quarter), timezone differences are lost during truncation — the data is bucketed first, then timezone offsets are applied to the labels."
          />
          <Switch checked={isUTC} onCheckedChange={onUpdateUTC} />
        </div>
      </LabelAndInput>
    </>
  );
});
EditDateFormat.displayName = 'EditDateFormat';
