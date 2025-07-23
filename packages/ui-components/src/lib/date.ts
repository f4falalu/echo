import {
  type ColumnLabelFormat,
  DEFAULT_DATE_FORMAT_MONTH_OF_YEAR,
  DEFAULT_DATE_FORMAT_QUARTER,
  DEFAULT_DAY_OF_WEEK_FORMAT,
} from '@buster/server-shared/metrics';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import quarterOfYear from 'dayjs/plugin/quarterOfYear';
import relativeTime from 'dayjs/plugin/relativeTime';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import isDate from 'lodash/isDate';
import lodashIsNaN from 'lodash/isNaN';
import isNumber from 'lodash/isNumber';
import isString from 'lodash/isString';
import { isNumeric } from './numbers';

dayjs.extend(relativeTime);
dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(quarterOfYear);

export const createDayjsDate = (date: string | Date) => dayjs(date);

export const formatDate = ({
  date,
  format,
  isUTC = false,
  ignoreValidation = true,
  convertNumberTo = null,
}: {
  date: string | number | Date;
  format: string;
  isUTC?: boolean;
  ignoreValidation?: boolean;
  convertNumberTo?: ColumnLabelFormat['convertNumberTo'];
}): string => {
  try {
    const myDate = extractDateForFormatting(date, convertNumberTo);

    const valid = ignoreValidation
      ? true
      : !!(myDate as dayjs.Dayjs)?.toDate ||
        isDateValid({
          date: myDate as string,
        });

    if (convertNumberTo) {
      if (convertNumberTo === 'day_of_week') {
        const validDayFormats = ['dddd', 'ddd', 'dd', 'd'];
        if (!validDayFormats.includes(format)) {
          format = DEFAULT_DAY_OF_WEEK_FORMAT;
        }
      } else if (convertNumberTo === 'month_of_year') {
        const validMonthFormats = ['MMMM', 'MMM', 'MM', 'M'];
        if (!validMonthFormats.includes(format)) {
          format = DEFAULT_DATE_FORMAT_MONTH_OF_YEAR;
        }
      } else if (convertNumberTo === 'quarter') {
        const validQuarterFormats = ['YYYY [Q]Q', 'Q'];
        if (!validQuarterFormats.includes(format)) {
          format = DEFAULT_DATE_FORMAT_QUARTER;
        }
      } else if (convertNumberTo === 'number') {
        return String(date);
      } else {
        const _exhaustiveCheck: never = convertNumberTo;
      }
    }

    const theDate = valid
      ? isUTC
        ? dayjs.utc(myDate).format(format)
        : dayjs(myDate).format(format)
      : String(date);

    if (theDate === 'Invalid Date') {
      return String(date);
    }
    return theDate;
  } catch {
    return String(date);
  }
};

const numberDateFallback = (
  date: string | number | Date,
  convertNumberTo?: ColumnLabelFormat['convertNumberTo']
) => {
  if (convertNumberTo === 'day_of_week' && isNumber(date) && valueIsValidDayOfWeek(date)) {
    return dayjs().day(Number(date)).startOf('day');
  }
  if (valueIsValidMonth(date) || convertNumberTo === 'month_of_year') {
    return dayjs()
      .month(Number(date) - 1)
      .startOf('month')
      .startOf('day');
  }

  const numericDate = Number(date);
  if (!lodashIsNaN(numericDate)) {
    // Check for 13 digit timestamp (milliseconds)
    if (String(numericDate).length === 13) {
      return dayjs(numericDate);
    }
    // Check for 10 digit timestamp (seconds)
    if (String(numericDate).length === 10) {
      return dayjs.unix(numericDate);
    }
  }

  return String(date);
};

const extractDateForFormatting = (
  date: string | number | Date,

  convertNumberTo?: ColumnLabelFormat['convertNumberTo']
) => {
  if (isString(date)) return date;
  if (isNumber(date)) return numberDateFallback(date, convertNumberTo);
  if (isDate(date)) return new Date(date);
  return String(date);
};

export const valueIsValidMonth = (value: string | number | Date | undefined) => {
  if (value === undefined || value === null) return false;
  const month = Number(value);
  return month > 0 && month <= 12;
};

const valueIsValidDayOfWeek = (value: string | number | Date | undefined) => {
  if (value === undefined || value === null) return false;
  const day = Number(value);
  return day >= 0 && day <= 7;
};

// const VALID_DATE_FORMATS = [
//   'YYYY-MM-DD',
//   'YYYY-MM',
//   'YYYY-MM-DDTHH:mm:ss',
//   'YYYY-MM-DD HH:mm:ss',
//   'YYYY-MM-DDTHH:mm:ss.sssZ',
//   'YYYY-MM-DDTHH:mm:ssZ',
//   'YYYY-MM-DD HH:mm:ssZ',
//   'YYYY-MM-DD HH:mm:ss.sssZ',
//   'YYYY-MM-DD HH:mm:ss.sss',
//   'YYYY-MM-DDTHH:mm:ss.sss',
//   'YYYY-MM-DDTHH:mm:ssZ',
//   'YYYY-MM-DDTHH:mm:ss',
//   'YYYY-MM-DD HH:mm:ss',
//   'YYYY-MM-DD HH:mm',
//   'YYYY-MM-DDTHH:mm',
//   'YYYY-MM-DD HH',
//   'YYYY-MM-DD HH:mm:ss.SSS',
//   'YYYY-MM-DDTHH:mm:ss.SSS',
//   'YYYY-MM-DDTHH:mm:ss.SSSZ',
//   'YYYY-MM-DD HH:mm:ss.SSSZ',
//   'YYYY-MM-DDTHH:mm:ss.SSS',
//   'MM DD YYYY',
//   'M D YYYY',
//   'MMM D, YYYY',
//   'MMMM D, YYYY',
// ];

const isDateValid = ({
  date,

  useNumbersAsDateKey = true,
}: {
  date: string | number | Date | undefined;

  useNumbersAsDateKey?: boolean;
}) => {
  if (isDate(date)) return true;
  if (useNumbersAsDateKey && isNumeric(date as string)) {
    return valueIsValidMonth(date || '');
  }
  if (!date || isNumber(date)) return false;
  const hyphenCount = (date.match(/-/g) || []).length;
  const twoHyphens = hyphenCount === 2;

  let filter = false;
  if (date.includes('T') && twoHyphens)
    filter = true; //2023-10-17T01:33:45 , YYYY-MM-DD HH:mm:ss.
  else if (date.includes('Z') && twoHyphens)
    filter = true; //YYYY-MM-DDTHH:mm:ss.sssZ
  else if (twoHyphens && date.length === 10)
    filter = true; //2023-10-17
  else if (date.length === 13 && lodashIsNaN(Number(date)))
    filter = true; // 1634468020000
  else if (date.length === 10 && lodashIsNaN(Number(date))) filter = true; // 1634468020

  if (filter) return filter && dayjs(date).isValid();

  return true;

  //  return VALID_DATE_FORMATS.some((format) => dayjs(date, format, true).isValid());
};
