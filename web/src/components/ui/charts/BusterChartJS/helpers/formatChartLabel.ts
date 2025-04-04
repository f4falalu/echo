import type { BusterChartProps } from '@/api/asset_interfaces/metric';
import { extractFieldsFromChain, appendToKeyValueChain } from '../../chartHooks';
import { formatChartLabelDelimiter } from '../../commonHelpers';

export const formatChartLabel = (
  label: string,
  columnLabelFormats: NonNullable<BusterChartProps['columnLabelFormats']>,
  hasMultipleMeasures: boolean,
  hasCategoryAxis: boolean
): string => {
  if (hasCategoryAxis && !hasMultipleMeasures) {
    const fields = extractFieldsFromChain(label);
    const lastField = fields.at(0)!;
    const newLabel = appendToKeyValueChain(lastField);
    return formatChartLabelDelimiter(newLabel, columnLabelFormats);
  }

  if (!hasMultipleMeasures) {
    const fields = extractFieldsFromChain(label);
    const lastField = fields.at(-1)!;
    return formatChartLabelDelimiter(lastField.value || lastField.key, columnLabelFormats);
  }

  return formatChartLabelDelimiter(label, columnLabelFormats);
};
