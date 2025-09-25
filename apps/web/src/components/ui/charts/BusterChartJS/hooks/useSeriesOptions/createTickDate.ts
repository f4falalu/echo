import { type ColumnLabelFormat, DEFAULT_COLUMN_LABEL_FORMAT } from '@buster/server-shared/metrics';
import { createDayjsDate } from '@/lib/date';

export const createTickDates = (
  ticks: (string | number)[][],
  xAxisKeys: string[],
  columnLabelFormats: Record<string, ColumnLabelFormat>
): (Date | string)[] | null => {
  const xColumnLabelFormats = xAxisKeys.map(
    (key) => columnLabelFormats[key] || DEFAULT_COLUMN_LABEL_FORMAT
  );
  console.log(xColumnLabelFormats);
  const useDateLabels = xColumnLabelFormats.some(
    (format) =>
      (format.columnType === 'date' && format.style === 'date') ||
      (format.columnType === 'number' && format.style === 'date')
  );

  console.log(useDateLabels, ticks, columnLabelFormats);

  if (!useDateLabels) {
    return null;
  }

  const isSingleXAxis = xAxisKeys.length === 1;

  //most common case
  if (isSingleXAxis) {
    const dateTicks = ticks.flatMap((item) => {
      return item.map<Date>((item) => {
        return createDayjsDate(item as string).toDate(); //do not join because it will turn into a string
      });
    });
    console.log('dateTicks', dateTicks);
    return dateTicks;
  }

  return null;
};
