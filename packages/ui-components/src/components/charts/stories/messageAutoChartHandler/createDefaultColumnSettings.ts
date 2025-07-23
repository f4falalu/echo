import {
  type ChartConfigProps,
  type ColumnMetaData,
  DEFAULT_COLUMN_SETTINGS,
} from '@buster/server-shared/metrics';
import type { ColumnSettings } from '@buster/server-shared/metrics';
import { create } from 'mutative';

export const createDefaultColumnSettings = (
  existingColumnSettings: Record<string, ColumnSettings> | undefined,
  columnsMetaData: ColumnMetaData[] | undefined
): ChartConfigProps['columnSettings'] => {
  if (!columnsMetaData) return {};

  return create({} as ChartConfigProps['columnSettings'], (draft) => {
    for (const column of columnsMetaData) {
      draft[column.name] = create(DEFAULT_COLUMN_SETTINGS, (settingsDraft) => {
        if (existingColumnSettings?.[column.name]) {
          Object.assign(settingsDraft, existingColumnSettings[column.name]);
        }
      });
    }
  });
};
