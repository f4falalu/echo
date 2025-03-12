import {
  ColumnLabelFormat,
  DEFAULT_COLUMN_LABEL_FORMAT,
  IColumnLabelFormat,
  type ColumnMetaData,
  type IBusterMetricChartConfig,
  type SimplifiedColumnType
} from '@/api/asset_interfaces/metric';
import { isDateColumnType, isNumericColumnType, simplifyColumnType } from '@/lib/messages';

export const createDefaultColumnLabelFormats = (
  columnLabelFormats: Record<string, IColumnLabelFormat> | undefined,
  columnsMetaData: ColumnMetaData[] | undefined
): IBusterMetricChartConfig['columnLabelFormats'] => {
  if (!columnsMetaData) return {};

  return columnsMetaData.reduce(
    (acc, column) => {
      const existingLabelFormat = columnLabelFormats?.[column.name] || {};
      acc[column.name] = {
        ...createDefaulColumnLabel(columnsMetaData, column.name),
        ...existingLabelFormat
      };
      return acc;
    },
    {} as IBusterMetricChartConfig['columnLabelFormats']
  );
};

const createDefaultReplaceMissingDataWith = (simpleType: SimplifiedColumnType): null | 0 => {
  if (simpleType === 'number') return 0;
  if (simpleType === 'string') return null;
  if (simpleType === 'date') return null;
  return null;
};

const createDefaulColumnLabel = (
  columnsMetaData: ColumnMetaData[],
  name: string
): Required<ColumnLabelFormat> => {
  const assosciatedColumn = columnsMetaData?.find((m) => m.name === name)!;
  const columnType: SimplifiedColumnType = simplifyColumnType(assosciatedColumn?.simple_type);
  const style = createDefaultColumnLabelStyle(columnType);
  const replaceMissingDataWith = createDefaultReplaceMissingDataWith(columnType);

  return {
    ...DEFAULT_COLUMN_LABEL_FORMAT,
    style,
    columnType,
    replaceMissingDataWith
  };
};

const createDefaultColumnLabelStyle = (
  columnType: SimplifiedColumnType
): IColumnLabelFormat['style'] => {
  if (isDateColumnType(columnType)) return 'date';
  if (isNumericColumnType(columnType)) return 'number';
  return 'string';
};
