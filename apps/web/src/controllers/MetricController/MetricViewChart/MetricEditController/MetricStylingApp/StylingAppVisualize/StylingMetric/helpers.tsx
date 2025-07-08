import type { ColumnMetaData, ChartConfigProps } from '@buster/server-shared/metrics';
import type { SelectItem } from '@/components/ui/select';
import { formatLabel } from '@/lib';
import { ColumnTypeIcon } from '../SelectAxis/config';

export const createColumnFieldOptions = (
  columnMetadata: ColumnMetaData[],
  columnLabelFormats: ChartConfigProps['columnLabelFormats'],
  iconClass: string
): SelectItem<string>[] => {
  return columnMetadata.map<SelectItem<string>>((column) => {
    const labelFormat = columnLabelFormats[column.name];
    const formattedLabel = formatLabel(column.name, labelFormat, true);
    const Icon = ColumnTypeIcon[labelFormat.style];

    return {
      icon: Icon.icon,
      label: formattedLabel,
      value: column.name
    };
  });
};
